import * as vscode from 'vscode';
import { getEventBus } from './event-bus';
import { getComplexityAnalyser } from './complexity-analyser';
import { getDocumentTracker } from './document-tracker';
import { getVibeDetector, VibeDetection } from './vibe-detector';
import { registerCodeLensProvider, getCodeLensProvider } from './codelens-provider';
import { initDecorationManager, getDecorationManager } from './decoration-manager';

let statusBarItem: vscode.StatusBarItem;
const disposables: vscode.Disposable[] = [];

/**
 * Activates the Codswallop extension.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Codswallop extension is activating...');

  const config = vscode.workspace.getConfiguration('codswallop');
  if (!config.get<boolean>('enabled', true)) {
    console.log('Codswallop is disabled in settings');
    return;
  }

  registerCommands(context);
  createStatusBar(context);
  setupEventListeners(context);
  initVibeDetection(context);

  console.log('Codswallop extension activated successfully');
}

/**
 * Deactivates the Codswallop extension.
 */
export function deactivate(): void {
  console.log('Codswallop extension is deactivating...');

  disposables.forEach((d) => d.dispose());
  getComplexityAnalyser().dispose();
  getDocumentTracker().dispose();
  getVibeDetector().dispose();
  getCodeLensProvider().dispose();
  getDecorationManager()?.dispose();
  getEventBus().dispose();

  console.log('Codswallop extension deactivated');
}

/**
 * Registers extension commands.
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const startVibecheck = vscode.commands.registerCommand(
    'codswallop.startVibecheck',
    async (detection?: VibeDetection) => {
      if (detection) {
        const triggerLabels: Record<string, string> = {
          line_spike: 'Line Spike',
          high_complexity: 'High Complexity',
          paste: 'Paste Detected',
        };
        const label = triggerLabels[detection.triggeredBy] || detection.triggeredBy;
        vscode.window.showInformationMessage(
          `Codswallop: Starting vibecheck for ${label} (${detection.indicatorValue})...`
        );
        getEventBus().fire('vibecheck:started', {
          id: `vc-${Date.now()}`,
          uri: detection.uri,
          line: detection.line,
          triggeredBy: detection.triggeredBy,
        });
      } else {
        vscode.window.showInformationMessage(
          'Codswallop: Starting vibecheck...'
        );
      }
    }
  );

  const showDetections = vscode.commands.registerCommand(
    'codswallop.showDetections',
    async () => {
      const detections = getVibeDetector().getActiveDetections();
      if (detections.length === 0) {
        vscode.window.showInformationMessage('Codswallop: No active detections');
        return;
      }

      const items = detections.map((d) => {
        const labels: Record<string, string> = {
          line_spike: 'Line Spike',
          high_complexity: 'Complexity',
          paste: 'Paste',
        };
        return {
          label: `$(warning) ${labels[d.triggeredBy] || d.triggeredBy}: ${d.indicatorValue}`,
          description: vscode.Uri.parse(d.uri).fsPath,
          detail: `Line ${d.line + 1}`,
          detection: d,
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a detection to start vibecheck',
      });

      if (selected) {
        vscode.commands.executeCommand('codswallop.startVibecheck', selected.detection);
      }
    }
  );

  const openDashboard = vscode.commands.registerCommand(
    'codswallop.openDashboard',
    async () => {
      const config = vscode.workspace.getConfiguration('codswallop');
      const convexUrl = config.get<string>('convexUrl');

      if (!convexUrl) {
        vscode.window.showWarningMessage(
          'Codswallop: Configure convexUrl in settings to open dashboard'
        );
        return;
      }

      vscode.env.openExternal(vscode.Uri.parse(convexUrl.replace('.convex.cloud', '.convex.site')));
    }
  );

  context.subscriptions.push(startVibecheck, showDetections, openDashboard);
}

/**
 * Creates the status bar item.
 */
function createStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.text = '$(eye) Codswallop';
  statusBarItem.tooltip = 'Codswallop: Watching for vibe coding';
  statusBarItem.command = 'codswallop.showDetections';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

/**
 * Sets up event listeners for extension features.
 */
function setupEventListeners(context: vscode.ExtensionContext): void {
  const eventBus = getEventBus();

  const vibeDetectedHandler = eventBus.on('vibe:detected', (data) => {
    updateStatusBar(data.triggeredBy, data.indicatorValue);
  });

  const vibeClearedHandler = eventBus.on('vibe:cleared', () => {
    resetStatusBar();
  });

  const vibecheckCompletedHandler = eventBus.on('vibecheck:completed', (data) => {
    if (data.passed) {
      vscode.window.showInformationMessage(
        `Vibecheck passed! Score: ${Math.round(data.score * 100)}%`
      );
    } else {
      vscode.window.showWarningMessage(
        `Vibecheck failed. Score: ${Math.round(data.score * 100)}%. Keep practising!`
      );
    }
    resetStatusBar();
  });

  disposables.push(vibeDetectedHandler, vibeClearedHandler, vibecheckCompletedHandler);
  context.subscriptions.push(...disposables);
}

/**
 * Updates the status bar to show active detection.
 */
function updateStatusBar(triggeredBy: string, indicatorValue: number): void {
  const labels: Record<string, string> = {
    line_spike: 'Line Spike',
    high_complexity: 'Complexity',
    paste: 'Paste',
  };

  const label = labels[triggeredBy] || triggeredBy;
  statusBarItem.text = `$(warning) ${label}: ${indicatorValue}`;
  statusBarItem.backgroundColor = new vscode.ThemeColor(
    'statusBarItem.warningBackground'
  );
}

/**
 * Resets the status bar to default state.
 */
function resetStatusBar(): void {
  statusBarItem.text = '$(eye) Codswallop';
  statusBarItem.backgroundColor = undefined;
}

/**
 * Initialises vibe detection components.
 */
function initVibeDetection(context: vscode.ExtensionContext): void {
  const complexityAnalyser = getComplexityAnalyser();
  const documentTracker = getDocumentTracker();
  const vibeDetector = getVibeDetector();
  const decorationManager = initDecorationManager(context);

  registerCodeLensProvider(context);

  context.subscriptions.push(
    complexityAnalyser,
    documentTracker,
    vibeDetector,
    decorationManager
  );

  console.log('Codswallop: Vibe detection engine initialised');
}
