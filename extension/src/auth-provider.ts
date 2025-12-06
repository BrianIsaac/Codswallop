/**
 * Authentication provider for Codswallop extension.
 *
 * Implements VS Code AuthenticationProvider interface to handle
 * Clerk-based authentication via browser OAuth flow.
 */

import * as vscode from 'vscode';

const AUTH_TYPE = 'codswallop';
const AUTH_NAME = 'Codswallop';
const SESSIONS_SECRET_KEY = 'codswallop.sessions';

interface SessionData {
  id: string;
  accessToken: string;
  account: {
    id: string;
    label: string;
  };
  scopes: readonly string[];
}

/**
 * Authentication provider for Codswallop using Clerk.
 */
export class CodswallopAuthProvider implements vscode.AuthenticationProvider {
  private _sessionChangeEmitter = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposables: vscode.Disposable[] = [];
  private _pendingStates: Map<string, (uri: vscode.Uri) => void> = new Map();

  constructor(private readonly context: vscode.ExtensionContext) {
    this._disposables.push(
      vscode.authentication.registerAuthenticationProvider(
        AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false }
      )
    );

    this._disposables.push(
      vscode.window.registerUriHandler({
        handleUri: (uri: vscode.Uri) => this._handleUri(uri),
      })
    );
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  /**
   * Gets all stored authentication sessions.
   */
  async getSessions(
    scopes?: string[]
  ): Promise<vscode.AuthenticationSession[]> {
    const sessionsJson = await this.context.secrets.get(SESSIONS_SECRET_KEY);
    if (!sessionsJson) {
      return [];
    }

    try {
      const sessions: SessionData[] = JSON.parse(sessionsJson);
      return sessions.map(s => ({
        id: s.id,
        accessToken: s.accessToken,
        account: s.account,
        scopes: s.scopes,
      }));
    } catch (error) {
      console.error('Codswallop: Failed to parse sessions:', error);
      return [];
    }
  }

  /**
   * Creates a new authentication session by opening browser.
   */
  async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
    const state = this._generateState();

    // Get the dashboard URL from configuration
    const config = vscode.workspace.getConfiguration('codswallop');
    const dashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:3000';

    // Construct the callback URI that the dashboard will redirect to
    const callbackUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(`${vscode.env.uriScheme}://codswallop.codswallop/auth-callback`)
    );

    // Open the dashboard auth page with state and callback
    const authUrl = `${dashboardUrl}/extension-auth?` +
      `state=${state}&` +
      `callbackUri=${encodeURIComponent(callbackUri.toString())}`;

    await vscode.env.openExternal(vscode.Uri.parse(authUrl));

    // Wait for the callback with a 2-minute timeout
    const uri = await new Promise<vscode.Uri>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pendingStates.delete(state);
        reject(new Error('Authentication timed out. Please try again.'));
      }, 120000);

      this._pendingStates.set(state, (uri) => {
        clearTimeout(timeout);
        resolve(uri);
      });
    });

    // Extract token and user info from callback URI
    const tokenData = this._extractTokenFromUri(uri);

    const session: vscode.AuthenticationSession = {
      id: tokenData.userId,
      accessToken: tokenData.token,
      account: {
        id: tokenData.userId,
        label: tokenData.email,
      },
      scopes,
    };

    await this._storeSessions([session]);
    this._sessionChangeEmitter.fire({
      added: [session],
      removed: [],
      changed: [],
    });

    return session;
  }

  /**
   * Removes an authentication session.
   */
  async removeSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    const removed = sessions.filter((s) => s.id === sessionId);

    await this._storeSessions(remaining);
    this._sessionChangeEmitter.fire({
      added: [],
      removed,
      changed: [],
    });
  }

  /**
   * Handles URI callbacks from the authentication flow.
   */
  private _handleUri(uri: vscode.Uri): void {
    const query = new URLSearchParams(uri.query);
    const state = query.get('state');

    if (state && this._pendingStates.has(state)) {
      const handler = this._pendingStates.get(state)!;
      this._pendingStates.delete(state);
      handler(uri);
    }
  }

  /**
   * Extracts token and user data from callback URI.
   */
  private _extractTokenFromUri(uri: vscode.Uri): {
    userId: string;
    email: string;
    token: string;
  } {
    const query = new URLSearchParams(uri.query);
    const token = query.get('token');
    const userId = query.get('userId');
    const email = query.get('email');

    if (!token || !userId || !email) {
      throw new Error('Invalid authentication response. Missing required parameters.');
    }

    return { userId, email, token };
  }

  /**
   * Stores sessions securely in VS Code's secret storage.
   */
  private async _storeSessions(
    sessions: vscode.AuthenticationSession[]
  ): Promise<void> {
    const sessionData: SessionData[] = sessions.map(s => ({
      id: s.id,
      accessToken: s.accessToken,
      account: s.account,
      scopes: s.scopes,
    }));

    await this.context.secrets.store(
      SESSIONS_SECRET_KEY,
      JSON.stringify(sessionData)
    );
  }

  /**
   * Generates a random state string for CSRF protection.
   */
  private _generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}

let authProviderInstance: CodswallopAuthProvider | null = null;

/**
 * Initialises the authentication provider.
 */
export function initAuthProvider(
  context: vscode.ExtensionContext
): CodswallopAuthProvider {
  if (!authProviderInstance) {
    authProviderInstance = new CodswallopAuthProvider(context);
  }
  return authProviderInstance;
}

/**
 * Gets the current authentication provider instance.
 */
export function getAuthProvider(): CodswallopAuthProvider | null {
  return authProviderInstance;
}

/**
 * Gets the current authentication session if it exists.
 */
export async function getSession(): Promise<vscode.AuthenticationSession | null> {
  try {
    const session = await vscode.authentication.getSession(AUTH_TYPE, [], {
      createIfNone: false,
    });
    return session ?? null;
  } catch (error) {
    console.error('Codswallop: Failed to get session:', error);
    return null;
  }
}

/**
 * Initiates the login flow.
 */
export async function login(): Promise<vscode.AuthenticationSession> {
  return vscode.authentication.getSession(AUTH_TYPE, ['profile', 'email'], {
    createIfNone: true,
  });
}

/**
 * Logs out the current user.
 */
export async function logout(): Promise<void> {
  const session = await getSession();
  if (session && authProviderInstance) {
    await authProviderInstance.removeSession(session.id);
  }
}
