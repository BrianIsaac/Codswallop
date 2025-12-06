/**
 * Vibecheck webview panel for displaying quiz UI.
 *
 * Displays comprehension questions in a webview, handles user interactions,
 * tracks progress, and reports results back to the extension.
 */

import * as vscode from 'vscode';
import { getEventBus, IndicatorType } from './event-bus';
import {
  VibecheckOutput,
  VibecheckQuestion,
  QuestionAnswer,
  VibecheckResult,
  calculateVibecheckResult,
} from './mcp/schemas/vibecheck-output';

/** Message types sent from webview to extension. */
interface WebviewMessage {
  type: 'answer' | 'skip' | 'hint' | 'ready';
  questionId?: string;
  answer?: string;
  reason?: string;
}

/** Message types sent from extension to webview. */
interface ExtensionMessage {
  type: 'init' | 'feedback' | 'result' | 'hint';
  data?: unknown;
}

/**
 * Manages the vibecheck quiz webview panel.
 */
export class VibecheckPanel implements vscode.Disposable {
  private static currentPanel: VibecheckPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  private vibecheckId: string;
  private questions: VibecheckQuestion[];
  private codeSnippet: string;
  private triggeredBy: IndicatorType;
  private answers: QuestionAnswer[] = [];
  private currentQuestionIndex = 0;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    vibecheckId: string,
    output: VibecheckOutput,
    codeSnippet: string,
    triggeredBy: IndicatorType
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.vibecheckId = vibecheckId;
    this.questions = output.questions;
    this.codeSnippet = codeSnippet;
    this.triggeredBy = triggeredBy;

    this.panel.webview.html = this.getHtmlContent();

    this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this.handleMessage(message),
      null,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  /**
   * Creates or reveals the vibecheck panel.
   *
   * Args:
   *     extensionUri: The extension's URI.
   *     vibecheckId: Unique identifier for this vibecheck.
   *     output: The generated vibecheck output.
   *     codeSnippet: The code being tested.
   *     triggeredBy: The indicator that triggered the vibecheck.
   */
  static createOrShow(
    extensionUri: vscode.Uri,
    vibecheckId: string,
    output: VibecheckOutput,
    codeSnippet: string,
    triggeredBy: IndicatorType
  ): VibecheckPanel {
    const column = vscode.ViewColumn.Beside;

    if (VibecheckPanel.currentPanel) {
      VibecheckPanel.currentPanel.panel.dispose();
    }

    const panel = vscode.window.createWebviewPanel(
      'codswallop.vibecheck',
      'Codswallop Vibecheck',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    VibecheckPanel.currentPanel = new VibecheckPanel(
      panel,
      extensionUri,
      vibecheckId,
      output,
      codeSnippet,
      triggeredBy
    );

    return VibecheckPanel.currentPanel;
  }

  /**
   * Handles messages from the webview.
   */
  private handleMessage(message: WebviewMessage): void {
    switch (message.type) {
      case 'ready':
        this.sendInitData();
        break;

      case 'answer':
        if (message.questionId && message.answer !== undefined) {
          this.handleAnswer(message.questionId, message.answer);
        }
        break;

      case 'skip':
        this.handleSkip(message.reason || 'User skipped');
        break;

      case 'hint':
        if (message.questionId) {
          this.sendHint(message.questionId);
        }
        break;
    }
  }

  /**
   * Sends initial quiz data to the webview.
   */
  private sendInitData(): void {
    const message: ExtensionMessage = {
      type: 'init',
      data: {
        vibecheckId: this.vibecheckId,
        codeSnippet: this.codeSnippet,
        triggeredBy: this.triggeredBy,
        questions: this.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          concept: q.concept,
        })),
        currentIndex: this.currentQuestionIndex,
        totalQuestions: this.questions.length,
      },
    };
    this.panel.webview.postMessage(message);
  }

  /**
   * Handles a submitted answer.
   */
  private handleAnswer(questionId: string, answer: string): void {
    const question = this.questions.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = answer === question.correctAnswer;

    const questionAnswer: QuestionAnswer = {
      questionId,
      answer,
      correct: isCorrect,
      timestamp: Date.now(),
    };
    this.answers.push(questionAnswer);

    const feedbackMessage: ExtensionMessage = {
      type: 'feedback',
      data: {
        questionId,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: isCorrect
          ? 'Correct! You understand this concept.'
          : `The correct answer was: ${question.correctAnswer}`,
      },
    };
    this.panel.webview.postMessage(feedbackMessage);

    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      setTimeout(() => this.completeVibecheck(), 1500);
    } else {
      setTimeout(() => this.sendInitData(), 1500);
    }
  }

  /**
   * Sends a hint for a question.
   */
  private sendHint(questionId: string): void {
    const question = this.questions.find((q) => q.id === questionId);
    if (!question) return;

    const hintMessage: ExtensionMessage = {
      type: 'hint',
      data: {
        questionId,
        hint: question.hint || 'Look carefully at the code logic.',
      },
    };
    this.panel.webview.postMessage(hintMessage);
  }

  /**
   * Handles skipping the vibecheck.
   */
  private handleSkip(reason: string): void {
    getEventBus().fire('vibecheck:skipped', {
      id: this.vibecheckId,
      reason,
    });
    this.panel.dispose();
  }

  /**
   * Completes the vibecheck and reports results.
   */
  private completeVibecheck(): void {
    const result = calculateVibecheckResult(
      this.vibecheckId,
      this.answers,
      this.questions.length
    );

    const resultMessage: ExtensionMessage = {
      type: 'result',
      data: {
        passed: result.passed,
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        percentage: Math.round(result.score * 100),
      },
    };
    this.panel.webview.postMessage(resultMessage);

    getEventBus().fire('vibecheck:completed', {
      id: this.vibecheckId,
      passed: result.passed,
      score: result.score,
      answers: result.answers.map((a) => ({
        questionId: a.questionId,
        correct: a.correct,
      })),
    });
  }

  /**
   * Gets the result of the vibecheck.
   */
  getResult(): VibecheckResult | null {
    if (this.answers.length < this.questions.length) {
      return null;
    }
    return calculateVibecheckResult(
      this.vibecheckId,
      this.answers,
      this.questions.length
    );
  }

  /**
   * Generates the HTML content for the webview.
   */
  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Codswallop Vibecheck</title>
  <style>
    :root {
      --primary: #6366F1;
      --secondary: #8B5CF6;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --bg-dark: #1F2937;
      --bg-light: #F9FAFB;
      --text-primary: #374151;
      --text-light: #9CA3AF;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #d4d4d4);
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border, #454545);
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .trigger-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      background: var(--secondary);
      color: white;
    }

    .code-section {
      margin-bottom: 24px;
    }

    .code-section h2 {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-light);
    }

    .code-block {
      background: var(--vscode-textCodeBlock-background, #2d2d2d);
      border: 1px solid var(--vscode-panel-border, #454545);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 0.875rem;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }

    .question-section {
      background: var(--vscode-input-background, #3c3c3c);
      border: 1px solid var(--vscode-panel-border, #454545);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .question-counter {
      font-size: 0.875rem;
      color: var(--text-light);
    }

    .question-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, #3a3a3a);
      color: var(--vscode-button-secondaryForeground, #cccccc);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, #505050);
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: #5558E3;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .question-text {
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .concept-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      background: var(--secondary);
      color: white;
      margin-bottom: 16px;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border: 2px solid var(--vscode-panel-border, #454545);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .option:hover {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.1);
    }

    .option.selected {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.2);
    }

    .option.correct {
      border-color: var(--success);
      background: rgba(16, 185, 129, 0.2);
    }

    .option.incorrect {
      border-color: var(--danger);
      background: rgba(239, 68, 68, 0.2);
    }

    .option input {
      display: none;
    }

    .option-indicator {
      width: 20px;
      height: 20px;
      border: 2px solid var(--vscode-panel-border, #454545);
      border-radius: 50%;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .option.selected .option-indicator {
      border-color: var(--primary);
      background: var(--primary);
    }

    .option.selected .option-indicator::after {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }

    .submit-section {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .progress-section {
      margin-top: 24px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 8px;
      background: var(--vscode-panel-border, #454545);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s;
    }

    .hint-box {
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid var(--warning);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .feedback-box {
      margin-top: 16px;
      padding: 16px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .feedback-box.correct {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--success);
    }

    .feedback-box.incorrect {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--danger);
    }

    .result-section {
      text-align: center;
      padding: 40px 20px;
    }

    .result-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .result-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .result-score {
      font-size: 2rem;
      font-weight: 700;
      margin: 16px 0;
    }

    .result-score.passed {
      color: var(--success);
    }

    .result-score.failed {
      color: var(--danger);
    }

    .result-message {
      font-size: 1rem;
      color: var(--text-light);
    }

    .loading {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--vscode-panel-border, #454545);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Codswallop Vibecheck</h1>
      <span class="trigger-badge" id="trigger-badge"></span>
    </header>

    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading vibecheck...</p>
    </div>

    <div id="quiz-content" class="hidden">
      <div class="code-section">
        <h2>Code Being Tested:</h2>
        <pre class="code-block" id="code-block"></pre>
      </div>

      <div class="question-section" id="question-section">
        <div class="question-header">
          <span class="question-counter" id="question-counter">Question 1 of 4</span>
          <div class="question-actions">
            <button class="btn btn-secondary" id="skip-btn">Skip</button>
            <button class="btn btn-secondary" id="hint-btn">Hint</button>
          </div>
        </div>

        <span class="concept-tag" id="concept-tag"></span>
        <p class="question-text" id="question-text"></p>

        <div class="options" id="options"></div>

        <div id="hint-box" class="hint-box hidden"></div>
        <div id="feedback-box" class="feedback-box hidden"></div>

        <div class="submit-section">
          <button class="btn btn-primary" id="submit-btn" disabled>Submit Answer</button>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-label">
          <span>Progress</span>
          <span id="progress-text">0/4</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
        </div>
      </div>
    </div>

    <div id="result-section" class="result-section hidden">
      <div class="result-icon" id="result-icon"></div>
      <h2 class="result-title" id="result-title"></h2>
      <p class="result-score" id="result-score"></p>
      <p class="result-message" id="result-message"></p>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    let state = {
      questions: [],
      currentIndex: 0,
      totalQuestions: 0,
      selectedAnswer: null,
      answered: false
    };

    const triggerLabels = {
      'line_spike': 'Line Spike Detected',
      'high_complexity': 'High Complexity',
      'paste': 'Paste Detected'
    };

    function init() {
      document.getElementById('skip-btn').addEventListener('click', handleSkip);
      document.getElementById('hint-btn').addEventListener('click', handleHint);
      document.getElementById('submit-btn').addEventListener('click', handleSubmit);

      vscode.postMessage({ type: 'ready' });
    }

    function showQuiz(data) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('quiz-content').classList.remove('hidden');
      document.getElementById('result-section').classList.add('hidden');

      state.questions = data.questions;
      state.currentIndex = data.currentIndex;
      state.totalQuestions = data.totalQuestions;
      state.selectedAnswer = null;
      state.answered = false;

      document.getElementById('trigger-badge').textContent = triggerLabels[data.triggeredBy] || data.triggeredBy;
      document.getElementById('code-block').textContent = data.codeSnippet;

      renderQuestion();
      updateProgress();
    }

    function renderQuestion() {
      const question = state.questions[state.currentIndex];
      if (!question) return;

      document.getElementById('question-counter').textContent =
        'Question ' + (state.currentIndex + 1) + ' of ' + state.totalQuestions;
      document.getElementById('concept-tag').textContent = question.concept;
      document.getElementById('question-text').textContent = question.text;

      const optionsContainer = document.getElementById('options');
      optionsContainer.innerHTML = '';

      question.options.forEach((option, index) => {
        const optionEl = document.createElement('label');
        optionEl.className = 'option';
        optionEl.innerHTML =
          '<input type="radio" name="answer" value="' + escapeHtml(option) + '">' +
          '<span class="option-indicator"></span>' +
          '<span class="option-text">' + escapeHtml(option) + '</span>';

        optionEl.addEventListener('click', () => selectOption(option, optionEl));
        optionsContainer.appendChild(optionEl);
      });

      document.getElementById('hint-box').classList.add('hidden');
      document.getElementById('feedback-box').classList.add('hidden');
      document.getElementById('submit-btn').disabled = true;
    }

    function selectOption(answer, element) {
      if (state.answered) return;

      state.selectedAnswer = answer;

      document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
      element.classList.add('selected');

      document.getElementById('submit-btn').disabled = false;
    }

    function handleSubmit() {
      if (!state.selectedAnswer || state.answered) return;

      state.answered = true;
      document.getElementById('submit-btn').disabled = true;

      const question = state.questions[state.currentIndex];
      vscode.postMessage({
        type: 'answer',
        questionId: question.id,
        answer: state.selectedAnswer
      });
    }

    function handleSkip() {
      vscode.postMessage({
        type: 'skip',
        reason: 'User skipped vibecheck'
      });
    }

    function handleHint() {
      const question = state.questions[state.currentIndex];
      vscode.postMessage({
        type: 'hint',
        questionId: question.id
      });
    }

    function showFeedback(data) {
      const feedbackBox = document.getElementById('feedback-box');
      feedbackBox.textContent = data.explanation;
      feedbackBox.className = 'feedback-box ' + (data.correct ? 'correct' : 'incorrect');
      feedbackBox.classList.remove('hidden');

      document.querySelectorAll('.option').forEach(opt => {
        const optionValue = opt.querySelector('input').value;
        if (optionValue === data.correctAnswer) {
          opt.classList.add('correct');
        } else if (opt.classList.contains('selected')) {
          opt.classList.add('incorrect');
        }
      });
    }

    function showHint(data) {
      const hintBox = document.getElementById('hint-box');
      hintBox.textContent = 'Hint: ' + data.hint;
      hintBox.classList.remove('hidden');
    }

    function showResult(data) {
      document.getElementById('quiz-content').classList.add('hidden');
      document.getElementById('result-section').classList.remove('hidden');

      const passed = data.passed;

      document.getElementById('result-icon').textContent = passed ? '\\u2713' : '\\u2717';
      document.getElementById('result-title').textContent = passed ? 'PASS!' : 'Keep Practising!';

      const scoreEl = document.getElementById('result-score');
      scoreEl.textContent = data.percentage + '%';
      scoreEl.className = 'result-score ' + (passed ? 'passed' : 'failed');

      document.getElementById('result-message').textContent =
        data.correctCount + ' of ' + data.totalQuestions + ' questions correct. ' +
        (passed ? 'Great job understanding this code!' : 'Review the code and try again.');
    }

    function updateProgress() {
      const progress = (state.currentIndex / state.totalQuestions) * 100;
      document.getElementById('progress-fill').style.width = progress + '%';
      document.getElementById('progress-text').textContent =
        state.currentIndex + '/' + state.totalQuestions;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'init':
          showQuiz(message.data);
          break;
        case 'feedback':
          showFeedback(message.data);
          break;
        case 'hint':
          showHint(message.data);
          break;
        case 'result':
          showResult(message.data);
          break;
      }
    });

    init();
  </script>
</body>
</html>`;
  }

  /**
   * Disposes of the panel resources.
   */
  dispose(): void {
    VibecheckPanel.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}

let panelInstance: VibecheckPanel | null = null;

/**
 * Shows a vibecheck panel for a detection.
 *
 * Args:
 *     extensionUri: The extension's URI.
 *     vibecheckId: Unique identifier for this vibecheck.
 *     output: The generated vibecheck output.
 *     codeSnippet: The code being tested.
 *     triggeredBy: The indicator that triggered the vibecheck.
 *
 * Returns:
 *     The created vibecheck panel.
 */
export function showVibecheckPanel(
  extensionUri: vscode.Uri,
  vibecheckId: string,
  output: VibecheckOutput,
  codeSnippet: string,
  triggeredBy: IndicatorType
): VibecheckPanel {
  panelInstance = VibecheckPanel.createOrShow(
    extensionUri,
    vibecheckId,
    output,
    codeSnippet,
    triggeredBy
  );
  return panelInstance;
}
