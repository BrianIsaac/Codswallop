import * as vscode from 'vscode';
import { getEventBus } from './event-bus';
import { getComplexityAnalyser } from './complexity-analyser';
import { getDocumentTracker } from './document-tracker';
import { getVibeDetector, VibeDetection } from './vibe-detector';
import { registerCodeLensProvider, getCodeLensProvider } from './codelens-provider';
import { initDecorationManager, getDecorationManager } from './decoration-manager';
import { initMCPClient, getMCPClient } from './mcp-client';
import { initConvexClient, getConvexClient } from './convex-client';
import { showVibecheckPanel } from './vibecheck-panel';
import { initVibePanel, getVibePanelProvider } from './vibe-panel-provider';
import { getVibeStateMachine } from './vibe-state-machine';
import { getVibeActivityTracker } from './vibe-activity-tracker';
import { initAuthProvider, login, logout, getSession } from './auth-provider';
import { initStatusBar } from './status-bar';

let statusBarItem: vscode.StatusBarItem;
const disposables: vscode.Disposable[] = [];

/**
 * Activates the Codswallop extension.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Codswallop extension is activating...');

  const config = vscode.workspace.getConfiguration('codswallop');
  if (!config.get<boolean>('enabled', true)) {
    console.log('Codswallop is disabled in settings');
    return;
  }

  // Initialize authentication provider
  const authProvider = initAuthProvider(context);
  context.subscriptions.push(authProvider);

  registerCommands(context);
  createStatusBar(context);
  initStatusBar(context);
  setupEventListeners(context);
  initVibeDetection(context);
  initVibePanel(context);
  await initPhase3Components(context);

  console.log('Codswallop extension activated successfully');
}

/**
 * Initialises Phase 3 components (MCP client, Convex client).
 */
async function initPhase3Components(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const mcpClient = await initMCPClient(context);
    context.subscriptions.push(mcpClient);

    const convexClient = await initConvexClient(context);
    context.subscriptions.push(convexClient);

    // Sync user from existing session if available
    console.log('Codswallop: Checking for existing session...', {
      isConfigured: convexClient.isConfigured(),
    });

    if (convexClient.isConfigured()) {
      const session = await getSession();
      console.log('Codswallop: getSession result:', {
        hasSession: !!session,
        sessionId: session?.id,
        accountLabel: session?.account?.label,
      });

      if (session) {
        console.log('Codswallop: Found existing session, syncing user...');
        const userId = await convexClient.syncUserFromAuth();
        console.log('Codswallop: syncUserFromAuth result:', { userId });
      } else {
        console.log('Codswallop: No existing session found');
      }
    }

    console.log('Codswallop: Phase 3 components initialised');
  } catch (error) {
    console.error('Codswallop: Failed to initialise Phase 3 components:', error);
  }
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
  getMCPClient()?.dispose();
  getConvexClient()?.dispose();
  getVibeStateMachine().dispose();
  getVibeActivityTracker().dispose();
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
      if (!detection) {
        vscode.window.showWarningMessage(
          'Codswallop: No detection provided. Click on a CodeLens to start a vibecheck.'
        );
        return;
      }

      const triggerLabels: Record<string, string> = {
        line_spike: 'Line Spike',
        high_complexity: 'High Complexity',
        paste: 'Paste Detected',
      };
      const label = triggerLabels[detection.triggeredBy] || detection.triggeredBy;
      const vibecheckId = `vc-${Date.now()}`;

      getEventBus().fire('vibecheck:started', {
        id: vibecheckId,
        uri: detection.uri,
        line: detection.line,
        triggeredBy: detection.triggeredBy,
      });

      const mcpClient = getMCPClient();
      if (!mcpClient) {
        vscode.window.showErrorMessage(
          'Codswallop: MCP client not initialised'
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Codswallop: Generating vibecheck for ${label}...`,
          cancellable: false,
        },
        async () => {
          try {
            const output = await mcpClient.generateVibecheck(detection);

            // Persist vibecheck to database
            const convexClient = getConvexClient();
            let dbVibecheckId: string | null = null;

            console.log('Codswallop: Attempting to persist vibecheck', {
              hasConvexClient: !!convexClient,
              isConfigured: convexClient?.isConfigured(),
            });

            if (convexClient?.isConfigured()) {
              const uri = vscode.Uri.parse(detection.uri);
              const ext = uri.fsPath.split('.').pop()?.toLowerCase() || '';
              const languageMap: Record<string, string> = {
                ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
                py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c',
                cs: 'csharp', rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin'
              };
              const language = languageMap[ext] || ext;

              dbVibecheckId = await convexClient.createVibecheck(
                detection.uri,
                detection.line,
                detection.codeSnippet,
                language,
                detection.triggeredBy,
                detection.indicatorValue,
                detection.threshold,
                output.questions,
                undefined
              );
            }

            const finalVibecheckId = dbVibecheckId || vibecheckId;

            showVibecheckPanel(
              context.extensionUri,
              finalVibecheckId,
              output,
              detection.codeSnippet,
              detection.triggeredBy
            );

            getVibeDetector().clearDetection(detection.uri, detection.line);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(
              `Codswallop: Failed to generate vibecheck: ${errorMessage}`
            );
          }
        }
      );
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
      const dashboardUrl = config.get<string>('dashboardUrl');

      if (!dashboardUrl) {
        vscode.window.showWarningMessage(
          'Codswallop: Configure dashboardUrl in settings to open dashboard'
        );
        return;
      }

      vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    }
  );

  const setApiKey = vscode.commands.registerCommand(
    'codswallop.setApiKey',
    async () => {
      const mcpClient = getMCPClient();
      if (!mcpClient) {
        vscode.window.showErrorMessage(
          'Codswallop: MCP client not initialised'
        );
        return;
      }

      const success = await mcpClient.promptForApiKey();
      if (!success) {
        vscode.window.showWarningMessage(
          'Codswallop: API key not set'
        );
      }
    }
  );

  const clearApiKey = vscode.commands.registerCommand(
    'codswallop.clearApiKey',
    async () => {
      const mcpClient = getMCPClient();
      if (!mcpClient) {
        vscode.window.showErrorMessage(
          'Codswallop: MCP client not initialised'
        );
        return;
      }

      await mcpClient.clearApiKey();
      vscode.window.showInformationMessage(
        'Codswallop: API key cleared successfully'
      );
    }
  );

  const loginCommand = vscode.commands.registerCommand(
    'codswallop.login',
    async () => {
      try {
        const session = await login();
        vscode.window.showInformationMessage(
          `Logged in as ${session.account.label}`
        );
        // Sync user with Convex after login
        const convexClient = getConvexClient();
        if (convexClient) {
          await convexClient.syncUserFromAuth();
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );

  const logoutCommand = vscode.commands.registerCommand(
    'codswallop.logout',
    async () => {
      await logout();
      vscode.window.showInformationMessage('Logged out of Codswallop');
    }
  );

  const showAuthStatusCommand = vscode.commands.registerCommand(
    'codswallop.showAuthStatus',
    async () => {
      const session = await getSession();
      if (session) {
        vscode.window.showInformationMessage(
          `Logged in as ${session.account.label}`
        );
      } else {
        vscode.window.showInformationMessage('Not logged in');
      }
    }
  );

  const joinClassroomCommand = vscode.commands.registerCommand(
    'codswallop.joinClassroom',
    async () => {
      const session = await getSession();
      if (!session) {
        const choice = await vscode.window.showWarningMessage(
          'Please login first to join a classroom',
          'Login'
        );
        if (choice === 'Login') {
          await vscode.commands.executeCommand('codswallop.login');
        }
        return;
      }

      const joinCode = await vscode.window.showInputBox({
        prompt: 'Enter the 6-character classroom join code',
        placeHolder: 'ABC123',
        validateInput: (value) => {
          if (value.length !== 6) {
            return 'Join code must be 6 characters';
          }
          if (!/^[A-Za-z0-9]+$/.test(value)) {
            return 'Join code must be alphanumeric';
          }
          return null;
        },
      });

      if (!joinCode) {
        return;
      }

      try {
        const convexClient = getConvexClient();
        if (!convexClient) {
          vscode.window.showErrorMessage(
            'Codswallop: Convex client not initialised. Please configure convexUrl in settings.'
          );
          return;
        }

        const result = await convexClient.joinClassroom(joinCode.toUpperCase());

        if (result.success) {
          if (result.message === 'Already in classroom') {
            vscode.window.showInformationMessage(
              'You are already a member of this classroom'
            );
          } else {
            vscode.window.showInformationMessage(
              'Successfully joined classroom!'
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Handle specific error cases with user-friendly messages
        if (errorMessage.includes('Classroom not found')) {
          vscode.window.showWarningMessage(
            'Invalid classroom code. Please check the code and try again.'
          );
        } else if (errorMessage.includes('Not authenticated')) {
          vscode.window.showWarningMessage(
            'Please login first to join a classroom.'
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to join classroom: ${errorMessage}`
          );
        }
      }
    }
  );

  context.subscriptions.push(
    startVibecheck,
    showDetections,
    openDashboard,
    setApiKey,
    clearApiKey,
    loginCommand,
    logoutCommand,
    showAuthStatusCommand,
    joinClassroomCommand
  );
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
