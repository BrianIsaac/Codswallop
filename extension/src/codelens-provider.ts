import * as vscode from 'vscode';
import { getEventBus, IndicatorType } from './event-bus';
import { getVibeDetector, VibeDetection } from './vibe-detector';

/**
 * Provides CodeLens indicators for vibe detections.
 *
 * Displays clickable "Take Quiz" prompts above suspicious code
 * with indicator-specific labels.
 */
export class VibecheckCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.setupListeners();
  }

  /**
   * Sets up event listeners to refresh CodeLenses.
   */
  private setupListeners(): void {
    const eventBus = getEventBus();

    const detectedHandler = eventBus.on('vibe:detected', () => {
      this._onDidChangeCodeLenses.fire();
    });

    const clearedHandler = eventBus.on('vibe:cleared', () => {
      this._onDidChangeCodeLenses.fire();
    });

    const completedHandler = eventBus.on('vibecheck:completed', () => {
      this._onDidChangeCodeLenses.fire();
    });

    this.disposables.push(detectedHandler, clearedHandler, completedHandler);
  }

  /**
   * Provides CodeLenses for the given document.
   */
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const uri = document.uri.toString();
    const detections = getVibeDetector().getDocumentDetections(uri);

    const lenses: vscode.CodeLens[] = [];
    const seenLines = new Set<number>();

    for (const detection of detections) {
      if (seenLines.has(detection.line)) {
        continue;
      }
      seenLines.add(detection.line);

      const range = new vscode.Range(detection.line, 0, detection.line, 0);
      const title = this.getCodeLensTitle(detection);

      const lens = new vscode.CodeLens(range, {
        title,
        command: 'codswallop.startVibecheck',
        arguments: [detection],
        tooltip: this.getTooltip(detection),
      });

      lenses.push(lens);
    }

    return lenses;
  }

  /**
   * Resolves a CodeLens (not needed as we provide full commands upfront).
   */
  resolveCodeLens(codeLens: vscode.CodeLens): vscode.CodeLens {
    return codeLens;
  }

  /**
   * Generates the CodeLens title based on indicator type.
   */
  private getCodeLensTitle(detection: VibeDetection): string {
    const labels: Record<IndicatorType, (value: number) => string> = {
      high_complexity: (v) => `$(warning) High Complexity: ${v} [Take Quiz]`,
      line_spike: (v) => `$(rocket) Line Spike: ${v} lines/min [Take Quiz]`,
      paste: (v) => `$(clippy) Paste Detected: ${v} lines [Take Quiz]`,
    };

    const labelFn = labels[detection.triggeredBy];
    return labelFn ? labelFn(detection.indicatorValue) : `[Take Quiz]`;
  }

  /**
   * Generates tooltip text for the CodeLens.
   */
  private getTooltip(detection: VibeDetection): string {
    const tooltips: Record<IndicatorType, string> = {
      high_complexity:
        'This code has high cyclomatic complexity. Click to test your understanding.',
      line_spike:
        'A lot of code was added quickly here. Click to verify your understanding.',
      paste:
        'This code appears to have been pasted. Click to check that you understand it.',
    };

    return tooltips[detection.triggeredBy] || 'Click to start a vibecheck';
  }

  dispose(): void {
    this._onDidChangeCodeLenses.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}

let codeLensProvider: VibecheckCodeLensProvider | undefined;

/**
 * Gets the singleton CodeLens provider instance.
 */
export function getCodeLensProvider(): VibecheckCodeLensProvider {
  if (!codeLensProvider) {
    codeLensProvider = new VibecheckCodeLensProvider();
  }
  return codeLensProvider;
}

/**
 * Registers the CodeLens provider for supported languages.
 */
export function registerCodeLensProvider(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const provider = getCodeLensProvider();

  const selector: vscode.DocumentSelector = [
    { language: 'typescript' },
    { language: 'javascript' },
    { language: 'typescriptreact' },
    { language: 'javascriptreact' },
    { language: 'python' },
  ];

  const registration = vscode.languages.registerCodeLensProvider(selector, provider);

  context.subscriptions.push(registration, provider);

  return registration;
}
