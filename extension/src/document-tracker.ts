import * as vscode from 'vscode';
import { getEventBus } from './event-bus';

/**
 * Tracks document changes and detects vibe coding indicators:
 * - Line spike: >50 lines added in <1 minute
 * - Paste detection: >10 lines inserted in <100ms
 */
export class DocumentTracker implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private lineHistory = new Map<string, LineChange[]>();
  private lastChangeTime = new Map<string, number>();
  private readonly lineSpikeWindow = 60000; // 1 minute
  private readonly pasteTimeThreshold = 100; // 100ms

  constructor() {
    this.setupListeners();
  }

  /**
   * Sets up document change and clipboard listeners.
   */
  private setupListeners(): void {
    const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.isTrackableDocument(event.document)) {
        this.handleDocumentChange(event);
      }
    });

    const closeDisposable = vscode.workspace.onDidCloseTextDocument((document) => {
      const uri = document.uri.toString();
      this.lineHistory.delete(uri);
      this.lastChangeTime.delete(uri);
    });

    this.disposables.push(changeDisposable, closeDisposable);
  }

  /**
   * Checks if a document should be tracked.
   */
  private isTrackableDocument(document: vscode.TextDocument): boolean {
    const supportedLanguages = [
      'typescript',
      'javascript',
      'typescriptreact',
      'javascriptreact',
      'python',
    ];
    return (
      supportedLanguages.includes(document.languageId) && document.uri.scheme === 'file'
    );
  }

  /**
   * Handles a document change event.
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const uri = event.document.uri.toString();
    const now = Date.now();

    const lastTime = this.lastChangeTime.get(uri) || now;
    const timeDelta = now - lastTime;
    this.lastChangeTime.set(uri, now);

    let totalLinesAdded = 0;
    let maxSingleInsert = 0;
    let insertLine = 0;
    let insertedContent = '';

    for (const change of event.contentChanges) {
      const linesAdded = change.text.split('\n').length - 1;
      const linesRemoved = change.range.end.line - change.range.start.line;
      const netLines = linesAdded - linesRemoved;

      if (netLines > 0) {
        totalLinesAdded += netLines;

        if (linesAdded > maxSingleInsert) {
          maxSingleInsert = linesAdded;
          insertLine = change.range.start.line;
          insertedContent = change.text;
        }
      }
    }

    if (totalLinesAdded > 0) {
      this.recordLineChange(uri, totalLinesAdded, now);
      getEventBus().fire('document:changed', {
        uri,
        linesDelta: totalLinesAdded,
        timestamp: now,
      });
    }

    if (maxSingleInsert > 0 && timeDelta < this.pasteTimeThreshold) {
      this.detectPaste(uri, insertedContent, maxSingleInsert, insertLine);
    }
  }

  /**
   * Records a line change for line spike detection.
   */
  private recordLineChange(uri: string, linesAdded: number, timestamp: number): void {
    let history = this.lineHistory.get(uri);
    if (!history) {
      history = [];
      this.lineHistory.set(uri, history);
    }

    history.push({ lines: linesAdded, timestamp });

    const cutoff = timestamp - this.lineSpikeWindow;
    const filtered = history.filter((h) => h.timestamp >= cutoff);
    this.lineHistory.set(uri, filtered);
  }

  /**
   * Detects a potential paste operation.
   */
  private detectPaste(
    uri: string,
    content: string,
    lineCount: number,
    cursorLine: number
  ): void {
    const config = vscode.workspace.getConfiguration('codswallop');
    const threshold = config.get<number>('thresholds.pasteLines', 10);

    if (lineCount >= threshold) {
      getEventBus().fire('document:pasted', {
        uri,
        content,
        lineCount,
        cursorLine,
      });
    }
  }

  /**
   * Gets the lines per minute rate for a document.
   */
  getLinesPerMinute(uri: string): number {
    const history = this.lineHistory.get(uri);
    if (!history || history.length === 0) {
      return 0;
    }

    const now = Date.now();
    const cutoff = now - this.lineSpikeWindow;
    const recentChanges = history.filter((h) => h.timestamp >= cutoff);

    const totalLines = recentChanges.reduce((sum, h) => sum + h.lines, 0);

    if (recentChanges.length < 2) {
      return totalLines;
    }

    const timeSpan = now - recentChanges[0].timestamp;
    const minutes = Math.max(timeSpan / 60000, 1 / 60); // Minimum 1 second

    return Math.round(totalLines / minutes);
  }

  /**
   * Checks if a document has a line spike above the threshold.
   */
  hasLineSpike(uri: string, threshold?: number): { detected: boolean; rate: number } {
    const config = vscode.workspace.getConfiguration('codswallop');
    const lineSpikeThreshold = threshold ?? config.get<number>('thresholds.lineSpike', 50);

    const rate = this.getLinesPerMinute(uri);
    return {
      detected: rate > lineSpikeThreshold,
      rate,
    };
  }

  /**
   * Clears tracking data for a specific document or all documents.
   */
  clearHistory(uri?: string): void {
    if (uri) {
      this.lineHistory.delete(uri);
      this.lastChangeTime.delete(uri);
    } else {
      this.lineHistory.clear();
      this.lastChangeTime.clear();
    }
  }

  dispose(): void {
    this.lineHistory.clear();
    this.lastChangeTime.clear();
    this.disposables.forEach((d) => d.dispose());
  }
}

interface LineChange {
  lines: number;
  timestamp: number;
}

let documentTracker: DocumentTracker | undefined;

/**
 * Gets the singleton DocumentTracker instance.
 */
export function getDocumentTracker(): DocumentTracker {
  if (!documentTracker) {
    documentTracker = new DocumentTracker();
  }
  return documentTracker;
}
