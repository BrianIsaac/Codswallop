# Codswallop Sponsor Integration Guide

This guide details how each hackathon sponsor technology integrates into Codswallop.

## Sponsor Overview

```
+------------------------------------------------------------------------+
|                    SPONSOR INTEGRATION MAP                              |
+------------------------------------------------------------------------+
|                                                                         |
|  +-------------+     +-------------+     +-------------+                |
|  |   CONVEX    |     |  ANTHROPIC  |     |   VERCEL    |                |
|  |   Database  |     |     LLM     |     |   Hosting   |                |
|  +------+------+     +------+------+     +------+------+                |
|         |                   |                   |                       |
|         v                   v                   v                       |
|  +------+------+     +------+------+     +------+------+                |
|  | Real-time   |     | Vibecheck   |     | Teacher     |                |
|  | Sync        |     | Generation  |     | Dashboard   |                |
|  +-------------+     +-------------+     +-------------+                |
|                                                                         |
|  +-------------+     +-------------+                                    |
|  |  MCP (TS)   |     | CODERABBIT  |                                    |
|  |  Protocol   |     | Code Review |                                    |
|  +------+------+     +------+------+                                    |
|         |                   |                                           |
|         v                   v                                           |
|  +------+------+     +------+------+                                    |
|  | Tool        |     | Additional  |                                    |
|  | Orchestr.   |     | Analysis    |                                    |
|  +-------------+     +-------------+                                    |
|                                                                         |
+------------------------------------------------------------------------+

Note: Entire extension is TypeScript - MCP server uses LeanMCP (@leanmcp/core)
```

---

## 1. Convex (Database & Real-time)

### Why Convex?

- **Real-time subscriptions**: Dashboard updates instantly when students complete vibechecks
- **TypeScript-first**: Type-safe database queries
- **ACID transactions**: Reliable data consistency
- **Built-in auth**: Convex Auth provides integrated authentication

### Integration Points

```
+------------------------------------------------------------------------+
|                       CONVEX DATA FLOW                                  |
+------------------------------------------------------------------------+
|                                                                         |
|  VSCode Extension                      Next.js Dashboard                |
|  +------------------+                  +------------------+             |
|  | convex-client.ts |                  | useQuery hooks   |             |
|  +--------+---------+                  +--------+---------+             |
|           |                                     |                       |
|           |  mutations                          |  subscriptions        |
|           v                                     v                       |
|  +--------+------------------------------------+---------+              |
|  |                    CONVEX                             |              |
|  |  +------------+  +------------+  +------------+       |              |
|  |  |   users    |  | vibechecks |  |  metrics   |       |              |
|  |  +------------+  +------------+  +------------+       |              |
|  |  +------------+  +------------+                       |              |
|  |  | classrooms |  | activity   |                       |              |
|  |  +------------+  +------------+                       |              |
|  +-------------------------------------------------------+              |
|                                                                         |
+------------------------------------------------------------------------+
```

### Setup Instructions

```bash
# 1. Install Convex CLI
npm install -g convex

# 2. Initialise in project
cd codswallop
npx convex init

# 3. Create schema (convex/schema.ts)
# See implementation roadmap for full schema

# 4. Deploy
npx convex deploy
```

### Key Convex Functions

**File: convex/vibechecks.ts**
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vibechecks", {
      ...args,
      answers: [],
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const submitAnswer = mutation({
  args: {
    vibecheckId: v.id("vibechecks"),
    questionId: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const vibecheck = await ctx.db.get(args.vibecheckId);
    if (!vibecheck) throw new Error("Vibecheck not found");

    const question = vibecheck.questions.find(q => q.id === args.questionId);
    if (!question) throw new Error("Question not found");

    const correct = question.correctAnswer === args.answer;

    await ctx.db.patch(args.vibecheckId, {
      answers: [
        ...vibecheck.answers,
        {
          questionId: args.questionId,
          answer: args.answer,
          correct,
          timestamp: Date.now(),
        },
      ],
      status: "in_progress",
    });

    return { correct };
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vibechecks")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const getPendingByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vibechecks")
      .withIndex("by_user_status", q =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();
  },
});
```

**File: convex/metrics.ts**
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordDaily = mutation({
  args: {
    userId: v.id("users"),
    totalLines: v.number(),
    vibeCodedLines: v.number(),
    complexity: v.number(),
    vibeScore: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_user_date", q =>
        q.eq("userId", args.userId).eq("date", date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalLines: existing.totalLines + args.totalLines,
        vibeCodedLines: existing.vibeCodedLines + args.vibeCodedLines,
        averageComplexity:
          (existing.averageComplexity + args.complexity) / 2,
        averageVibeScore:
          (existing.averageVibeScore + args.vibeScore) / 2,
      });
    } else {
      await ctx.db.insert("metrics", {
        userId: args.userId,
        date,
        totalLines: args.totalLines,
        vibeCodedLines: args.vibeCodedLines,
        vibechecksCompleted: 0,
        vibechecksPassed: 0,
        averageComplexity: args.complexity,
        averageVibeScore: args.vibeScore,
        conceptScores: {},
      });
    }
  },
});

export const getClassStats = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) return null;

    const today = new Date().toISOString().split("T")[0];
    let totalVibechecks = 0;
    let totalPassed = 0;
    let totalScore = 0;
    let activeCount = 0;

    for (const studentId of classroom.studentIds) {
      const metrics = await ctx.db
        .query("metrics")
        .withIndex("by_user_date", q =>
          q.eq("userId", studentId).eq("date", today)
        )
        .first();

      if (metrics) {
        activeCount++;
        totalVibechecks += metrics.vibechecksCompleted;
        totalPassed += metrics.vibechecksPassed;
        totalScore += metrics.averageVibeScore;
      }
    }

    return {
      activeStudents: activeCount,
      totalStudents: classroom.studentIds.length,
      totalVibechecks,
      passRate: totalVibechecks > 0 ? totalPassed / totalVibechecks : 0,
      avgScore: activeCount > 0 ? totalScore / activeCount : 0,
    };
  },
});
```

### VSCode Extension Integration

**File: extension/src/convex-client.ts**
```typescript
import { ConvexHttpClient } from "convex/browser";
import * as vscode from "vscode";
import { getEventBus } from "./event-bus";

let client: ConvexHttpClient | null = null;
let userId: string | null = null;

export async function initConvexClient(
  context: vscode.ExtensionContext
): Promise<void> {
  const deploymentUrl = vscode.workspace
    .getConfiguration("codswallop")
    .get<string>("convexUrl");

  if (!deploymentUrl) {
    vscode.window.showWarningMessage(
      "Codswallop: Convex URL not configured. Metrics will not be synced."
    );
    return;
  }

  client = new ConvexHttpClient(deploymentUrl);

  // Get or create user
  const storedUserId = context.globalState.get<string>("codswallop.userId");
  if (storedUserId) {
    userId = storedUserId;
  } else {
    // Create anonymous user for solo coders
    const result = await client.mutation("users:createAnonymous", {
      deviceId: vscode.env.machineId,
    });
    userId = result;
    await context.globalState.update("codswallop.userId", userId);
  }

  // Wire up event bus to Convex
  setupEventHandlers();
}

function setupEventHandlers(): void {
  const eventBus = getEventBus();

  // Sync vibecheck completions
  eventBus.on("vibecheck:completed", async data => {
    if (!client || !userId) return;

    await client.mutation("vibechecks:complete", {
      vibecheckId: data.id,
      passed: data.passed,
      score: data.score,
    });

    await client.mutation("activityLog:record", {
      userId,
      eventType: "vibecheck:completed",
      metadata: data,
    });
  });

  // Sync vibe detections (immediate triggers)
  eventBus.on("vibe:detected", async data => {
    if (!client || !userId) return;

    await client.mutation("activityLog:record", {
      userId,
      eventType: "vibe:detected",
      metadata: {
        uri: data.uri,
        line: data.line,
        triggeredBy: data.triggeredBy,
        indicatorValue: data.indicatorValue,
        threshold: data.threshold,
      },
    });
  });
}

export async function createVibecheck(data: {
  code: string;
  language: string;
  line: number;
  uri: string;
  triggeredBy: 'line_spike' | 'high_complexity' | 'paste';
  indicatorValue: number;
  indicatorThreshold: number;
  complexity?: number;
  questions: unknown[];
}): Promise<string | null> {
  if (!client || !userId) return null;

  return await client.mutation("vibechecks:create", {
    userId,
    fileUri: data.uri,
    line: data.line,
    code: data.code,
    language: data.language,
    triggeredBy: data.triggeredBy,
    indicatorValue: data.indicatorValue,
    indicatorThreshold: data.indicatorThreshold,
    complexity: data.complexity,
    questions: data.questions,
  });
}

export function getConvexClient(): ConvexHttpClient | null {
  return client;
}
```

---

## 2. Anthropic (LLM)

### Why Anthropic?

- **High-quality generation**: Claude produces nuanced, educational questions
- **Fast responses**: Low latency for interactive vibecheck generation
- **Safety**: Built-in content filtering for educational context

### Integration via MCP

```
+------------------------------------------------------------------------+
|                    ANTHROPIC INTEGRATION FLOW                           |
+------------------------------------------------------------------------+
|                                                                         |
|  VSCode Extension          MCP Server             Anthropic API         |
|  +---------------+        +---------------+       +---------------+     |
|  | Detect vibe   |------->| Tool call:    |------>| claude-sonnet |     |
|  | code segment  |        | generate_     |       | -4-20250514   |     |
|  +---------------+        | vibecheck     |       +---------------+     |
|         ^                 +---------------+              |              |
|         |                        |                       |              |
|         |                        v                       v              |
|         |                 +---------------+       +---------------+     |
|         |<----------------| Questions +   |<------| JSON response |     |
|         |                 | metadata      |       |               |     |
|  +------+--------+        +---------------+       +---------------+     |
|  | Show webview  |                                                      |
|  | quiz panel    |                                                      |
|  +---------------+                                                      |
|                                                                         |
+------------------------------------------------------------------------+
```

### Setup Instructions

```bash
# 1. Get API key from console.anthropic.com
# 2. Set environment variable
export ANTHROPIC_API_KEY=sk-ant-...

# 3. In LeanMCP server
npm install @anthropic-ai/sdk @leanmcp/core
```

### Key Prompts

**Vibecheck Generation Prompt:**
```
You are an educational coding assistant. A student has written code that may
have been copied without full understanding.

Generate a comprehension quiz to verify their understanding. The questions should:
1. Test understanding of the code's logic, not just syntax
2. Include questions about edge cases and error handling
3. Be appropriate for the {difficulty} level
4. Focus on concepts the code demonstrates

Concepts to tag: error_handling, async_await, api_design, type_safety,
data_structures, algorithms, security, testing, performance
```

**Hint Generation Prompt:**
```
The student is struggling with this question about the following code:

Code: {code}
Question: {question}
Their incorrect answer: {answer}

Provide a helpful hint that guides them toward the correct answer without
giving it away directly. Focus on the underlying concept.
```

### Rate Limiting Strategy

```typescript
// extension/src/anthropic-limiter.ts
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests = 50;
  private readonly windowMs = 60000; // 1 minute

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(t => now - t < this.windowMs);

    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestTimes.push(Date.now());
  }
}
```

---

## 3. Vercel (Frontend Hosting)

### Why Vercel?

- **Next.js optimisation**: First-class support for our dashboard
- **Edge functions**: Low-latency API routes
- **Easy deployment**: Git push to deploy
- **Analytics**: Built-in performance monitoring

### Deployment Configuration

**File: dashboard/vercel.json**
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "CONVEX_URL": "@convex_url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" }
      ]
    }
  ]
}
```

### Deployment Steps

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link project
cd dashboard
vercel link

# 3. Add environment variables
vercel env add CONVEX_URL production

# 4. Deploy
vercel --prod
```

### Edge Function Example

**File: dashboard/app/api/webhook/vibecheck/route.ts**
```typescript
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate webhook signature
  const signature = request.headers.get("x-codswallop-signature");
  if (!validateSignature(signature, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process vibecheck event
  switch (body.type) {
    case "vibecheck:completed":
      // Could trigger notifications, update leaderboards, etc.
      break;
    case "vibe:detected":
      // Could alert teachers in real-time
      break;
  }

  return NextResponse.json({ received: true });
}

function validateSignature(signature: string | null, body: unknown): boolean {
  // Implement HMAC validation
  return true; // Placeholder
}
```

---

## 4. LeanMCP Protocol (TypeScript)

### Why LeanMCP?

- **Decorator-based**: Clean `@Tool`, `@SchemaConstraint` API
- **TypeScript-first**: Full type safety with compile-time validation
- **Built on MCP SDK**: Uses `@modelcontextprotocol/sdk` under the hood
- **Hosting options**: Embedded stdio, localhost HTTP, or ship.leanmcp.com

### LeanMCP Server Architecture

```
+------------------------------------------------------------------------+
|                    LEANMCP SERVICE REGISTRY                             |
+------------------------------------------------------------------------+
|                                                                         |
|  +-------------------+  +-------------------+  +-------------------+    |
|  | VibecheckService  |  | AnalysisService   |  | MetricsService   |    |
|  | @Tool decorator   |  | @Tool decorator   |  | @Tool decorator  |    |
|  +-------------------+  +-------------------+  +-------------------+    |
|  | generateVibecheck |  | analyseQuality    |  | submitMetrics    |    |
|  | Uses: Anthropic   |  | Uses: Anthropic   |  | Uses: Convex     |    |
|  | Input: validated  |  | Input: validated  |  | Input: validated |    |
|  |  @SchemaConstraint|  |  @SchemaConstraint|  |  @SchemaConstraint    |
|  +-------------------+  +-------------------+  +-------------------+    |
|                                                                         |
+------------------------------------------------------------------------+
```

### Service Implementation

**File: extension/src/mcp/services/vibecheck-service.ts**
```typescript
/**
 * LeanMCP Vibecheck Service for Codswallop
 * Uses decorator-based tool registration
 */

import { Tool, SchemaConstraint, Optional } from "@leanmcp/core";
import Anthropic from '@anthropic-ai/sdk';

type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

// Input schema with validation via decorators
class GenerateVibecheckInput {
  @SchemaConstraint({ description: 'Code snippet to quiz on', minLength: 1 })
  code!: string;

  @SchemaConstraint({ description: 'Programming language' })
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
  @SchemaConstraint({ description: 'Number of questions', minimum: 1, maximum: 6, default: 4 })
  numQuestions?: number;
}

export class VibecheckService {
  private anthropic = new Anthropic();

  @Tool({
    description: 'Generate comprehension quiz questions for code',
    inputClass: GenerateVibecheckInput
  })
  async generateVibecheck(args: GenerateVibecheckInput) {
    const focusAreas: Record<IndicatorType, string> = {
      line_spike: 'control flow, edge cases, variable scope',
      high_complexity: 'branching logic, loop conditions, error paths',
      paste: 'overall logic, data flow, API contracts',
    };

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate ${args.numQuestions || 4} comprehension questions for this ${args.language} code.
Focus on: ${focusAreas[args.triggeredBy]}

\`\`\`${args.language}
${args.code}
\`\`\`

Return JSON with questions array.`
      }]
    });

    // Parse and return questions
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return { questions: json.questions || [], language: args.language, triggeredBy: args.triggeredBy };
  }
}
```

### Server Entry Point

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

// Hosting options:
// - Local dev: HTTP localhost:3000
// - Embedded: stdio (spawned by extension)
// - Production: ship.leanmcp.com (managed Streamable HTTP)
await createHTTPServer(() => server.getServer(), {
  port: parseInt(process.env.PORT || "3000"),
  cors: true,
});
```

### Hosting Strategy

| Environment | Transport | Use Case |
|-------------|-----------|----------|
| **Localhost HTTP** | HTTP :3000 | Development, testing |
| **ship.leanmcp.com** | Streamable HTTP | Production, classroom scalability |

Codswallop uses **ship.leanmcp.com** for production hosting:
- Multiple concurrent students per classroom
- Teacher dashboard integration via single endpoint
- Managed infrastructure (no server ops)
- Session management handled by LeanMCP platform

---

## 5. CodeRabbit (Code Review)

### Why CodeRabbit?

- **AI-powered review**: Additional layer of code analysis
- **MCP integration**: Can be accessed via MCP protocol
- **Free for OSS**: Good for hackathon projects

### Integration Strategy

CodeRabbit can provide additional signals for vibe detection:

```
+------------------------------------------------------------------------+
|                    CODERABBIT INTEGRATION                               |
+------------------------------------------------------------------------+
|                                                                         |
|  Detected Code Block                                                    |
|  +-------------------+                                                  |
|  | High complexity   |                                                  |
|  | Large paste       |                                                  |
|  +--------+----------+                                                  |
|           |                                                             |
|           v                                                             |
|  +--------+----------+     +-------------------+                        |
|  | CodeRabbit MCP    |---->| Issues Found:     |                        |
|  | analyse_code      |     | - Unused vars     |                        |
|  +-------------------+     | - Missing types   |                        |
|                            | - Security issue  |                        |
|                            +--------+----------+                        |
|                                     |                                   |
|                                     v                                   |
|                            +--------+----------+                        |
|                            | Boost vibe score  |                        |
|                            | if issues found   |                        |
|                            +-------------------+                        |
|                                                                         |
+------------------------------------------------------------------------+
```

### MCP Client for CodeRabbit

**File: extension/src/coderabbit-client.ts**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getEventBus } from "./event-bus";

let codeRabbitClient: Client | null = null;

export async function initCodeRabbitClient(): Promise<void> {
  // CodeRabbit MCP server (if available)
  const transport = new StdioClientTransport({
    command: "coderabbit-mcp",
    args: [],
  });

  codeRabbitClient = new Client(
    { name: "codswallop-coderabbit", version: "1.0.0" },
    {}
  );

  try {
    await codeRabbitClient.connect(transport);
  } catch (error) {
    console.warn("CodeRabbit MCP not available:", error);
    codeRabbitClient = null;
  }
}

export async function analyseWithCodeRabbit(
  code: string,
  language: string
): Promise<CodeRabbitResult | null> {
  if (!codeRabbitClient) return null;

  try {
    const result = await codeRabbitClient.callTool("analyse_code", {
      code,
      language,
    });

    return result.content[0].text as unknown as CodeRabbitResult;
  } catch (error) {
    console.error("CodeRabbit analysis failed:", error);
    return null;
  }
}

interface CodeRabbitResult {
  issues: Array<{
    type: string;
    message: string;
    line: number;
    severity: "info" | "warning" | "error";
  }>;
  suggestions: string[];
  quality_score: number;
}

/**
 * Integrate CodeRabbit results into vibe score calculation
 */
export function adjustVibeScore(
  baseScore: number,
  codeRabbitResult: CodeRabbitResult | null
): number {
  if (!codeRabbitResult) return baseScore;

  // More issues = higher vibe score (more likely copied without understanding)
  const issueCount = codeRabbitResult.issues.length;
  const errorCount = codeRabbitResult.issues.filter(
    i => i.severity === "error"
  ).length;

  // Boost score based on issues
  const issueBoost = Math.min(0.2, issueCount * 0.02);
  const errorBoost = Math.min(0.1, errorCount * 0.05);

  return Math.min(1.0, baseScore + issueBoost + errorBoost);
}
```

---

## Integration Checklist

### Pre-Hackathon Setup

- [ ] Create Convex account and project
- [ ] Get Anthropic API key
- [ ] Set up Vercel project
- [ ] Test MCP server locally
- [ ] (Optional) Set up CodeRabbit

### Environment Variables

```bash
# Extension (.env)
CONVEX_URL=https://xxx.convex.cloud
ANTHROPIC_API_KEY=sk-ant-xxx

# Dashboard (.env.local)
CONVEX_URL=https://xxx.convex.cloud
# Auth is handled by Convex Auth (integrated into Convex)
```

### Demo Talking Points

| Sponsor    | Talking Point                                                    |
|------------|------------------------------------------------------------------|
| Convex     | "Real-time dashboard updates as students code"                   |
| Anthropic  | "AI-generated questions tailored to each trigger type"           |
| Vercel     | "Instant deployment, edge-optimised teacher dashboard"           |
| LeanMCP    | "Decorator-based MCP server with @leanmcp/core"                   |
| CodeRabbit | "Additional code analysis layer (optional)"                      |

### Fallback Strategies

| Integration | Fallback if unavailable                    |
|-------------|-------------------------------------------|
| Convex      | Local SQLite storage                      |
| Anthropic   | Pre-generated question templates          |
| Vercel      | Static HTML dashboard                     |
| CodeRabbit  | Skip additional analysis (already optional)|
| LeanMCP     | Direct function calls (already TypeScript)|
