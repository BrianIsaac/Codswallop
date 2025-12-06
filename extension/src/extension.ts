import * as vscode from 'vscode';
import { getEventBus } from './event-bus';

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

  console.log('Codswallop extension activated successfully');
}

/**
 * Deactivates the Codswallop extension.
 */
export function deactivate(): void {
  console.log('Codswallop extension is deactivating...');

  disposables.forEach((d) => d.dispose());
  getEventBus().dispose();

  console.log('Codswallop extension deactivated');
}

/**
 * Registers extension commands.
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const startVibecheck = vscode.commands.registerCommand(
    'codswallop.startVibecheck',
    async () => {
      vscode.window.showInformationMessage(
        'Codswallop: Starting vibecheck...'
      );
    }
  );

  const showDetections = vscode.commands.registerCommand(
    'codswallop.showDetections',
    async () => {
      vscode.window.showInformationMessage(
        'Codswallop: No active detections'
      );
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
