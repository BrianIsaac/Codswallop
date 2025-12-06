import * as vscode from 'vscode';
import { VibeState, getVibeStateMachine, VibeEvent } from './vibe-state-machine';
import { getSvgForState, PointingDirection, vibeColours } from './vibe-svg-character';
import { getVibeActivityTracker, initActivityTracker } from './vibe-activity-tracker';
import { getEventBus } from './event-bus';

/**
 * Chat message to display in the character's speech bubble.
 */
export interface ChatMessage {
  text: string;
  duration?: number;
}

/**
 * Messages for different states.
 */
const STATE_MESSAGES: Partial<Record<VibeState, string[]>> = {
  idle: [
    "What are we building today?",
    "Ready to code!",
    "I'm watching...",
  ],
  watching: [
    "Interesting code here...",
    "Let me take a look at this",
    "Hmm, what's happening here?",
  ],
  detecting: [
    "Hold on a moment...",
    "This looks suspicious!",
    "Did you vibe code this?",
    "Let me investigate...",
  ],
  questioning: [
    "Let's see if you understand this",
    "Time for a quick quiz!",
    "Can you explain this code?",
  ],
  celebrating: [
    "Brilliant work!",
    "You really know your stuff!",
    "Excellent understanding!",
    "Keep it up!",
  ],
  concerned: [
    "Don't worry, keep practising",
    "Let's try that again sometime",
    "You'll get it next time!",
    "Learning takes time",
  ],
  sleeping: [
    "Zzz...",
    "*snore*",
    "...",
  ],
};

/**
 * Webview panel provider for the Vibe animated character.
 *
 * Manages a VSCode webview panel that displays the Vibe character,
 * handles state transitions, and displays chat bubbles.
 */
export class VibePanelProvider implements vscode.Disposable {
  private static instance: VibePanelProvider | undefined;
  public static readonly viewType = 'codswallop.vibePanel';

  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private currentState: VibeState = 'idle';
  private pointingDirection?: PointingDirection;
  private chatTimeout?: NodeJS.Timeout;

  private constructor(private readonly extensionUri: vscode.Uri) {}

  /**
   * Gets the singleton instance.
   *
   * @param extensionUri - Extension URI for resource access
   */
  static getInstance(extensionUri: vscode.Uri): VibePanelProvider {
    if (!VibePanelProvider.instance) {
      VibePanelProvider.instance = new VibePanelProvider(extensionUri);
    }
    return VibePanelProvider.instance;
  }

  /**
   * Shows the Vibe panel. Creates it if it doesn't exist.
   */
  show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two, true);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      VibePanelProvider.viewType,
      'Vibe',
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri],
      }
    );

    this.panel.webview.html = this.getHtmlContent();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    }, null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables
    );

    this.updateCharacter();
    this.showRandomMessage();
  }

  /**
   * Hides the Vibe panel.
   */
  hide(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }

  /**
   * Gets whether the panel is currently visible.
   */
  get isVisible(): boolean {
    return this.panel?.visible ?? false;
  }

  /**
   * Sets the character state.
   *
   * @param state - The new state
   * @param direction - Optional pointing direction
   */
  setState(state: VibeState, direction?: PointingDirection): void {
    this.currentState = state;
    this.pointingDirection = direction;
    this.updateCharacter();
    this.showRandomMessage();
  }

  /**
   * Shows a chat bubble with the specified message.
   *
   * @param message - The message to display
   */
  showChatBubble(message: ChatMessage): void {
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }

    this.postMessage({
      command: 'showBubble',
      text: message.text,
    });

    const duration = message.duration ?? 4000;
    this.chatTimeout = setTimeout(() => {
      this.hideChatBubble();
    }, duration);
  }

  /**
   * Hides the chat bubble.
   */
  hideChatBubble(): void {
    this.postMessage({ command: 'hideBubble' });
  }

  /**
   * Triggers a random idle animation.
   */
  triggerIdleAnimation(): void {
    this.postMessage({ command: 'triggerIdleAnimation' });
  }

  /**
   * Points the character at a location.
   *
   * @param direction - The direction to point
   * @param target - Description of what's being pointed at
   */
  pointAt(direction: PointingDirection, target: string): void {
    this.setState('pointing', direction);
    this.showChatBubble({ text: `Look at ${target}!`, duration: 3000 });
  }

  /**
   * Updates the character SVG in the webview.
   */
  private updateCharacter(): void {
    const svg = getSvgForState(this.currentState, this.pointingDirection, vibeColours);
    this.postMessage({
      command: 'setState',
      state: this.currentState,
      svg: svg,
    });
  }

  /**
   * Shows a random message for the current state.
   */
  private showRandomMessage(): void {
    const messages = STATE_MESSAGES[this.currentState];
    if (messages && messages.length > 0) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      this.showChatBubble({ text: messages[randomIndex] });
    }
  }

  /**
   * Posts a message to the webview.
   */
  private postMessage(message: unknown): void {
    if (this.panel) {
      this.panel.webview.postMessage(message);
    }
  }

  /**
   * Handles messages from the webview.
   */
  private handleMessage(message: { command: string; [key: string]: unknown }): void {
    switch (message.command) {
      case 'ready':
        this.updateCharacter();
        break;
      case 'clicked':
        getVibeActivityTracker().recordActivity();
        break;
    }
  }

  /**
   * Gets the HTML content for the webview.
   */
  private getHtmlContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src data:;
                 script-src 'nonce-${nonce}';
                 style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      height: 100vh;
      overflow: hidden;
      background: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    #character-container {
      position: relative;
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }

    #character {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #character svg {
      max-width: 100%;
      max-height: 100%;
    }

    #chat-bubble {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: var(--vscode-editor-background);
      border: 2px solid var(--vscode-button-background);
      border-radius: 12px;
      padding: 10px 14px;
      max-width: 220px;
      text-align: center;
      font-size: 13px;
      color: var(--vscode-editor-foreground);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    }

    #chat-bubble::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 8px;
      border-style: solid;
      border-color: var(--vscode-button-background) transparent transparent transparent;
    }

    #chat-bubble.visible {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }

    #state-label {
      margin-top: 16px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Idle animations */
    @keyframes idle-bob {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-5px) rotate(-2deg); }
      50% { transform: translateY(-2px) rotate(0deg); }
      75% { transform: translateY(-5px) rotate(2deg); }
    }

    @keyframes idle-look-around {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }

    @keyframes idle-stretch {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.05); }
    }

    @keyframes sleeping-breathe {
      0%, 100% { transform: scale(1); filter: brightness(0.85) saturate(0.8); }
      50% { transform: scale(0.97); filter: brightness(0.8) saturate(0.75); }
    }

    .sleeping #character-container {
      animation: sleeping-breathe 4s ease-in-out infinite;
    }

    .celebrating #character-container {
      animation: idle-bob 0.5s ease-in-out infinite;
    }

    .detecting #character-container {
      animation: idle-look-around 2s ease-in-out infinite;
    }
  </style>
</head>
<body class="idle">
  <div id="character-container">
    <div id="chat-bubble"></div>
    <div id="character"></div>
  </div>
  <div id="state-label">idle</div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const character = document.getElementById('character');
    const container = document.getElementById('character-container');
    const bubble = document.getElementById('chat-bubble');
    const stateLabel = document.getElementById('state-label');
    const body = document.body;

    let currentState = 'idle';
    const idleAnimations = ['idle-bob', 'idle-look-around', 'idle-stretch'];
    let animationTimeout;

    container.addEventListener('click', () => {
      vscode.postMessage({ command: 'clicked' });
    });

    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.command) {
        case 'setState':
          updateState(msg.state, msg.svg);
          break;
        case 'showBubble':
          showChatBubble(msg.text);
          break;
        case 'hideBubble':
          hideChatBubble();
          break;
        case 'triggerIdleAnimation':
          triggerRandomIdleAnimation();
          break;
      }
    });

    function updateState(state, svg) {
      currentState = state;
      body.className = state;
      stateLabel.textContent = state;

      if (svg) {
        character.innerHTML = svg;
      }
    }

    function showChatBubble(text) {
      bubble.textContent = text;
      bubble.classList.add('visible');
    }

    function hideChatBubble() {
      bubble.classList.remove('visible');
    }

    function triggerRandomIdleAnimation() {
      if (currentState !== 'idle' && currentState !== 'watching') return;

      const anim = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];

      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }

      container.style.animation = anim + ' 2s ease-in-out';

      animationTimeout = setTimeout(() => {
        container.style.animation = '';
      }, 2000);
    }

    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
  }

  /**
   * Generates a nonce for Content Security Policy.
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }

    this.panel?.dispose();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];

    VibePanelProvider.instance = undefined;
  }
}

/**
 * Gets the singleton VibePanelProvider instance.
 *
 * @param extensionUri - Extension URI for resource access
 */
export function getVibePanelProvider(extensionUri: vscode.Uri): VibePanelProvider {
  return VibePanelProvider.getInstance(extensionUri);
}

/**
 * Initialises the Vibe panel with state machine and activity tracker integration.
 *
 * @param context - Extension context
 * @returns The initialised panel provider
 */
export function initVibePanel(context: vscode.ExtensionContext): VibePanelProvider {
  const provider = getVibePanelProvider(context.extensionUri);
  const stateMachine = getVibeStateMachine();
  const eventBus = getEventBus();

  const activityTracker = initActivityTracker(context, {
    onResetToIdle: () => {
      if (stateMachine.isInterruptible) {
        stateMachine.send({ type: 'RESET' });
      }
    },
    onIdleAnimation: () => {
      provider.triggerIdleAnimation();
    },
    onSleep: () => {
      if (stateMachine.isInterruptible) {
        stateMachine.send({ type: 'SLEEP' });
      }
    },
    onWake: () => {
      stateMachine.send({ type: 'WAKE' });
    },
  });

  const stateChangeDisposable = stateMachine.onStateChange((newState, prevState, event, ctx) => {
    console.log(`[VibePanelProvider] State change: ${prevState} -> ${newState} (${event.type})`);
    if (newState === 'pointing' && ctx.pointingDirection) {
      provider.setState(newState, ctx.pointingDirection);
    } else {
      provider.setState(newState);
    }
  });

  const vibeDetectedHandler = eventBus.on('vibe:detected', (data) => {
    console.log(`[VibePanelProvider] vibe:detected event received, current state: ${stateMachine.state}`);
    stateMachine.send({
      type: 'VIBE_DETECTED',
      triggeredBy: data.triggeredBy,
      indicatorValue: data.indicatorValue,
      line: data.line,
    });
    activityTracker.recordActivity();
  });

  const vibecheckStartedHandler = eventBus.on('vibecheck:started', (data) => {
    console.log(`[VibePanelProvider] vibecheck:started event received, current state: ${stateMachine.state}`);
    stateMachine.send({
      type: 'START_VIBECHECK',
      vibecheckId: data.id,
      triggeredBy: data.triggeredBy,
    });
    activityTracker.recordActivity();
  });

  const vibecheckCompletedHandler = eventBus.on('vibecheck:completed', (data) => {
    console.log(`[VibePanelProvider] vibecheck:completed event received, passed: ${data.passed}, score: ${data.score}, current state: ${stateMachine.state}`);
    if (data.passed) {
      stateMachine.send({ type: 'VIBECHECK_PASSED' });
    } else {
      stateMachine.send({ type: 'VIBECHECK_FAILED' });
    }
    activityTracker.recordActivity();
  });

  const vibecheckSkippedHandler = eventBus.on('vibecheck:skipped', () => {
    console.log(`[VibePanelProvider] vibecheck:skipped event received, current state: ${stateMachine.state}`);
    stateMachine.send({ type: 'VIBECHECK_SKIPPED' });
    activityTracker.recordActivity();
  });

  const showVibeCommand = vscode.commands.registerCommand('codswallop.showVibe', () => {
    provider.show();
  });

  context.subscriptions.push(
    provider,
    stateChangeDisposable,
    vibeDetectedHandler,
    vibecheckStartedHandler,
    vibecheckCompletedHandler,
    vibecheckSkippedHandler,
    showVibeCommand
  );

  return provider;
}
