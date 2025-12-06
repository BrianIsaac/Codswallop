# Codswallop Implementation Roadmap

## Phase Overview

```
+------------------------------------------------------------------------+
|                        IMPLEMENTATION PHASES                            |
+------------------------------------------------------------------------+
|                                                                         |
|  Phase 1        Phase 2        Phase 3        Phase 4        Phase 5   |
|  FOUNDATION     DETECTION      VIBECHECKS     DASHBOARD      POLISH    |
|                                                                         |
|  +--------+     +--------+     +--------+     +--------+     +--------+ |
|  |        |     |        |     |        |     |        |     |        | |
|  | VSCode |---->| TS     |---->| TS MCP |---->| Vercel |---->| Docs   | |
|  | Ext    |     | Detect |     | Anthr- |     | Front  |     | Tests  | |
|  | Convex |     | Events |     | opic   |     | Real-  |     | Demo   | |
|  |        |     |        |     |        |     | time   |     |        | |
|  +--------+     +--------+     +--------+     +--------+     +--------+ |
|                                                                         |
+------------------------------------------------------------------------+

Note: Entire extension is TypeScript - no Python runtime dependency.
```

## Phase 1: Foundation Setup

### 1.1 Project Scaffolding

```bash
# Directory structure to create
codswallop/
├── extension/                    # VSCode extension (TypeScript)
│   ├── src/
│   │   ├── extension.ts          # Entry point
│   │   ├── event-bus.ts          # Type-safe pub/sub
│   │   ├── convex-client.ts      # Database sync
│   │   ├── vibe-detector.ts      # Detection orchestrator + deduplication
│   │   ├── complexity-analyser.ts # Cyclomatic complexity (TS)
│   │   ├── document-tracker.ts   # Line/paste detection
│   │   ├── codelens-provider.ts  # Clickable indicators
│   │   ├── decoration-manager.ts # Mascot gutter icons
│   │   ├── vibecheck-panel.ts    # Quiz webview
│   │   ├── vibe-panel-provider.ts # Animated agent panel
│   │   ├── vibe-svg-character.ts # SVG generation
│   │   ├── vibe-state-machine.ts # Character states
│   │   ├── vibe-activity-tracker.ts # Sleep/wake system
│   │   └── vibe-movement.ts      # Pointing logic
│   ├── src/mcp/                  # LeanMCP Server
│   │   ├── main.ts               # HTTP server entry point
│   │   ├── services/
│   │   │   ├── vibecheck-service.ts   # @Tool decorator
│   │   │   └── analysis-service.ts    # Code analysis tools
│   │   └── schemas/
│   │       ├── vibecheck-input.ts     # @SchemaConstraint classes
│   │       └── vibecheck-output.ts
│   ├── media/                    # Gutter icons
│   │   ├── vibe-rushing.svg      # Line spike icon
│   │   ├── vibe-confused.svg     # High complexity icon
│   │   └── vibe-clipboard.svg    # Paste detected icon
│   ├── package.json
│   └── tsconfig.json
├── convex/                       # Convex database
│   ├── schema.ts
│   ├── users.ts
│   ├── vibechecks.ts
│   └── ...
├── dashboard/                    # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
└── docs/                         # Documentation
```

### 1.2 VSCode Extension Initialisation

**File: extension/package.json**
```json
{
  "name": "codswallop",
  "displayName": "Codswallop",
  "description": "Vibecode checker for educational coding",
  "version": "0.1.0",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Education", "Linters"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "codswallop.startVibecheck",
        "title": "Codswallop: Start Vibecheck"
      },
      {
        "command": "codswallop.showDetections",
        "title": "Codswallop: Show Detections"
      },
      {
        "command": "codswallop.openDashboard",
        "title": "Codswallop: Open Dashboard"
      }
    ],
    "configuration": {
      "title": "Codswallop",
      "properties": {
        "codswallop.enabled": {
          "type": "boolean",
          "default": true
        },
        "codswallop.thresholds.complexity": {
          "type": "number",
          "default": 20,
          "description": "Cyclomatic complexity threshold for immediate trigger"
        },
        "codswallop.thresholds.lineSpike": {
          "type": "number",
          "default": 50,
          "description": "Lines per minute threshold for immediate trigger"
        },
        "codswallop.thresholds.pasteLines": {
          "type": "number",
          "default": 10,
          "description": "Pasted lines threshold for immediate trigger"
        },
        "codswallop.thresholds.cursorPositions": {
          "type": "number",
          "default": 5,
          "description": "Minimum unique cursor positions required"
        },
        "codswallop.debounceWindow": {
          "type": "number",
          "default": 60000,
          "description": "Milliseconds cooldown per location before re-triggering"
        }
      }
    }
  },
  "dependencies": {
    "convex": "^1.10.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@leanmcp/core": "^0.3.0",
    "typescript": "^5.0.0"
  }
}
```

### 1.3 Convex Setup

**File: convex/schema.ts**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher")),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  vibechecks: defineTable({
    userId: v.id("users"),
    fileUri: v.string(),
    line: v.number(),
    code: v.string(),
    language: v.string(),
    triggeredBy: v.union(
      v.literal("line_spike"),
      v.literal("high_complexity"),
      v.literal("paste")
    ),
    indicatorValue: v.number(),
    indicatorThreshold: v.number(),
    complexity: v.optional(v.number()),
    questions: v.array(v.object({
      id: v.string(),
      text: v.string(),
      type: v.union(v.literal("multiple_choice"), v.literal("free_text")),
      options: v.optional(v.array(v.string())),
      correctAnswer: v.string(),
      concept: v.string(),
    })),
    answers: v.array(v.object({
      questionId: v.string(),
      answer: v.string(),
      correct: v.boolean(),
      timestamp: v.number(),
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_trigger", ["triggeredBy"]),

  metrics: defineTable({
    userId: v.id("users"),
    date: v.string(),
    totalLines: v.number(),
    vibeCodedLines: v.number(),
    vibechecksCompleted: v.number(),
    vibechecksPassed: v.number(),
    averageComplexity: v.number(),
    averageVibeScore: v.number(),
    conceptScores: v.object({}), // Dynamic concept -> score mapping
  })
    .index("by_user_date", ["userId", "date"]),

  classrooms: defineTable({
    teacherId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    joinCode: v.string(),
    studentIds: v.array(v.id("users")),
    settings: v.object({
      autoVibecheck: v.boolean(),
      minComplexity: v.number(),
      notifyOnFail: v.boolean(),
    }),
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_code", ["joinCode"]),

  activityLog: defineTable({
    userId: v.id("users"),
    classroomId: v.optional(v.id("classrooms")),
    eventType: v.string(),
    metadata: v.any(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_classroom", ["classroomId"])
    .index("by_timestamp", ["timestamp"]),
});
```

### 1.4 Event Bus Implementation

**File: extension/src/event-bus.ts**
```typescript
import * as vscode from 'vscode';

type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

interface EventMap {
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
  // Immediate trigger - fires when ANY threshold exceeded
  'vibe:detected': {
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
    indicatorValue: number;
    threshold: number;
    codeSnippet: string;
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
    functions: Array<{
      name: string;
      line: number;
      complexity: number;
    }>;
  };
  'convex:synced': {
    operation: 'create' | 'update' | 'delete';
    table: string;
    id: string;
  };
}

type EventType = keyof EventMap;
type EventHandler<T extends EventType> = (data: EventMap[T]) => void;

class EventBus {
  private static instance: EventBus;
  private emitter = new vscode.EventEmitter<{ type: string; data: unknown }>();
  private handlers = new Map<string, Set<EventHandler<never>>>();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  fire<T extends EventType>(type: T, data: EventMap[T]): void {
    this.emitter.fire({ type, data });
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as EventHandler<T>)(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${type}:`, error);
        }
      });
    }
  }

  on<T extends EventType>(type: T, handler: EventHandler<T>): vscode.Disposable {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<never>);

    return new vscode.Disposable(() => {
      this.handlers.get(type)?.delete(handler as EventHandler<never>);
    });
  }

  dispose(): void {
    this.emitter.dispose();
    this.handlers.clear();
  }
}

export const getEventBus = () => EventBus.getInstance();
```

**Deliverables Phase 1:**
- [ ] VSCode extension scaffold with commands
- [ ] Event bus implementation
- [ ] Convex project with schema
- [ ] Basic extension activation

---

## Phase 2: Vibe Detection Engine (Immediate Trigger System)

### 2.1 TypeScript Complexity Analyser

For TypeScript/JavaScript files, use `tsmetrics-core` pattern:

**File: extension/src/complexity-analyser.ts**
```typescript
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { getEventBus } from './event-bus';

interface FunctionComplexity {
  name: string;
  line: number;
  complexity: number;
  endLine: number;
}

export function calculateComplexity(sourceFile: ts.SourceFile): FunctionComplexity[] {
  const functions: FunctionComplexity[] = [];

  function visit(node: ts.Node, depth = 0): number {
    let complexity = 0;

    // Count decision points
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ConditionalExpression: // Ternary
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.CaseClause:
        complexity += 1;
        break;
      case ts.SyntaxKind.BinaryExpression:
        const binary = node as ts.BinaryExpression;
        if (
          binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          binary.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          binary.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          complexity += 1;
        }
        break;
    }

    // Track function declarations
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
      const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
      const name = getFunctionName(node) || '<anonymous>';

      let funcComplexity = 1; // Base complexity
      node.forEachChild(child => {
        funcComplexity += visit(child, depth + 1);
      });

      functions.push({
        name,
        line: startLine + 1, // 1-indexed
        complexity: funcComplexity,
        endLine: endLine + 1,
      });

      return 0; // Don't double-count
    }

    node.forEachChild(child => {
      complexity += visit(child, depth + 1);
    });

    return complexity;
  }

  visit(sourceFile);
  return functions;
}

function getFunctionName(node: ts.Node): string | undefined {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return node.name?.getText();
  }
  if (ts.isVariableDeclaration(node.parent)) {
    return node.parent.name.getText();
  }
  return undefined;
}

export class ComplexityAnalyser implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for document changes with debounce
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        this.scheduleAnalysis(e.document);
      })
    );

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(doc => {
        this.analyseDocument(doc);
      })
    );
  }

  private scheduleAnalysis(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.analyseDocument(document);
    }, 500); // 500ms debounce
  }

  private analyseDocument(document: vscode.TextDocument): void {
    if (!this.isSupportedLanguage(document.languageId)) {
      return;
    }

    const sourceFile = ts.createSourceFile(
      document.fileName,
      document.getText(),
      ts.ScriptTarget.Latest,
      true
    );

    const functions = calculateComplexity(sourceFile);

    getEventBus().fire('lsp:complexity', {
      uri: document.uri.toString(),
      functions,
    });
  }

  private isSupportedLanguage(languageId: string): boolean {
    return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(
      languageId
    );
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.disposables.forEach(d => d.dispose());
  }
}
```

### 2.3 Document Tracker (Line Delta Detection)

**File: extension/src/document-tracker.ts**
```typescript
import * as vscode from 'vscode';
import { getEventBus } from './event-bus';

interface DocumentState {
  lineCount: number;
  lastModified: number;
  cursorPositions: number[];
}

export class DocumentTracker implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private documentStates = new Map<string, DocumentState>();
  private cursorHistory = new Map<string, number[]>();

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        this.handleDocumentChange(e);
      })
    );

    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(e => {
        this.trackCursorMovement(e);
      })
    );

    // Initialise state for open documents
    vscode.workspace.textDocuments.forEach(doc => {
      this.initDocumentState(doc);
    });
  }

  private initDocumentState(document: vscode.TextDocument): void {
    this.documentStates.set(document.uri.toString(), {
      lineCount: document.lineCount,
      lastModified: Date.now(),
      cursorPositions: [],
    });
  }

  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const uri = event.document.uri.toString();
    const prevState = this.documentStates.get(uri);

    if (!prevState) {
      this.initDocumentState(event.document);
      return;
    }

    const newLineCount = event.document.lineCount;
    const linesDelta = newLineCount - prevState.lineCount;
    const timeDelta = Date.now() - prevState.lastModified;

    // Update state
    this.documentStates.set(uri, {
      lineCount: newLineCount,
      lastModified: Date.now(),
      cursorPositions: prevState.cursorPositions,
    });

    // Fire event for significant changes
    if (Math.abs(linesDelta) > 0) {
      getEventBus().fire('document:changed', {
        uri,
        linesDelta,
        timestamp: Date.now(),
      });
    }

    // Detect paste (large insertion in short time)
    if (linesDelta > 10 && timeDelta < 100) {
      const insertedText = event.contentChanges
        .map(c => c.text)
        .join('');

      getEventBus().fire('document:pasted', {
        uri,
        content: insertedText,
        lineCount: linesDelta,
        cursorLine: event.contentChanges[0]?.range.start.line || 0,
      });
    }
  }

  private trackCursorMovement(event: vscode.TextEditorSelectionChangeEvent): void {
    const uri = event.textEditor.document.uri.toString();
    const line = event.selections[0]?.active.line;

    if (line === undefined) return;

    if (!this.cursorHistory.has(uri)) {
      this.cursorHistory.set(uri, []);
    }

    const history = this.cursorHistory.get(uri)!;
    history.push(line);

    // Keep last 100 positions
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get unique cursor positions in recent history.
   * Low unique positions + large code addition = likely vibe coding.
   */
  getUniqueCursorPositions(uri: string): number {
    const history = this.cursorHistory.get(uri) || [];
    return new Set(history).size;
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
```

**Deliverables Phase 2:**
- [ ] TypeScript complexity analyser (immediate trigger on >20)
- [ ] Document tracker with line spike detection (immediate trigger on >50 lines/min)
- [ ] Paste detection system (immediate trigger on >10 lines)
- [ ] Cursor movement tracking (immediate trigger on <5 positions)
- [ ] Deduplication system (60s cooldown per uri:line)
- [ ] Mascot gutter icons per indicator type

---

## Phase 3: Vibecheck Generation

### 3.1 LeanMCP Server with Anthropic

LeanMCP provides decorator-based MCP server implementation. Requires `experimentalDecorators: true` in tsconfig.json.

**File: extension/src/mcp/schemas/vibecheck-input.ts**
```typescript
import { SchemaConstraint, Optional } from "@leanmcp/core";

type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

export class GenerateVibecheckInput {
  @SchemaConstraint({ description: 'Code snippet to analyse', minLength: 1 })
  code!: string;

  @SchemaConstraint({
    description: 'Programming language',
    enum: ['typescript', 'javascript', 'python', 'java', 'go']
  })
  language!: string;

  @SchemaConstraint({
    description: 'Which indicator triggered this vibecheck',
    enum: ['line_spike', 'high_complexity', 'paste']
  })
  triggeredBy!: IndicatorType;

  @Optional()
  @SchemaConstraint({
    description: 'Difficulty level',
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  })
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @Optional()
  @SchemaConstraint({ description: 'Number of questions', minimum: 2, maximum: 6, default: 4 })
  numQuestions?: number;
}
```

**File: extension/src/mcp/services/vibecheck-service.ts**
```typescript
import { Tool, SchemaConstraint } from "@leanmcp/core";
import Anthropic from '@anthropic-ai/sdk';
import { GenerateVibecheckInput } from '../schemas/vibecheck-input';

type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

const FOCUS_AREAS: Record<IndicatorType, string> = {
  line_spike: 'control flow, edge cases, variable scope',
  high_complexity: 'branching logic, loop conditions, error paths',
  paste: 'overall logic, data flow, API contracts',
};

const TRIGGER_CONTEXT: Record<IndicatorType, string> = {
  line_spike: 'This code was added very quickly. This may indicate copying without understanding.',
  high_complexity: 'This function has high cyclomatic complexity. Understanding complex control flow is crucial.',
  paste: 'This code appears to be pasted. Let\'s verify your understanding.',
};

export class VibecheckService {
  private anthropic = new Anthropic();

  @Tool({
    description: 'Generate comprehension questions for a code snippet based on detected vibe coding indicator',
    inputClass: GenerateVibecheckInput
  })
  async generateVibecheck(args: GenerateVibecheckInput) {
    const { code, language, triggeredBy, difficulty = 'intermediate', numQuestions = 4 } = args;

    const prompt = `You are an educational coding assistant. A student has written code that may have been copied without full understanding.

${TRIGGER_CONTEXT[triggeredBy]}

Generate a comprehension quiz to verify their understanding. The questions should:
1. Test understanding of the code's logic, not just syntax
2. Focus especially on: ${FOCUS_AREAS[triggeredBy]}
3. Be appropriate for the ${difficulty} level
4. Include questions about edge cases and error handling

Code to analyse:
\`\`\`${language}
${code}
\`\`\`

Generate exactly ${numQuestions} questions in JSON format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "concept": "concept_name",
      "explanation": "Why this is the correct answer"
    }
  ]
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const result = JSON.parse(responseText.slice(jsonStart, jsonEnd));
        return {
          questions: result.questions || [],
          language,
          triggeredBy,
          generatedAt: Date.now(),
        };
      }
    } catch {
      // JSON parse failed
    }

    return { questions: [], language, triggeredBy, generatedAt: Date.now() };
  }
}
```

**File: extension/src/mcp/main.ts**
```typescript
import { createHTTPServer, MCPServer } from "@leanmcp/core";
import { VibecheckService } from "./services/vibecheck-service";

const server = new MCPServer({
  name: "codswallop-mcp",
  version: "1.0.0",
  autoDiscover: false,
});

server.registerService(new VibecheckService());

// For local development: HTTP server on localhost:3000
// For production: deploy to ship.leanmcp.com
await createHTTPServer(() => server.getServer(), {
  port: parseInt(process.env.PORT || "3000"),
  cors: true,
});
```

**Hosting Strategy:**

| Environment | Transport | Configuration |
|-------------|-----------|---------------|
| Local dev | HTTP localhost:3000 | `npm run mcp:dev` |
| Production | ship.leanmcp.com | Streamable HTTP, managed |

Codswallop uses **ship.leanmcp.com** for production - enables classroom scalability with multiple concurrent students accessing the same MCP endpoint.

### 3.2 Vibecheck Webview Panel

**File: extension/src/vibecheck-panel.ts**
```typescript
import * as vscode from 'vscode';
import { getEventBus } from './event-bus';

interface VibecheckQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'free_text';
  options?: string[];
  correctAnswer: string;
  concept: string;
}

interface VibecheckData {
  id: string;
  code: string;
  language: string;
  questions: VibecheckQuestion[];
  uri: string;
  line: number;
}

export class VibecheckPanel {
  public static currentPanel: VibecheckPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _data: VibecheckData;
  private _answers: Map<string, string> = new Map();

  private constructor(panel: vscode.WebviewPanel, data: VibecheckData) {
    this._panel = panel;
    this._data = data;

    this._panel.webview.html = this._getHtml();

    this._panel.webview.onDidReceiveMessage(
      message => this._handleMessage(message),
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static show(data: VibecheckData): void {
    const column = vscode.ViewColumn.Beside;

    if (VibecheckPanel.currentPanel) {
      VibecheckPanel.currentPanel._panel.reveal(column);
      VibecheckPanel.currentPanel._data = data;
      VibecheckPanel.currentPanel._panel.webview.html =
        VibecheckPanel.currentPanel._getHtml();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codswallop.vibecheck',
      'Codswallop Vibecheck',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    VibecheckPanel.currentPanel = new VibecheckPanel(panel, data);

    getEventBus().fire('vibecheck:started', {
      id: data.id,
      uri: data.uri,
      line: data.line,
    });
  }

  private _handleMessage(message: { type: string; data?: unknown }): void {
    switch (message.type) {
      case 'submit':
        this._handleSubmit(message.data as { questionId: string; answer: string });
        break;
      case 'skip':
        this._handleSkip(message.data as { reason: string });
        break;
      case 'hint':
        this._showHint(message.data as { questionId: string });
        break;
    }
  }

  private _handleSubmit(data: { questionId: string; answer: string }): void {
    this._answers.set(data.questionId, data.answer);

    const question = this._data.questions.find(q => q.id === data.questionId);
    const correct = question?.correctAnswer === data.answer;

    // Send result back to webview
    this._panel.webview.postMessage({
      type: 'answerResult',
      data: { questionId: data.questionId, correct },
    });

    // Check if all questions answered
    if (this._answers.size === this._data.questions.length) {
      this._completeVibecheck();
    }
  }

  private _completeVibecheck(): void {
    const results = this._data.questions.map(q => ({
      questionId: q.id,
      correct: this._answers.get(q.id) === q.correctAnswer,
    }));

    const passed = results.filter(r => r.correct).length >= this._data.questions.length * 0.75;
    const score = results.filter(r => r.correct).length / this._data.questions.length;

    getEventBus().fire('vibecheck:completed', {
      id: this._data.id,
      passed,
      score,
      answers: results,
    });

    // Show completion message
    this._panel.webview.postMessage({
      type: 'completed',
      data: { passed, score, results },
    });
  }

  private _handleSkip(data: { reason: string }): void {
    getEventBus().fire('vibecheck:skipped', {
      id: this._data.id,
      reason: data.reason,
    });
    this.dispose();
  }

  private _showHint(_data: { questionId: string }): void {
    // Could integrate with LLM for dynamic hints
    vscode.window.showInformationMessage('Think about what happens when the input is empty or null.');
  }

  private _getHtml(): string {
    const questionsHtml = this._data.questions
      .map(
        (q, i) => `
        <div class="question" data-id="${q.id}">
          <h3>Question ${i + 1} of ${this._data.questions.length}</h3>
          <p class="question-text">${q.text}</p>
          ${
            q.type === 'multiple_choice'
              ? q.options!
                  .map(
                    opt => `
                  <label class="option">
                    <input type="radio" name="${q.id}" value="${opt}">
                    <span>${opt}</span>
                  </label>
                `
                  )
                  .join('')
              : `<textarea class="free-text" name="${q.id}" rows="4"></textarea>`
          }
          <div class="actions">
            <button class="hint-btn" onclick="requestHint('${q.id}')">Hint</button>
            <button class="submit-btn" onclick="submitAnswer('${q.id}')">Submit</button>
          </div>
          <div class="feedback" id="feedback-${q.id}"></div>
        </div>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .code-block {
      background: var(--vscode-textBlockQuote-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      margin-bottom: 20px;
    }
    .question {
      background: var(--vscode-input-background);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .option {
      display: block;
      padding: 8px 12px;
      margin: 4px 0;
      cursor: pointer;
      border-radius: 4px;
    }
    .option:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .option input {
      margin-right: 8px;
    }
    .actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .submit-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .hint-btn {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .skip-btn {
      background: transparent;
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-input-border);
    }
    .feedback {
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      display: none;
    }
    .feedback.correct {
      display: block;
      background: var(--vscode-testing-iconPassed);
      color: white;
    }
    .feedback.incorrect {
      display: block;
      background: var(--vscode-testing-iconFailed);
      color: white;
    }
    .progress {
      height: 4px;
      background: var(--vscode-progressBar-background);
      margin-bottom: 20px;
      border-radius: 2px;
    }
    .progress-bar {
      height: 100%;
      background: var(--vscode-button-background);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Codswallop Vibecheck</h2>
    <button class="skip-btn" onclick="skipVibecheck()">Skip</button>
  </div>

  <div class="progress">
    <div class="progress-bar" id="progress" style="width: 0%"></div>
  </div>

  <h4>Code Being Tested:</h4>
  <pre class="code-block"><code>${escapeHtml(this._data.code)}</code></pre>

  <div id="questions">
    ${questionsHtml}
  </div>

  <div id="completion" style="display: none;">
    <h2>Vibecheck Complete!</h2>
    <p id="completion-message"></p>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let answeredCount = 0;
    const totalQuestions = ${this._data.questions.length};

    function submitAnswer(questionId) {
      const question = document.querySelector(\`.question[data-id="\${questionId}"]\`);
      const input = question.querySelector('input:checked') || question.querySelector('textarea');

      if (!input || !input.value) {
        return;
      }

      vscode.postMessage({
        type: 'submit',
        data: { questionId, answer: input.value }
      });
    }

    function requestHint(questionId) {
      vscode.postMessage({
        type: 'hint',
        data: { questionId }
      });
    }

    function skipVibecheck() {
      const reason = prompt('Why are you skipping? (optional)') || 'No reason given';
      vscode.postMessage({
        type: 'skip',
        data: { reason }
      });
    }

    window.addEventListener('message', event => {
      const message = event.data;

      if (message.type === 'answerResult') {
        const feedback = document.getElementById(\`feedback-\${message.data.questionId}\`);
        feedback.className = 'feedback ' + (message.data.correct ? 'correct' : 'incorrect');
        feedback.textContent = message.data.correct ? 'Correct!' : 'Incorrect';

        answeredCount++;
        document.getElementById('progress').style.width =
          (answeredCount / totalQuestions * 100) + '%';
      }

      if (message.type === 'completed') {
        document.getElementById('questions').style.display = 'none';
        document.getElementById('completion').style.display = 'block';
        document.getElementById('completion-message').textContent =
          message.data.passed
            ? \`Great job! You scored \${Math.round(message.data.score * 100)}%\`
            : \`Keep practicing! You scored \${Math.round(message.data.score * 100)}%\`;
      }
    });
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    VibecheckPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Deliverables Phase 3:**
- [ ] LeanMCP server with @leanmcp/core decorators
- [ ] Anthropic integration with trigger-specific prompts
- [ ] VibecheckService @Tool (questions customised by indicator type)
- [ ] Input validation via @SchemaConstraint classes
- [ ] Webview panel for quizzes
- [ ] Answer validation and scoring (75% pass threshold)
- [ ] Deploy to ship.leanmcp.com for classroom scalability

---

## Phase 4: Teacher Dashboard

### 4.1 Next.js App Structure

```bash
npx create-next-app@latest dashboard --typescript --tailwind --app
cd dashboard
npm install convex @convex-dev/auth
npx convex dev
```

### 4.2 Key Dashboard Components

**File: dashboard/app/dashboard/page.tsx**
```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StatsCards } from '@/components/stats-cards';
import { ActivityFeed } from '@/components/activity-feed';
import { StudentLeaderboard } from '@/components/student-leaderboard';

export default function DashboardPage() {
  const classrooms = useQuery(api.classrooms.getByTeacher);
  const recentActivity = useQuery(api.activityLog.getRecent, {
    limit: 20,
  });
  const stats = useQuery(api.metrics.getClassStats);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <StatsCards
        activeStudents={stats?.activeStudents}
        totalVibechecks={stats?.totalVibechecks}
        avgScore={stats?.avgScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivity || []} />
        <StudentLeaderboard classroomId={classrooms?.[0]?._id} />
      </div>
    </div>
  );
}
```

**File: dashboard/components/activity-feed.tsx**
```typescript
'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Activity {
  _id: string;
  userId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  user?: { displayName: string };
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Live Activity Feed</h2>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          Pause
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.map(activity => (
          <ActivityItem key={activity._id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const statusColor = {
    'vibecheck:completed': activity.metadata.passed ? 'bg-green-100' : 'bg-red-100',
    'vibecheck:started': 'bg-blue-100',
    'vibecheck:skipped': 'bg-gray-100',
    'vibe:detected': 'bg-yellow-100',
  }[activity.eventType] || 'bg-gray-100';

  return (
    <div className={cn('p-3 rounded-lg', statusColor)}>
      <div className="flex justify-between">
        <span className="font-medium">@{activity.user?.displayName}</span>
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {formatActivityMessage(activity)}
      </p>
    </div>
  );
}

function formatActivityMessage(activity: Activity): string {
  switch (activity.eventType) {
    case 'vibecheck:completed':
      return `Completed vibecheck ${activity.metadata.passed ? '✓' : '✗'} ${activity.metadata.score}`;
    case 'vibecheck:started':
      return `Started vibecheck on ${activity.metadata.file}:${activity.metadata.line}`;
    case 'vibecheck:skipped':
      return `Skipped vibecheck: ${activity.metadata.reason}`;
    case 'vibe:detected':
      return `Vibe detected: score ${activity.metadata.score}`;
    default:
      return activity.eventType;
  }
}
```

### 4.3 Vercel Deployment Configuration

**Install Vercel CLI:**
```bash
npm i -g vercel
vercel login
```

**File: vercel.json**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npx convex deploy --cmd 'npm run build'",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

**Environment Variables (Vercel Dashboard):**

| Variable | Environment | Source |
|----------|-------------|--------|
| `CONVEX_DEPLOY_KEY` | Production | Convex Dashboard → Generate Production Deploy Key |
| `CONVEX_DEPLOY_KEY` | Preview | Convex Dashboard → Generate Preview Deploy Key |
| `AUTH_PRIVATE_KEY` | All | Generate via `npx @convex-dev/auth` |

**Deployment Commands:**
```bash
# Preview deployment (default)
vercel

# Production deployment
vercel --prod

# Pull environment variables for local dev
vercel env pull .env.local
```

**CI/CD Integration (GitHub Actions):**
```yaml
- name: Deploy to Vercel
  run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Deliverables Phase 4:**
- [ ] Next.js dashboard scaffolding
- [ ] Real-time activity feed
- [ ] Student leaderboard
- [ ] Individual student views
- [ ] Classroom management
- [ ] Analytics charts
- [ ] Vercel project configuration (vercel.json)
- [ ] Environment variables configured in Vercel Dashboard
- [ ] Production deployment to Vercel

---

## Phase 5: Polish and Demo

### 5.1 CodeRabbit Integration (Optional Enhancement)

```typescript
// extension/src/coderabbit-client.ts
import { getEventBus } from './event-bus';

export async function submitToCodeRabbit(code: string, uri: string): Promise<void> {
  // CodeRabbit MCP integration
  // Can add additional bug detection layer
  getEventBus().fire('coderabbit:submitted', { uri, timestamp: Date.now() });
}
```

### 5.2 Demo Preparation Checklist

- [ ] Record video demo (3-5 minutes)
- [ ] Prepare slide deck
- [ ] Set up live demo environment
- [ ] Test all sponsor integrations
- [ ] Prepare fallback screenshots

### 5.3 Extension Publishing

```bash
# Package extension
cd extension
npm run package

# Creates codswallop-0.1.0.vsix
```

**Final Deliverables:**
- [ ] Complete VSCode extension
- [ ] Working teacher dashboard
- [ ] Demo video
- [ ] Documentation
- [ ] Integration tests

---

## Dependency Graph

```
Phase 1 (Foundation)
    │
    ├── VSCode Extension Scaffold (TypeScript)
    │       │
    │       └── Event Bus (immediate triggers) ─────┐
    │                                                │
    └── Convex Schema (triggeredBy, indicatorValue) ┤
                                                    │
Phase 2 (Detection - Immediate Triggers)            │
    │                                               │
    ├── Complexity Analyser (TS) ───────────────────┤
    │       │                                       │
    │       └── Fires vibe:detected on >20          │
    │                                               │
    ├── Document Tracker ───────────────────────────┤
    │       │                                       │
    │       ├── Line spike detection (>50/min)      │
    │       └── Paste detection (>10 lines)         │
    │                                               │
    ├── Cursor Tracker (<5 unique positions) ───────┤
    │                                               │
    ├── Deduplication (60s cooldown) ───────────────┤
    │                                               │
    └── Mascot Gutter Icons (per indicator) ────────┤
                                                    │
Phase 3 (Vibechecks)                                │
    │                                               │
    ├── LeanMCP Server (@leanmcp/core) ─────────────┤
    │       │                                       │
    │       ├── @Tool, @SchemaConstraint decorators │
    │       ├── Anthropic (trigger-focused prompts) │
    │       └── Hosted on ship.leanmcp.com          │
    │                                               │
    └── Vibecheck Webview ──────────────────────────┤
                                                    │
Phase 4 (Dashboard)                                 │
    │                                               │
    └── Next.js Frontend ◄──────────────────────────┘
            │
            ├── Real-time Subscriptions (Convex)
            ├── Analytics by trigger type
            └── Convex Auth

Phase 5 (Polish)
    │
    ├── CodeRabbit Integration (Optional)
    ├── Documentation
    └── Demo

Note: Entire extension is TypeScript - no Python runtime dependency.
```
