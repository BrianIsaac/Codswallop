import * as vscode from 'vscode';
import * as path from 'path';
import { getEventBus, IndicatorType } from './event-bus';
import { getVibeDetector, VibeDetection } from './vibe-detector';

/**
 * Manages gutter icon decorations for vibe detections.
 *
 * Each indicator type displays a unique mascot icon:
 * - line_spike: vibe-rushing.svg (speed lines)
 * - high_complexity: vibe-confused.svg (spiral eyes)
 * - paste: vibe-clipboard.svg (holding clipboard)
 */
export class DecorationManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private decorationTypes = new Map<IndicatorType, vscode.TextEditorDecorationType>();
  private activeDecorations = new Map<string, Map<IndicatorType, vscode.Range[]>>();

  constructor(private context: vscode.ExtensionContext) {
    this.createDecorationTypes();
    this.setupListeners();
  }

  /**
   * Creates decoration types for each indicator.
   */
  private createDecorationTypes(): void {
    const indicatorIcons: Record<IndicatorType, string> = {
      line_spike: 'vibe-rushing.svg',
      high_complexity: 'vibe-confused.svg',
      paste: 'vibe-clipboard.svg',
    };

    for (const [indicator, iconFile] of Object.entries(indicatorIcons)) {
      const iconPath = path.join(this.context.extensionPath, 'media', iconFile);

      const decorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.file(iconPath),
        gutterIconSize: 'contain',
        overviewRulerColor: this.getIndicatorColour(indicator as IndicatorType),
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      });

      this.decorationTypes.set(indicator as IndicatorType, decorationType);
    }
  }

  /**
   * Gets the colour for an indicator type.
   */
  private getIndicatorColour(indicator: IndicatorType): string {
    const colours: Record<IndicatorType, string> = {
      line_spike: '#FFA500', // Orange
      high_complexity: '#FF6347', // Tomato
      paste: '#9370DB', // Medium purple
    };
    return colours[indicator];
  }

  /**
   * Sets up event listeners for decoration updates.
   */
  private setupListeners(): void {
    const eventBus = getEventBus();

    const detectedHandler = eventBus.on('vibe:detected', (data) => {
      this.addDecoration(data);
    });

    const clearedHandler = eventBus.on('vibe:cleared', (data) => {
      this.removeDecoration(data.uri, data.line);
    });

    const completedHandler = eventBus.on('vibecheck:completed', () => {
      this.refreshAllDecorations();
    });

    const editorChangeHandler = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.applyDecorations(editor);
      }
    });

    this.disposables.push(
      detectedHandler,
      clearedHandler,
      completedHandler,
      editorChangeHandler
    );
  }

  /**
   * Adds a decoration for a detection.
   */
  private addDecoration(detection: VibeDetection): void {
    const uri = detection.uri;

    if (!this.activeDecorations.has(uri)) {
      this.activeDecorations.set(uri, new Map());
    }

    const docDecorations = this.activeDecorations.get(uri)!;

    if (!docDecorations.has(detection.triggeredBy)) {
      docDecorations.set(detection.triggeredBy, []);
    }

    const ranges = docDecorations.get(detection.triggeredBy)!;
    const range = new vscode.Range(detection.line, 0, detection.line, 0);

    const exists = ranges.some((r) => r.start.line === detection.line);
    if (!exists) {
      ranges.push(range);
    }

    this.applyDecorationsToUri(uri);
  }

  /**
   * Removes decorations at a specific line.
   */
  private removeDecoration(uri: string, line: number): void {
    const docDecorations = this.activeDecorations.get(uri);
    if (!docDecorations) {
      return;
    }

    for (const [indicator, ranges] of docDecorations) {
      const filtered = ranges.filter((r) => r.start.line !== line);
      if (filtered.length !== ranges.length) {
        docDecorations.set(indicator, filtered);
      }
    }

    this.applyDecorationsToUri(uri);
  }

  /**
   * Applies decorations to a specific URI.
   */
  private applyDecorationsToUri(uri: string): void {
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.toString() === uri
    );

    if (editor) {
      this.applyDecorations(editor);
    }
  }

  /**
   * Applies all active decorations to an editor.
   */
  private applyDecorations(editor: vscode.TextEditor): void {
    const uri = editor.document.uri.toString();
    const docDecorations = this.activeDecorations.get(uri);

    for (const [indicator, decorationType] of this.decorationTypes) {
      if (docDecorations && docDecorations.has(indicator)) {
        const ranges = docDecorations.get(indicator)!;
        editor.setDecorations(decorationType, ranges);
      } else {
        editor.setDecorations(decorationType, []);
      }
    }
  }

  /**
   * Refreshes all decorations from active detections.
   */
  refreshAllDecorations(): void {
    this.activeDecorations.clear();

    const detections = getVibeDetector().getActiveDetections();
    for (const detection of detections) {
      const uri = detection.uri;

      if (!this.activeDecorations.has(uri)) {
        this.activeDecorations.set(uri, new Map());
      }

      const docDecorations = this.activeDecorations.get(uri)!;

      if (!docDecorations.has(detection.triggeredBy)) {
        docDecorations.set(detection.triggeredBy, []);
      }

      const ranges = docDecorations.get(detection.triggeredBy)!;
      ranges.push(new vscode.Range(detection.line, 0, detection.line, 0));
    }

    for (const editor of vscode.window.visibleTextEditors) {
      this.applyDecorations(editor);
    }
  }

  /**
   * Clears all decorations for a document.
   */
  clearDocumentDecorations(uri: string): void {
    this.activeDecorations.delete(uri);
    this.applyDecorationsToUri(uri);
  }

  /**
   * Clears all decorations.
   */
  clearAllDecorations(): void {
    this.activeDecorations.clear();

    for (const editor of vscode.window.visibleTextEditors) {
      for (const decorationType of this.decorationTypes.values()) {
        editor.setDecorations(decorationType, []);
      }
    }
  }

  dispose(): void {
    this.clearAllDecorations();

    for (const decorationType of this.decorationTypes.values()) {
      decorationType.dispose();
    }

    this.decorationTypes.clear();
    this.activeDecorations.clear();
    this.disposables.forEach((d) => d.dispose());
  }
}

let decorationManager: DecorationManager | undefined;

/**
 * Initialises the DecorationManager with extension context.
 */
export function initDecorationManager(context: vscode.ExtensionContext): DecorationManager {
  if (!decorationManager) {
    decorationManager = new DecorationManager(context);
  }
  return decorationManager;
}

/**
 * Gets the DecorationManager instance.
 */
export function getDecorationManager(): DecorationManager | undefined {
  return decorationManager;
}
