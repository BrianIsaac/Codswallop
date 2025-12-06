import * as vscode from 'vscode';
import { getEventBus, IndicatorType, FunctionComplexity } from './event-bus';
import { getComplexityAnalyser } from './complexity-analyser';
import { getDocumentTracker } from './document-tracker';

/**
 * Represents an active vibe detection.
 */
export interface VibeDetection {
  uri: string;
  line: number;
  triggeredBy: IndicatorType;
  indicatorValue: number;
  threshold: number;
  codeSnippet: string;
  timestamp: number;
}

/**
 * Orchestrates all vibe coding detection mechanisms with deduplication.
 *
 * Immediate trigger system: Any single indicator exceeding its threshold
 * triggers a vibecheck. 60-second cooldown per uri:line location.
 */
export class VibeDetector implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private activeDetections = new Map<string, VibeDetection>();
  private cooldowns = new Map<string, number>();
  private readonly cooldownMs: number;

  constructor() {
    const config = vscode.workspace.getConfiguration('codswallop');
    this.cooldownMs = config.get<number>('debounceWindow', 60000);

    this.setupListeners();
  }

  /**
   * Sets up event listeners for detection triggers.
   */
  private setupListeners(): void {
    const eventBus = getEventBus();

    const complexityHandler = eventBus.on('complexity:analysed', (data) => {
      this.checkComplexityThresholds(data.uri, data.functions);
    });

    const pasteHandler = eventBus.on('document:pasted', (data) => {
      this.handlePasteDetection(data);
    });

    const changeHandler = eventBus.on('document:changed', (data) => {
      this.checkLineSpikeThreshold(data.uri);
    });

    this.disposables.push(complexityHandler, pasteHandler, changeHandler);
  }

  /**
   * Checks complexity thresholds for all functions in a document.
   */
  private checkComplexityThresholds(uri: string, functions: FunctionComplexity[]): void {
    const config = vscode.workspace.getConfiguration('codswallop');
    const threshold = config.get<number>('thresholds.complexity', 20);

    for (const func of functions) {
      if (func.complexity > threshold) {
        this.triggerDetection(uri, func.line, 'high_complexity', func.complexity, threshold);
      }
    }
  }

  /**
   * Handles paste detection events.
   */
  private handlePasteDetection(data: {
    uri: string;
    content: string;
    lineCount: number;
    cursorLine: number;
  }): void {
    const config = vscode.workspace.getConfiguration('codswallop');
    const threshold = config.get<number>('thresholds.pasteLines', 10);

    if (data.lineCount >= threshold) {
      this.triggerDetection(
        data.uri,
        data.cursorLine,
        'paste',
        data.lineCount,
        threshold,
        data.content
      );
    }
  }

  /**
   * Checks line spike threshold for a document.
   */
  private checkLineSpikeThreshold(uri: string): void {
    const tracker = getDocumentTracker();
    const { detected, rate } = tracker.hasLineSpike(uri);

    if (detected) {
      const config = vscode.workspace.getConfiguration('codswallop');
      const threshold = config.get<number>('thresholds.lineSpike', 50);

      const editor = vscode.window.visibleTextEditors.find(
        (e) => e.document.uri.toString() === uri
      );
      const line = editor?.selection.active.line ?? 0;

      this.triggerDetection(uri, line, 'line_spike', rate, threshold);
    }
  }

  /**
   * Triggers a vibe detection if not in cooldown.
   */
  private async triggerDetection(
    uri: string,
    line: number,
    triggeredBy: IndicatorType,
    indicatorValue: number,
    threshold: number,
    content?: string
  ): Promise<void> {
    const locationKey = `${uri}:${line}`;
    const now = Date.now();

    const lastTrigger = this.cooldowns.get(locationKey);
    if (lastTrigger && now - lastTrigger < this.cooldownMs) {
      return;
    }

    this.cooldowns.set(locationKey, now);
    this.cleanupOldCooldowns();

    const codeSnippet = content ?? (await this.getCodeSnippet(uri, line));

    const detection: VibeDetection = {
      uri,
      line,
      triggeredBy,
      indicatorValue,
      threshold,
      codeSnippet,
      timestamp: now,
    };

    const detectionKey = `${uri}:${line}:${triggeredBy}`;
    this.activeDetections.set(detectionKey, detection);

    getEventBus().fire('vibe:detected', detection);
  }

  /**
   * Gets a code snippet around the specified line.
   */
  private async getCodeSnippet(uri: string, line: number): Promise<string> {
    try {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
      const startLine = Math.max(0, line - 2);
      const endLine = Math.min(document.lineCount - 1, line + 10);

      const lines: string[] = [];
      for (let i = startLine; i <= endLine; i++) {
        lines.push(document.lineAt(i).text);
      }

      return lines.join('\n');
    } catch {
      return '';
    }
  }

  /**
   * Clears a detection at a specific location.
   */
  clearDetection(uri: string, line: number): void {
    const keysToDelete: string[] = [];

    for (const key of this.activeDetections.keys()) {
      if (key.startsWith(`${uri}:${line}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.activeDetections.delete(key);
    }

    if (keysToDelete.length > 0) {
      getEventBus().fire('vibe:cleared', { uri, line });
    }
  }

  /**
   * Gets all active detections.
   */
  getActiveDetections(): VibeDetection[] {
    return Array.from(this.activeDetections.values());
  }

  /**
   * Gets active detections for a specific document.
   */
  getDocumentDetections(uri: string): VibeDetection[] {
    return Array.from(this.activeDetections.values()).filter((d) => d.uri === uri);
  }

  /**
   * Clears detections older than the cooldown period.
   */
  private cleanupOldCooldowns(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, timestamp] of this.cooldowns) {
      if (now - timestamp > this.cooldownMs * 2) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cooldowns.delete(key);
    }
  }

  /**
   * Clears all detections for a document.
   */
  clearDocumentDetections(uri: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.activeDetections.keys()) {
      if (key.startsWith(uri)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.activeDetections.delete(key);
    }
  }

  dispose(): void {
    this.activeDetections.clear();
    this.cooldowns.clear();
    this.disposables.forEach((d) => d.dispose());
  }
}

let vibeDetector: VibeDetector | undefined;

/**
 * Gets the singleton VibeDetector instance.
 */
export function getVibeDetector(): VibeDetector {
  if (!vibeDetector) {
    vibeDetector = new VibeDetector();
  }
  return vibeDetector;
}
