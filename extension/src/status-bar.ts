/**
 * Status bar integration for authentication status.
 *
 * Displays the current login status in the VS Code status bar and
 * allows users to quickly check their authentication state or login.
 */

import * as vscode from 'vscode';
import { getSession } from './auth-provider';

let authStatusBarItem: vscode.StatusBarItem;

/**
 * Initializes the authentication status bar item.
 */
export function initStatusBar(context: vscode.ExtensionContext): void {
  authStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99 // Priority slightly lower than the main Codswallop status bar
  );
  authStatusBarItem.command = 'codswallop.showAuthStatus';
  context.subscriptions.push(authStatusBarItem);

  updateStatusBar();

  // Update status bar when authentication sessions change
  vscode.authentication.onDidChangeSessions((e) => {
    if (e.provider.id === 'codswallop') {
      updateStatusBar();
    }
  });
}

/**
 * Updates the status bar to reflect current authentication state.
 */
async function updateStatusBar(): Promise<void> {
  const session = await getSession();
  if (session) {
    authStatusBarItem.text = `$(check) Codswallop`;
    authStatusBarItem.tooltip = `Logged in as ${session.account.label}`;
    authStatusBarItem.backgroundColor = undefined;
  } else {
    authStatusBarItem.text = `$(sign-in) Codswallop`;
    authStatusBarItem.tooltip = 'Click to login';
    authStatusBarItem.command = 'codswallop.login';
    authStatusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  }
  authStatusBarItem.show();
}
