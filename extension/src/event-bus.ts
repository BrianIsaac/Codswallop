import * as vscode from 'vscode';

/**
 * Indicator types that can trigger a vibecheck.
 */
export type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

/**
 * Complexity information for a function.
 */
export interface FunctionComplexity {
  name: string;
  line: number;
  complexity: number;
  endLine: number;
}

/**
 * Type-safe event definitions for the Codswallop event bus.
 */
export interface EventMap {
  'document:changed': {
    uri: string;
    linesDelta: number;
    timestamp: number;
  };

  'document:pasted': {
    uri: string;
    content: string;
    lineCount: number;
    cursorLine: number;
  };

  'vibe:detected': {
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
    indicatorValue: number;
    threshold: number;
    codeSnippet: string;
    timestamp: number;
  };

  'vibe:cleared': {
    uri: string;
    line: number;
  };

  'vibecheck:started': {
    id: string;
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
  };

  'vibecheck:completed': {
    id: string;
    passed: boolean;
    score: number;
    answers: Array<{ questionId: string; correct: boolean }>;
  };

  'vibecheck:skipped': {
    id: string;
    reason: string;
  };

  'complexity:analysed': {
    uri: string;
    functions: FunctionComplexity[];
  };

  'convex:synced': {
    operation: 'create' | 'update' | 'delete';
    table: string;
    id: string;
  };
}

type EventType = keyof EventMap;
type EventHandler<T extends EventType> = (data: EventMap[T]) => void;

/**
 * Type-safe singleton event bus for Codswallop extension.
 *
 * Provides pub/sub messaging between extension components with
 * strongly typed events and automatic cleanup via disposables.
 */
class EventBus {
  private static instance: EventBus;
  private emitter = new vscode.EventEmitter<{ type: string; data: unknown }>();
  private handlers = new Map<string, Set<EventHandler<never>>>();

  private constructor() {}

  /**
   * Gets the singleton EventBus instance.
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Fires an event to all registered handlers.
   *
   * @param type - The event type
   * @param data - The event data
   */
  fire<T extends EventType>(type: T, data: EventMap[T]): void {
    this.emitter.fire({ type, data });
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as EventHandler<T>)(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Registers an event handler.
   *
   * @param type - The event type to listen for
   * @param handler - The handler function
   * @returns A disposable to unregister the handler
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): vscode.Disposable {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<never>);

    return new vscode.Disposable(() => {
      this.handlers.get(type)?.delete(handler as EventHandler<never>);
    });
  }

  /**
   * Registers a one-time event handler that auto-unregisters after first call.
   *
   * @param type - The event type to listen for
   * @param handler - The handler function
   * @returns A disposable to unregister the handler early
   */
  once<T extends EventType>(type: T, handler: EventHandler<T>): vscode.Disposable {
    const disposable = this.on(type, (data) => {
      disposable.dispose();
      handler(data);
    });
    return disposable;
  }

  /**
   * Cleans up all handlers and internal resources.
   */
  dispose(): void {
    this.emitter.dispose();
    this.handlers.clear();
  }
}

/**
 * Gets the singleton EventBus instance.
 */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}
