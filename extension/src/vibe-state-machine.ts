import * as vscode from 'vscode';
import { IndicatorType } from './event-bus';
import { PointingDirection } from './vibe-svg-character';

/**
 * Character states for the Vibe animated agent.
 */
export type VibeState =
  | 'idle'
  | 'watching'
  | 'detecting'
  | 'questioning'
  | 'celebrating'
  | 'concerned'
  | 'sleeping'
  | 'pointing';

/**
 * Events that can trigger state transitions.
 */
export type VibeEvent =
  | { type: 'CODE_CHANGED'; linesDelta: number }
  | { type: 'VIBE_DETECTED'; triggeredBy: IndicatorType; indicatorValue: number; line: number }
  | { type: 'START_VIBECHECK'; vibecheckId: string; triggeredBy: IndicatorType }
  | { type: 'ANSWER_SUBMITTED'; correct: boolean }
  | { type: 'VIBECHECK_PASSED' }
  | { type: 'VIBECHECK_FAILED' }
  | { type: 'VIBECHECK_SKIPPED' }
  | { type: 'POINT_AT'; direction: PointingDirection; target: string }
  | { type: 'TIMEOUT' }
  | { type: 'RESET' }
  | { type: 'SLEEP' }
  | { type: 'WAKE' };

/**
 * Context maintained by the state machine.
 */
export interface VibeContext {
  isInterruptible: boolean;
  currentVibecheckId?: string;
  pointingDirection?: PointingDirection;
  pointingTarget?: string;
  lastEvent?: VibeEvent;
  stateEnteredAt: number;
}

/**
 * State transition definition.
 */
interface StateTransition {
  target: VibeState;
  actions?: ((ctx: VibeContext, event: VibeEvent) => void)[];
}

/**
 * State definition with entry actions and transitions.
 */
interface StateDefinition {
  entry?: (ctx: VibeContext) => void;
  exit?: (ctx: VibeContext) => void;
  on: Partial<Record<VibeEvent['type'], StateTransition>>;
}

/**
 * State configuration for all Vibe states.
 */
const stateConfig: Record<VibeState, StateDefinition> = {
  idle: {
    entry: (ctx) => {
      ctx.isInterruptible = true;
      ctx.currentVibecheckId = undefined;
      ctx.pointingDirection = undefined;
      ctx.pointingTarget = undefined;
    },
    on: {
      CODE_CHANGED: { target: 'watching' },
      VIBE_DETECTED: { target: 'detecting' },
      POINT_AT: {
        target: 'pointing',
        actions: [
          (ctx, event) => {
            if (event.type === 'POINT_AT') {
              ctx.pointingDirection = event.direction;
              ctx.pointingTarget = event.target;
            }
          },
        ],
      },
      SLEEP: { target: 'sleeping' },
    },
  },

  watching: {
    entry: (ctx) => {
      ctx.isInterruptible = true;
    },
    on: {
      VIBE_DETECTED: { target: 'detecting' },
      TIMEOUT: { target: 'idle' },
      RESET: { target: 'idle' },
    },
  },

  detecting: {
    entry: (ctx) => {
      ctx.isInterruptible = false;
    },
    on: {
      START_VIBECHECK: {
        target: 'questioning',
        actions: [
          (ctx, event) => {
            if (event.type === 'START_VIBECHECK') {
              ctx.currentVibecheckId = event.vibecheckId;
            }
          },
        ],
      },
      TIMEOUT: { target: 'idle' },
      RESET: { target: 'idle' },
    },
  },

  questioning: {
    entry: (ctx) => {
      ctx.isInterruptible = false;
    },
    on: {
      VIBECHECK_PASSED: { target: 'celebrating' },
      VIBECHECK_FAILED: { target: 'concerned' },
      VIBECHECK_SKIPPED: { target: 'concerned' },
    },
  },

  celebrating: {
    entry: (ctx) => {
      ctx.isInterruptible = false;
    },
    on: {
      TIMEOUT: { target: 'idle' },
      RESET: { target: 'idle' },
    },
  },

  concerned: {
    entry: (ctx) => {
      ctx.isInterruptible = true;
    },
    on: {
      TIMEOUT: { target: 'idle' },
      START_VIBECHECK: {
        target: 'questioning',
        actions: [
          (ctx, event) => {
            if (event.type === 'START_VIBECHECK') {
              ctx.currentVibecheckId = event.vibecheckId;
            }
          },
        ],
      },
      RESET: { target: 'idle' },
    },
  },

  sleeping: {
    entry: (ctx) => {
      ctx.isInterruptible = true;
    },
    on: {
      WAKE: { target: 'idle' },
      VIBE_DETECTED: { target: 'detecting' },
      CODE_CHANGED: { target: 'idle' },
    },
  },

  pointing: {
    entry: (ctx) => {
      ctx.isInterruptible = false;
    },
    on: {
      TIMEOUT: { target: 'idle' },
      START_VIBECHECK: {
        target: 'questioning',
        actions: [
          (ctx, event) => {
            if (event.type === 'START_VIBECHECK') {
              ctx.currentVibecheckId = event.vibecheckId;
            }
          },
        ],
      },
      RESET: { target: 'idle' },
    },
  },
};

/**
 * Callback for state changes.
 */
type StateChangeCallback = (
  newState: VibeState,
  prevState: VibeState,
  event: VibeEvent,
  context: VibeContext
) => void;

/**
 * State machine for managing Vibe character states.
 *
 * Implements a finite state machine with typed events and transitions.
 * Provides singleton access for extension-wide state management.
 */
export class VibeStateMachine implements vscode.Disposable {
  private static instance: VibeStateMachine | undefined;

  private _state: VibeState = 'idle';
  private _context: VibeContext;
  private _listeners: Set<StateChangeCallback> = new Set();
  private _stateTimeouts: Map<VibeState, NodeJS.Timeout> = new Map();

  private constructor() {
    this._context = {
      isInterruptible: true,
      stateEnteredAt: Date.now(),
    };
  }

  /**
   * Gets the singleton instance.
   */
  static getInstance(): VibeStateMachine {
    if (!VibeStateMachine.instance) {
      VibeStateMachine.instance = new VibeStateMachine();
    }
    return VibeStateMachine.instance;
  }

  /**
   * Gets the current state.
   */
  get state(): VibeState {
    return this._state;
  }

  /**
   * Gets the current context.
   */
  get context(): Readonly<VibeContext> {
    return this._context;
  }

  /**
   * Gets whether the current state is interruptible.
   */
  get isInterruptible(): boolean {
    return this._context.isInterruptible;
  }

  /**
   * Sends an event to the state machine.
   *
   * @param event - The event to process
   * @returns Whether a transition occurred
   */
  send(event: VibeEvent): boolean {
    const currentConfig = stateConfig[this._state];
    const transition = currentConfig.on[event.type];

    if (!transition) {
      console.log(`[VibeStateMachine] No transition for ${event.type} in state ${this._state}`);
      return false;
    }

    const prevState = this._state;

    if (currentConfig.exit) {
      currentConfig.exit(this._context);
    }

    this.clearStateTimeout(this._state);

    if (transition.actions) {
      for (const action of transition.actions) {
        action(this._context, event);
      }
    }

    this._state = transition.target;
    this._context.lastEvent = event;
    this._context.stateEnteredAt = Date.now();

    const newConfig = stateConfig[this._state];
    if (newConfig.entry) {
      newConfig.entry(this._context);
    }

    this.setupStateTimeout(this._state);

    console.log(`[VibeStateMachine] ${prevState} -> ${this._state} (${event.type})`);

    for (const listener of this._listeners) {
      try {
        listener(this._state, prevState, event, this._context);
      } catch (error) {
        console.error('[VibeStateMachine] Error in listener:', error);
      }
    }

    return true;
  }

  /**
   * Registers a listener for state changes.
   *
   * @param callback - The callback to invoke on state changes
   * @returns A disposable to remove the listener
   */
  onStateChange(callback: StateChangeCallback): vscode.Disposable {
    this._listeners.add(callback);
    return new vscode.Disposable(() => {
      this._listeners.delete(callback);
    });
  }

  /**
   * Forces a state change without checking transitions.
   * Use sparingly - prefer send() for normal operation.
   *
   * @param state - The state to force
   */
  forceState(state: VibeState): void {
    const prevState = this._state;
    const prevConfig = stateConfig[prevState];
    const newConfig = stateConfig[state];

    if (prevConfig.exit) {
      prevConfig.exit(this._context);
    }

    this.clearStateTimeout(prevState);

    this._state = state;
    this._context.stateEnteredAt = Date.now();

    if (newConfig.entry) {
      newConfig.entry(this._context);
    }

    this.setupStateTimeout(state);

    const event: VibeEvent = { type: 'RESET' };
    for (const listener of this._listeners) {
      try {
        listener(state, prevState, event, this._context);
      } catch (error) {
        console.error('[VibeStateMachine] Error in listener:', error);
      }
    }
  }

  /**
   * Resets the state machine to idle.
   */
  reset(): void {
    this.send({ type: 'RESET' });
  }

  /**
   * Sets up automatic timeout for states that support it.
   */
  private setupStateTimeout(state: VibeState): void {
    const timeouts: Partial<Record<VibeState, number>> = {
      watching: 5000,
      detecting: 10000,
      celebrating: 5000,
      concerned: 8000,
      pointing: 10000,
    };

    const timeout = timeouts[state];
    if (timeout) {
      const handle = setTimeout(() => {
        this.send({ type: 'TIMEOUT' });
      }, timeout);

      this._stateTimeouts.set(state, handle);
    }
  }

  /**
   * Clears any active timeout for a state.
   */
  private clearStateTimeout(state: VibeState): void {
    const handle = this._stateTimeouts.get(state);
    if (handle) {
      clearTimeout(handle);
      this._stateTimeouts.delete(state);
    }
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    for (const handle of this._stateTimeouts.values()) {
      clearTimeout(handle);
    }
    this._stateTimeouts.clear();
    this._listeners.clear();
    VibeStateMachine.instance = undefined;
  }
}

/**
 * Gets the singleton VibeStateMachine instance.
 */
export function getVibeStateMachine(): VibeStateMachine {
  return VibeStateMachine.getInstance();
}
