/**
 * Convex client for Codswallop extension.
 *
 * Manages the connection to Convex backend for syncing vibecheck data,
 * user authentication, and activity logging.
 *
 * Note: This client uses dynamic function references to avoid requiring
 * the generated Convex types at compile time.
 */

import * as vscode from 'vscode';
import { ConvexHttpClient } from 'convex/browser';
import { getEventBus, IndicatorType } from './event-bus';
import { VibecheckQuestion } from './mcp/schemas/vibecheck-output';
import { getSession } from './auth-provider';

type UserId = string;

/**
 * Client for syncing data with Convex backend.
 */
export class ConvexClient implements vscode.Disposable {
  private client: ConvexHttpClient | null = null;
  private userId: UserId | null = null;
  private disposables: vscode.Disposable[] = [];
  private configured = false;

  constructor() {}

  /**
   * Initialises the Convex client with the deployment URL.
   *
   * Args:
   *     deploymentUrl: The Convex deployment URL.
   *
   * Returns:
   *     A promise that resolves when initialisation is complete.
   */
  async initialise(deploymentUrl: string): Promise<void> {
    if (!deploymentUrl) {
      console.log('Codswallop: No Convex URL configured');
      return;
    }

    try {
      this.client = new ConvexHttpClient(deploymentUrl);
      this.configured = true;
      console.log('Codswallop: Convex client initialised');
      this.setupEventListeners();
    } catch (error) {
      console.error('Codswallop: Failed to initialise Convex client:', error);
      this.configured = false;
    }
  }

  /**
   * Checks if the client is configured.
   *
   * Returns:
   *     True if the client is configured with a deployment URL.
   */
  isConfigured(): boolean {
    return this.configured && this.client !== null;
  }

  /**
   * Sets up event listeners for syncing data.
   */
  private setupEventListeners(): void {
    const eventBus = getEventBus();

    const vibecheckCompletedHandler = eventBus.on(
      'vibecheck:completed',
      async (data) => {
        await this.onVibecheckCompleted(data);
      }
    );

    const vibecheckSkippedHandler = eventBus.on(
      'vibecheck:skipped',
      async (data) => {
        await this.onVibecheckSkipped(data);
      }
    );

    const vibecheckStartedHandler = eventBus.on(
      'vibecheck:started',
      async (data) => {
        await this.onVibecheckStarted(data);
      }
    );

    const vibeDetectedHandler = eventBus.on(
      'vibe:detected',
      async (data) => {
        await this.onVibeDetected(data);
      }
    );

    this.disposables.push(
      vibecheckCompletedHandler,
      vibecheckSkippedHandler,
      vibecheckStartedHandler,
      vibeDetectedHandler
    );
  }

  /**
   * Checks if the user is authenticated and returns the access token.
   *
   * Returns:
   *     The access token if authenticated, null otherwise.
   */
  async ensureAuthenticated(): Promise<string | null> {
    const session = await getSession();
    if (!session) {
      return null;
    }
    return session.accessToken;
  }

  /**
   * Syncs the user from the current authentication session to Convex.
   *
   * Returns:
   *     The user ID if successful, null otherwise.
   */
  async syncUserFromAuth(): Promise<UserId | null> {
    const session = await getSession();
    console.log('Codswallop: syncUserFromAuth called', {
      hasSession: !!session,
      hasClient: !!this.client,
    });

    if (!session || !this.client) {
      console.log('Codswallop: syncUserFromAuth - missing session or client');
      return null;
    }

    try {
      // Set the auth token on the Convex client before making the request
      this.client.setAuth(session.accessToken);
      console.log('Codswallop: Auth token set, calling users:syncUser mutation');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await (this.client as any).mutation('users:syncUser', {});
      console.log('Codswallop: syncUser mutation result', { user });

      if (user && user._id) {
        this.userId = user._id as UserId;
        console.log('Codswallop: User ID set to', this.userId);
        getEventBus().fire('convex:connected', { userId: String(user._id) });
        return this.userId;
      }

      console.log('Codswallop: syncUser returned no user ID');
      return null;
    } catch (error) {
      console.error('Codswallop: Failed to sync user:', error);
      return null;
    }
  }

  /**
   * Creates or updates the current user.
   *
   * Args:
   *     tokenIdentifier: Unique token for the user.
   *     email: User's email address.
   *     displayName: User's display name.
   *     role: User's role (student or teacher).
   *
   * Returns:
   *     The user ID.
   */
  async createOrUpdateUser(
    tokenIdentifier: string,
    email: string,
    displayName: string,
    role: 'student' | 'teacher'
  ): Promise<UserId | null> {
    if (!this.client) {
      return null;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = await (this.client as any).mutation('users:createOrUpdate', {
        tokenIdentifier,
        email,
        displayName,
        role,
      });

      this.userId = userId as UserId;
      getEventBus().fire('convex:connected', { userId: String(userId) });
      return this.userId;
    } catch (error) {
      console.error('Codswallop: Failed to create/update user:', error);
      return null;
    }
  }

  /**
   * Creates a vibecheck record in Convex.
   *
   * Args:
   *     fileUri: The file URI.
   *     line: The line number.
   *     code: The code snippet.
   *     language: The programming language.
   *     triggeredBy: The trigger type.
   *     indicatorValue: The indicator value that triggered.
   *     indicatorThreshold: The threshold that was exceeded.
   *     questions: The generated questions.
   *     complexity: Optional complexity score.
   *
   * Returns:
   *     The vibecheck ID.
   */
  async createVibecheck(
    fileUri: string,
    line: number,
    code: string,
    language: string,
    triggeredBy: IndicatorType,
    indicatorValue: number,
    indicatorThreshold: number,
    questions: VibecheckQuestion[],
    complexity?: number
  ): Promise<string | null> {
    console.log('Codswallop: createVibecheck called');

    const token = await this.ensureAuthenticated();
    console.log('Codswallop: ensureAuthenticated result', { hasToken: !!token });

    if (!token) {
      console.log('Codswallop: No auth token, prompting login');
      const choice = await vscode.window.showWarningMessage(
        'Please login to track your vibechecks',
        'Login'
      );
      if (choice === 'Login') {
        await vscode.commands.executeCommand('codswallop.login');
      }
      return null;
    }

    if (!this.client || !this.userId) {
      console.log('Codswallop: createVibecheck - missing client or userId', {
        hasClient: !!this.client,
        hasUserId: !!this.userId,
      });
      return null;
    }

    try {
      // Ensure auth token is set before making the request
      this.client.setAuth(token);
      console.log('Codswallop: Calling vibechecks:create mutation');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vibecheckId = await (this.client as any).mutation('vibechecks:create', {
        userId: this.userId,
        fileUri,
        line,
        code,
        language,
        triggeredBy,
        indicatorValue,
        indicatorThreshold,
        complexity,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          concept: q.concept,
        })),
      });

      console.log('Codswallop: vibechecks:create returned', { vibecheckId });

      await this.logActivity('vibecheck:created', {
        vibecheckId: String(vibecheckId),
        fileUri,
        line,
        triggeredBy,
      });

      console.log('Codswallop: Vibecheck created successfully', { vibecheckId });
      return String(vibecheckId);
    } catch (error) {
      console.error('Codswallop: Failed to create vibecheck:', error);
      return null;
    }
  }

  /**
   * Starts a vibecheck (marks it as in_progress).
   *
   * Args:
   *     vibecheckId: The Convex vibecheck ID.
   *
   * Returns:
   *     True if successful, false otherwise.
   */
  async startVibecheck(vibecheckId: string): Promise<boolean> {
    const token = await this.ensureAuthenticated();
    if (!this.client || !this.userId || !token) {
      return false;
    }

    try {
      this.client.setAuth(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).mutation('vibechecks:start', {
        vibecheckId,
      });
      return true;
    } catch (error) {
      console.error('Codswallop: Failed to start vibecheck:', error);
      return false;
    }
  }

  /**
   * Submits an answer for a vibecheck question.
   *
   * Args:
   *     vibecheckId: The Convex vibecheck ID.
   *     questionId: The question ID.
   *     answer: The user's answer.
   *
   * Returns:
   *     Whether the answer was correct, or null on error.
   */
  async submitVibecheckAnswer(
    vibecheckId: string,
    questionId: string,
    answer: string
  ): Promise<boolean | null> {
    const token = await this.ensureAuthenticated();
    if (!this.client || !this.userId || !token) {
      return null;
    }

    try {
      this.client.setAuth(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.client as any).mutation('vibechecks:submitAnswer', {
        vibecheckId,
        questionId,
        answer,
      });
      return result?.correct as boolean;
    } catch (error) {
      console.error('Codswallop: Failed to submit answer:', error);
      return null;
    }
  }

  /**
   * Completes a vibecheck and gets the final score.
   *
   * Args:
   *     vibecheckId: The Convex vibecheck ID.
   *
   * Returns:
   *     The completion result with score, or null on error.
   */
  async completeVibecheck(
    vibecheckId: string
  ): Promise<{ passed: boolean; score: number; correctCount: number; totalQuestions: number } | null> {
    const token = await this.ensureAuthenticated();
    if (!this.client || !this.userId || !token) {
      return null;
    }

    try {
      this.client.setAuth(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.client as any).mutation('vibechecks:complete', {
        vibecheckId,
      });
      return result as { passed: boolean; score: number; correctCount: number; totalQuestions: number };
    } catch (error) {
      console.error('Codswallop: Failed to complete vibecheck:', error);
      return null;
    }
  }

  /**
   * Skips a vibecheck.
   *
   * Args:
   *     vibecheckId: The Convex vibecheck ID.
   *     reason: The reason for skipping.
   *
   * Returns:
   *     True if successful, false otherwise.
   */
  async skipVibecheck(vibecheckId: string, reason: string): Promise<boolean> {
    const token = await this.ensureAuthenticated();
    if (!this.client || !this.userId || !token) {
      return false;
    }

    try {
      this.client.setAuth(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).mutation('vibechecks:skip', {
        vibecheckId,
        reason,
      });
      return true;
    } catch (error) {
      console.error('Codswallop: Failed to skip vibecheck:', error);
      return false;
    }
  }

  /**
   * Handles vibecheck completion event.
   */
  private async onVibecheckCompleted(data: {
    id: string;
    passed: boolean;
    score: number;
    answers: Array<{ questionId: string; correct: boolean }>;
    complexity?: number;
  }): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    try {
      await this.logActivity('vibecheck:completed', {
        vibecheckId: data.id,
        passed: data.passed,
        score: data.score,
      });

      await this.updateDailyMetrics(data.passed, data.score, data.complexity);

      getEventBus().fire('convex:synced', { table: 'activityLog', count: 1 });
    } catch (error) {
      console.error('Codswallop: Failed to sync vibecheck completion:', error);
    }
  }

  /**
   * Handles vibecheck skipped event.
   */
  private async onVibecheckSkipped(data: {
    id: string;
    reason: string;
  }): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    try {
      await this.logActivity('vibecheck:skipped', {
        vibecheckId: data.id,
        reason: data.reason,
      });

      getEventBus().fire('convex:synced', { table: 'activityLog', count: 1 });
    } catch (error) {
      console.error('Codswallop: Failed to sync vibecheck skip:', error);
    }
  }

  /**
   * Handles vibecheck started event.
   */
  private async onVibecheckStarted(data: {
    id: string;
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
  }): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    try {
      await this.logActivity('vibecheck:started', {
        vibecheckId: data.id,
        fileUri: data.uri,
        line: data.line,
        triggeredBy: data.triggeredBy,
      });
    } catch (error) {
      console.error('Codswallop: Failed to log vibecheck start:', error);
    }
  }

  /**
   * Handles vibe detected event.
   */
  private async onVibeDetected(data: {
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
    indicatorValue: number;
    threshold: number;
    codeSnippet: string;
    timestamp: number;
  }): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    try {
      await this.logActivity('vibe:detected', {
        fileUri: data.uri,
        line: data.line,
        triggeredBy: data.triggeredBy,
        indicatorValue: data.indicatorValue,
        threshold: data.threshold,
      });
    } catch (error) {
      console.error('Codswallop: Failed to log vibe detection:', error);
    }
  }

  /**
   * Logs an activity event.
   */
  private async logActivity(
    eventType: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).mutation('activityLog:log', {
        userId: this.userId,
        eventType,
        metadata,
      });
    } catch (error) {
      console.error('Codswallop: Failed to log activity:', error);
    }
  }

  /**
   * Updates daily metrics after a vibecheck.
   *
   * Args:
   *     passed: Whether the vibecheck was passed.
   *     score: The vibecheck score.
   *     complexity: Optional complexity score.
   */
  private async updateDailyMetrics(
    passed: boolean,
    score: number,
    complexity?: number
  ): Promise<void> {
    if (!this.client || !this.userId) {
      return;
    }

    const date = new Date().toISOString().split('T')[0];

    try {
      const updates: Record<string, number> = {
        vibechecksCompleted: 1,
        vibechecksPassed: passed ? 1 : 0,
        averageVibeScore: score,
      };

      if (complexity !== undefined) {
        updates.averageComplexity = complexity;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).mutation('metrics:updateDaily', {
        userId: this.userId,
        date,
        updates,
      });
    } catch (error) {
      console.error('Codswallop: Failed to update metrics:', error);
    }
  }

  /**
   * Joins a classroom by join code.
   *
   * Args:
   *     joinCode: The 6-character classroom join code.
   *
   * Returns:
   *     Object with success status and message.
   */
  async joinClassroom(joinCode: string): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      throw new Error('Convex client not initialised');
    }

    const token = await this.ensureAuthenticated();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Set the auth token on the Convex client before making the request
    this.client.setAuth(token);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.client as any).mutation('classrooms:joinByCode', {
      joinCode,
    });
  }

  /**
   * Gets recent vibechecks for the dashboard.
   *
   * Args:
   *     limit: Maximum number of vibechecks to return.
   *
   * Returns:
   *     Array of recent vibechecks.
   */
  async getRecentVibechecks(
    limit = 20
  ): Promise<Array<Record<string, unknown>>> {
    if (!this.client) {
      return [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (this.client as any).query('vibechecks:getRecent', { limit }) as Array<Record<string, unknown>>;
    } catch (error) {
      console.error('Codswallop: Failed to get recent vibechecks:', error);
      return [];
    }
  }

  /**
   * Disposes of the client resources.
   */
  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.client = null;
    this.configured = false;
  }
}

let convexClientInstance: ConvexClient | null = null;

/**
 * Initialises the Convex client singleton.
 *
 * Args:
 *     context: The extension context.
 *
 * Returns:
 *     The initialised Convex client.
 */
export async function initConvexClient(
  context: vscode.ExtensionContext
): Promise<ConvexClient> {
  if (!convexClientInstance) {
    convexClientInstance = new ConvexClient();

    const config = vscode.workspace.getConfiguration('codswallop');
    const convexUrl = config.get<string>('convexUrl');

    if (convexUrl) {
      await convexClientInstance.initialise(convexUrl);
    }

    const configChangeHandler = vscode.workspace.onDidChangeConfiguration(
      async (e) => {
        if (e.affectsConfiguration('codswallop.convexUrl')) {
          const newConfig = vscode.workspace.getConfiguration('codswallop');
          const newUrl = newConfig.get<string>('convexUrl');
          if (newUrl && convexClientInstance) {
            await convexClientInstance.initialise(newUrl);
          }
        }
      }
    );

    context.subscriptions.push(configChangeHandler);
  }

  return convexClientInstance;
}

/**
 * Gets the Convex client singleton.
 *
 * Returns:
 *     The Convex client instance, or null if not initialised.
 */
export function getConvexClient(): ConvexClient | null {
  return convexClientInstance;
}
