import * as vscode from 'vscode';

/**
 * Configuration options for the activity tracker.
 */
export interface ActivityTrackerOptions {
  inactivityTimeout?: number;
  idleAnimationIntervals?: number[];
  onResetToIdle?: () => void;
  onIdleAnimation?: () => void;
  onSleep?: () => void;
  onWake?: () => void;
}

/**
 * Default configuration values.
 */
const DEFAULT_OPTIONS: Required<ActivityTrackerOptions> = {
  inactivityTimeout: 30000,
  idleAnimationIntervals: [10000, 15000, 20000, 25000],
  onResetToIdle: () => {},
  onIdleAnimation: () => {},
  onSleep: () => {},
  onWake: () => {},
};

/**
 * Checkpoint state.
 */
interface Checkpoint {
  timeout: NodeJS.Timeout;
  fired: boolean;
}

/**
 * Activity tracker for the Vibe character.
 *
 * Implements a multi-checkpoint system:
 * - 5s: Reset to idle
 * - 10s, 15s, 20s, 25s: Random idle animation
 * - 30s: Enter sleeping state
 *
 * Any Vibe action resets all checkpoints back to 0s.
 */
export class VibeActivityTracker implements vscode.Disposable {
  private static instance: VibeActivityTracker | undefined;

  private options: Required<ActivityTrackerOptions>;
  private lastActivityTime: number = Date.now();
  private isSleeping: boolean = false;
  private checkpoints: Map<number, Checkpoint> = new Map();
  private resetIdleTimeout: NodeJS.Timeout | undefined;

  private constructor(options: ActivityTrackerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCheckpoints();
  }

  /**
   * Gets the singleton instance.
   *
   * @param options - Configuration options (only used on first call)
   */
  static getInstance(options?: ActivityTrackerOptions): VibeActivityTracker {
    if (!VibeActivityTracker.instance) {
      VibeActivityTracker.instance = new VibeActivityTracker(options);
    }
    return VibeActivityTracker.instance;
  }

  /**
   * Updates the configuration options.
   *
   * @param options - New options to apply
   */
  updateOptions(options: Partial<ActivityTrackerOptions>): void {
    this.options = { ...this.options, ...options };
    this.resetAllCheckpoints();
  }

  /**
   * Records activity, resetting all checkpoints.
   * Call this whenever the user or extension performs an action.
   */
  recordActivity(): void {
    const wasSleeping = this.isSleeping;
    this.lastActivityTime = Date.now();
    this.isSleeping = false;

    this.resetAllCheckpoints();

    if (wasSleeping) {
      console.log('[ActivityTracker] Waking up');
      this.options.onWake();
    }
  }

  /**
   * Gets whether the character is currently sleeping.
   */
  get sleeping(): boolean {
    return this.isSleeping;
  }

  /**
   * Gets the time since last activity in milliseconds.
   */
  get timeSinceActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Starts all checkpoint timers.
   */
  private startCheckpoints(): void {
    this.resetIdleTimeout = setTimeout(() => {
      console.log('[ActivityTracker] 5s checkpoint: Reset to idle');
      this.options.onResetToIdle();
    }, 5000);

    for (const interval of this.options.idleAnimationIntervals) {
      const timeout = setTimeout(() => {
        if (!this.isSleeping) {
          console.log(`[ActivityTracker] ${interval / 1000}s checkpoint: Idle animation`);
          this.options.onIdleAnimation();
        }
        const checkpoint = this.checkpoints.get(interval);
        if (checkpoint) {
          checkpoint.fired = true;
        }
      }, interval);

      this.checkpoints.set(interval, { timeout, fired: false });
    }

    const sleepTimeout = setTimeout(() => {
      if (!this.isSleeping) {
        console.log('[ActivityTracker] 30s checkpoint: Entering sleep');
        this.isSleeping = true;
        this.options.onSleep();
      }
    }, this.options.inactivityTimeout);

    this.checkpoints.set(this.options.inactivityTimeout, {
      timeout: sleepTimeout,
      fired: false,
    });
  }

  /**
   * Resets all checkpoint timers.
   */
  private resetAllCheckpoints(): void {
    if (this.resetIdleTimeout) {
      clearTimeout(this.resetIdleTimeout);
      this.resetIdleTimeout = undefined;
    }

    for (const checkpoint of this.checkpoints.values()) {
      clearTimeout(checkpoint.timeout);
    }
    this.checkpoints.clear();

    this.startCheckpoints();
  }

  /**
   * Forces the character to sleep.
   */
  forceSleep(): void {
    if (!this.isSleeping) {
      this.isSleeping = true;
      this.options.onSleep();
    }
  }

  /**
   * Forces the character to wake up.
   */
  forceWake(): void {
    if (this.isSleeping) {
      this.recordActivity();
    }
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    if (this.resetIdleTimeout) {
      clearTimeout(this.resetIdleTimeout);
    }

    for (const checkpoint of this.checkpoints.values()) {
      clearTimeout(checkpoint.timeout);
    }
    this.checkpoints.clear();

    VibeActivityTracker.instance = undefined;
  }
}

/**
 * Gets the singleton VibeActivityTracker instance.
 *
 * @param options - Configuration options (only used on first call)
 */
export function getVibeActivityTracker(
  options?: ActivityTrackerOptions
): VibeActivityTracker {
  return VibeActivityTracker.getInstance(options);
}

/**
 * Initialises the activity tracker with the state machine integration.
 *
 * @param context - Extension context for subscriptions
 * @param callbacks - Callbacks for activity events
 * @returns The initialised activity tracker
 */
export function initActivityTracker(
  context: vscode.ExtensionContext,
  callbacks: ActivityTrackerOptions
): VibeActivityTracker {
  const tracker = getVibeActivityTracker(callbacks);
  context.subscriptions.push(tracker);

  const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
    tracker.recordActivity();
  });

  const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
    tracker.recordActivity();
  });

  const visibleRangesDisposable = vscode.window.onDidChangeTextEditorVisibleRanges(() => {
    tracker.recordActivity();
  });

  context.subscriptions.push(
    textChangeDisposable,
    selectionChangeDisposable,
    visibleRangesDisposable
  );

  return tracker;
}
