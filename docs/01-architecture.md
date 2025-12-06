# Codswallop Architecture Document

## Executive Summary

Codswallop is an edtech-focused "vibecode checker" that detects when users are blindly accepting AI-generated code without understanding it. The system creates personalised "vibechecks" (comprehension tests) and provides analytics for both solo coders and classroom environments.

## System Overview

```
+-----------------------------------------------------------------------------------+
|                              CODSWALLOP ECOSYSTEM                                  |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +------------------+     +------------------+     +------------------+            |
|  |   VSCode Ext     |     |   Convex DB      |     |  Vercel Frontend |            |
|  |   (TypeScript)   |<--->|   (Real-time)    |<--->|  (Teacher Dash)  |            |
|  +------------------+     +------------------+     +------------------+            |
|          |                        ^                        ^                       |
|          |                        |                        |                       |
|          +------------------------+------------------------+                       |
|          |                                                                         |
|          v                                                                         |
|  +------------------+     +------------------+     +------------------+            |
|  |   Anthropic      |     |   CodeRabbit     |     |    MCP Server    |            |
|  |   (LLM)          |     |   (Code Review)  |     |   (TypeScript)   |            |
|  +------------------+     +------------------+     +------------------+            |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

**Note:** The entire extension is pure TypeScript - no Python runtime dependency required.

## Core Detection Mechanisms

### 1. Vibe Coding Detection (Immediate Trigger System)

```
+------------------------------------------------------------------+
|                    VIBE CODING INDICATORS                         |
+------------------------------------------------------------------+
|                                                                   |
|  Indicator              | Threshold      | Detection    | Icon    |
|  -----------------------|----------------|--------------|---------|
|  Line count spike       | >50 lines/min  | Document Δ   | Rushing |
|  Cyclomatic complexity  | >20            | AST analysis | Confused|
|  Paste detection        | >10 lines      | Event hook   | Clipboard|
|                                                                   |
|  IMMEDIATE TRIGGER: Any single indicator exceeding its threshold  |
|  immediately triggers an LLM vibecheck - no weighted scoring.     |
|                                                                   |
|  Deduplication: 60-second cooldown per uri:line location to       |
|  prevent repeated triggers on the same code.                      |
|                                                                   |
+------------------------------------------------------------------+
```

Each indicator type displays a unique mascot gutter icon when triggered.

### 2. Cyclomatic Complexity Calculation

Based on research, we use the following formula:

```
CC = E - N + 2P

Where:
  E = Number of edges in control flow graph
  N = Number of nodes
  P = Number of connected components (usually 1)

Simplified for AST:
  CC = 1 + (if statements) + (loops) + (case statements) + (catch blocks)
       + (logical AND/OR) + (ternary operators)
```

**Thresholds:**
- 1-10: Simple, low risk
- 11-20: Moderate complexity, refactoring candidate
- 21-50: High complexity, likely AI-generated or copy-pasted
- 50+: Very high risk, strong vibecheck candidate

## Architecture Components

### Layer 1: VSCode Extension (TypeScript)

```
src/extension/
├── extension.ts           # Entry point, activation, command registration
├── vibe-detector.ts       # Core detection logic orchestrator
├── complexity-analyser.ts # Real-time cyclomatic complexity
├── document-tracker.ts    # Line count changes, paste detection
├── codelens-provider.ts   # Clickable vibecheck triggers
├── decoration-manager.ts  # Gutter icons and highlights
├── event-bus.ts           # Type-safe pub/sub messaging
├── convex-client.ts       # Real-time database sync
├── activity-tracker.ts    # User engagement monitoring
├── vibecheck-panel.ts     # Quiz webview panel
├── vibe-panel-provider.ts # Animated agent webview management
├── vibe-svg-character.ts  # SVG generation for Vibe character
├── vibe-state-machine.ts  # Character state transitions
└── vibe-movement.ts       # Character pointing and positioning
```

See `05-animated-agent.md` for full animated agent implementation details.

**Key Insight from living-ide:** Use CodeLens API for clickable elements (gutter icons are NOT clickable in VSCode API).

```typescript
// CodeLens Provider Pattern
class VibecheckCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    for (const detection of this.detections) {
      const range = new vscode.Range(detection.line, 0, detection.line, 0);
      const label = this.getIndicatorLabel(detection.triggeredBy);
      const lens = new vscode.CodeLens(range, {
        title: `${label}: ${detection.indicatorValue} [Take Quiz]`,
        command: 'codswallop.startVibecheck',
        arguments: [detection]
      });
      lenses.push(lens);
    }

    return lenses;
  }

  private getIndicatorLabel(type: string): string {
    const labels: Record<string, string> = {
      'line_spike': 'Line Spike',
      'high_complexity': 'High Complexity',
      'paste': 'Paste Detected'
    };
    return labels[type] || 'Vibecheck';
  }
}
```

### Layer 2: TypeScript MCP Server (LeanMCP)

The MCP server uses **LeanMCP**, a decorator-based TypeScript framework built on `@modelcontextprotocol/sdk`:

```
extension/src/mcp/
├── main.ts                    # HTTP server entry point
├── services/
│   ├── vibecheck-service.ts   # LLM-powered test generation
│   └── analysis-service.ts    # Code quality analysis
└── schemas/
    ├── vibecheck-input.ts     # Input validation schemas
    └── vibecheck-output.ts    # Output type definitions
```

**LeanMCP Decorator Pattern:**

```typescript
import { Tool, SchemaConstraint, Optional } from "@leanmcp/core";
import Anthropic from '@anthropic-ai/sdk';

// Input schema with validation
class GenerateVibecheckInput {
  @SchemaConstraint({ description: 'Code snippet to analyse', minLength: 1 })
  code!: string;

  @SchemaConstraint({ description: 'Programming language', enum: ['typescript', 'javascript', 'python'] })
  language!: string;

  @SchemaConstraint({
    description: 'Which indicator triggered this vibecheck',
    enum: ['line_spike', 'high_complexity', 'paste']
  })
  triggeredBy!: 'line_spike' | 'high_complexity' | 'paste';

  @Optional()
  @SchemaConstraint({ description: 'Additional context about the code', maxLength: 500 })
  context?: string;
}

// Output schema
class VibecheckOutput {
  @SchemaConstraint({ description: 'Array of comprehension questions' })
  questions!: Array<{
    id: string;
    text: string;
    type: 'multiple_choice' | 'free_text';
    options?: string[];
    correctAnswer: string;
  }>;

  @SchemaConstraint({ description: 'Focus areas based on trigger type' })
  focusAreas!: string[];
}

export class VibecheckService {
  private anthropic = new Anthropic();

  @Tool({
    description: 'Generate comprehension questions for a code snippet',
    inputClass: GenerateVibecheckInput
  })
  async generateVibecheck(args: GenerateVibecheckInput): Promise<VibecheckOutput> {
    const focusAreas: Record<string, string> = {
      line_spike: 'control flow, edge cases, variable scope',
      high_complexity: 'branching logic, loop conditions, error paths',
      paste: 'overall logic, data flow, API contracts'
    };

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate 3-5 comprehension questions for this ${args.language} code.
Focus on: ${focusAreas[args.triggeredBy]}

Code:
\`\`\`${args.language}
${args.code}
\`\`\`

Return JSON with questions array containing id, text, type, options (if multiple_choice), and correctAnswer.`
      }]
    });

    return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}');
  }
}
```

**Hosting Strategy:**

| Option | Transport | Use Case |
|--------|-----------|----------|
| **Localhost** | HTTP (localhost:3000) | Development, testing |
| **ship.leanmcp.com** | Streamable HTTP | Production, multi-user, managed |

Codswallop uses **ship.leanmcp.com** for production hosting - this enables classroom scalability with multiple concurrent students and teacher dashboard integrations via a single managed MCP endpoint.

### Layer 3: Convex Database

```
convex/
├── schema.ts             # Type-safe schema definitions
├── users.ts              # User management functions
├── vibechecks.ts         # Vibecheck CRUD operations
├── metrics.ts            # Analytics and tracking
├── classrooms.ts         # Teacher-student relationships
└── _generated/           # Auto-generated types
```

**Schema Design:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

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
    })),
    answers: v.optional(v.array(v.object({
      questionId: v.string(),
      answer: v.string(),
      correct: v.boolean(),
      timestamp: v.number(),
    }))),
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
    .index("by_status", ["status"])
    .index("by_trigger", ["triggeredBy"]),

  metrics: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    totalLines: v.number(),
    vibeCodedLines: v.number(),
    vibechecksCompleted: v.number(),
    vibechecksPassed: v.number(),
    averageComplexity: v.number(),
    averageVibeScore: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  classrooms: defineTable({
    teacherId: v.id("users"),
    name: v.string(),
    code: v.string(), // Join code
    studentIds: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_code", ["code"]),
});
```

### Layer 4: Vercel Frontend (Teacher Dashboard)

```
app/
├── page.tsx              # Landing page
├── dashboard/
│   ├── page.tsx          # Teacher overview
│   ├── classroom/
│   │   ├── [id]/
│   │   │   ├── page.tsx  # Classroom detail
│   │   │   └── students/
│   │   │       └── [studentId]/
│   │   │           └── page.tsx  # Student detail
│   └── analytics/
│       └── page.tsx      # Aggregate analytics
├── student/
│   └── page.tsx          # Student self-view
└── api/
    └── webhooks/
        └── convex/
            └── route.ts  # Convex webhook handler
```

## Animated Agent: "Vibe"

Codswallop features an animated mascot called **Vibe** - a detective-themed cosmic blob that guides students through vibechecks. See `05-animated-agent.md` for full implementation details.

### Character States

```typescript
type VibeState = 'idle' | 'watching' | 'detecting' | 'questioning'
               | 'celebrating' | 'concerned' | 'sleeping' | 'pointing';
```

| State | Description | Interruptible |
|-------|-------------|---------------|
| idle | Default floating state | Yes |
| watching | Monitoring code changes | Yes |
| detecting | Analysing suspicious code (magnifying glass) | No |
| questioning | During vibecheck quiz | No |
| celebrating | Student passed (confetti, star eyes) | No |
| concerned | Student failed/skipped (encouraging) | Yes |
| sleeping | Inactive 30+ seconds (Zzz) | Yes |
| pointing | Pointing at code/terminal/files | No |

### Pointing Directions

- **Left** - Points at file explorer
- **Right** - Points at editor code (most common)
- **Down** - Points at terminal (extended arm animation)

## Data Flow

```
+------------------------------------------------------------------------+
|                    DATA FLOW (IMMEDIATE TRIGGER SYSTEM)                 |
+------------------------------------------------------------------------+
|                                                                         |
|  [User Types Code]                                                      |
|         |                                                               |
|         +--------------------+--------------------+                     |
|         |                    |                    |                     |
|         v                    v                    v                     |
|  +-------------+      +-------------+      +-------------+              |
|  | Document    |      | Complexity  |      | Cursor      |              |
|  | Tracker     |      | Analyser    |      | Tracker     |              |
|  +------+------+      +------+------+      +------+------+              |
|         |                    |                    |                     |
|         v                    v                    v                     |
|  Line spike >50?      Complexity >20?     Positions <5?                 |
|  Paste >10 lines?                                                       |
|         |                    |                    |                     |
|         +--------------------+--------------------+                     |
|                              |                                          |
|                     ANY threshold exceeded?                             |
|                              |                                          |
|                       YES (immediate)                                   |
|                              |                                          |
|         +--------------------+--------------------+                     |
|         |                                        |                      |
|         v                                        v                      |
|  +----------------+                       +----------------+            |
|  | Show CodeLens  |                       | Show Gutter    |            |
|  | "High Complexity: 45"                  | Mascot Icon    |            |
|  +----------------+                       +----------------+            |
|         |                                                               |
|         v                                                               |
|  +----------------+     +----------------+     +----------------+       |
|  | User Clicks    |---->| TS MCP Server  |---->| Anthropic LLM  |       |
|  | "Take Quiz"    |     | (triggeredBy)  |     | (Focused Q's)  |       |
|  +----------------+     +----------------+     +----------------+       |
|                                                      |                  |
|                                                      v                  |
|                         +----------------+     +----------------+       |
|                         | Display Quiz   |<----| Questions      |       |
|                         | in Webview     |     | (by indicator) |       |
|                         +----------------+     +----------------+       |
|                                |                                        |
|                                v                                        |
|                         +----------------+     +----------------+       |
|                         | User Answers   |---->| Convex DB      |       |
|                         | Questions      |     | (Real-time)    |       |
|                         +----------------+     +----------------+       |
|                                                      |                  |
|                                                      v                  |
|                                               +----------------+        |
|                                               | Teacher Dash   |        |
|                                               | (Live Updates) |        |
|                                               +----------------+        |
|                                                                         |
+------------------------------------------------------------------------+
```

## Event Bus Architecture

Adapted from living-ide pattern:

```typescript
// Type-safe event definitions
type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

interface EventMap {
  // Document events
  'document:changed': { uri: string; linesDelta: number; timestamp: number };
  'document:pasted': { uri: string; content: string; lineCount: number };

  // Immediate trigger detection
  'vibe:detected': {
    uri: string;
    line: number;
    triggeredBy: IndicatorType;
    indicatorValue: number;
    threshold: number;
    codeSnippet: string;
  };
  'vibe:cleared': { uri: string; line: number };

  // Vibecheck events
  'vibecheck:started': { id: string; uri: string; line: number; triggeredBy: IndicatorType };
  'vibecheck:completed': { id: string; passed: boolean; score: number };
  'vibecheck:skipped': { id: string; reason: string };

  // Sync events
  'convex:connected': { userId: string };
  'convex:synced': { table: string; count: number };

  // Complexity analysis
  'complexity:analysed': { uri: string; functions: FunctionComplexity[] };
}

class TypedEventBus {
  private emitter = new vscode.EventEmitter<{ type: string; data: unknown }>();

  fire<K extends keyof EventMap>(type: K, data: EventMap[K]): void {
    this.emitter.fire({ type, data });
  }

  on<K extends keyof EventMap>(
    type: K,
    handler: (data: EventMap[K]) => void
  ): vscode.Disposable {
    return this.emitter.event(({ type: t, data }) => {
      if (t === type) handler(data as EventMap[K]);
    });
  }
}
```

## Security Considerations

1. **API Key Storage**: Use VSCode's `SecretStorage` API for Anthropic keys
2. **Data Privacy**: Student data stored in Convex with proper access controls
3. **Code Transmission**: Only send code snippets, never full files
4. **Rate Limiting**: Debounce LSP requests (300-500ms minimum)

## Performance Optimisations

1. **Debounced Analysis**: 500ms delay after typing stops
2. **Incremental Parsing**: Only re-analyse changed regions
3. **Caching**: Cache complexity scores for unchanged functions
4. **Lazy Loading**: Load CodeLens providers on demand

## Integration Points

| Sponsor    | Integration Method            | Purpose                    |
|------------|-------------------------------|----------------------------|
| Convex     | SDK + Real-time subscriptions | Database, live updates     |
| Convex Auth| Built-in Convex authentication| User authentication        |
| Anthropic  | @anthropic-ai/sdk             | Vibecheck generation       |
| CodeRabbit | MCP Server (optional)         | Additional code analysis   |
| LeanMCP    | @leanmcp/core                 | MCP server framework (TS)  |
| Vercel     | Next.js App Router            | Teacher dashboard hosting  |

## Next Steps

1. Review UI/UX wireframes (02-uiux-wireframes.md)
2. Follow implementation roadmap (03-implementation-roadmap.md)
3. Configure sponsor integrations (04-sponsor-integration.md)
