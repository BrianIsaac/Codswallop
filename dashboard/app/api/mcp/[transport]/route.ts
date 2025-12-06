import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { verifyToken } from '@clerk/backend';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FOCUS_AREAS: Record<string, string[]> = {
  line_spike: [
    'control flow',
    'edge cases',
    'variable scope',
    'function purpose',
  ],
  high_complexity: [
    'branching logic',
    'loop conditions',
    'error paths',
    'state management',
  ],
  paste: ['overall logic', 'data flow', 'API contracts', 'integration points'],
};

// Custom token verifier that validates Clerk JWTs
async function verifyClerkToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) {
    return undefined;
  }

  try {
    const verified = await verifyToken(bearerToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return {
      token: bearerToken,
      clientId: verified.sub,
      scopes: ['vibecheck'],
      extra: { userId: verified.sub },
    };
  } catch {
    return undefined;
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'generateVibecheck',
      'Generate comprehension questions for code that may have been copy-pasted or AI-generated',
      {
        code: z.string().min(1).max(10000).describe('The code to analyse'),
        language: z
          .enum(['typescript', 'javascript', 'python'])
          .describe('Programming language'),
        triggeredBy: z
          .enum(['line_spike', 'high_complexity', 'paste'])
          .describe('What triggered the vibecheck'),
        difficulty: z
          .enum(['beginner', 'intermediate', 'advanced'])
          .default('intermediate'),
        questionCount: z.number().int().min(2).max(6).default(4),
        context: z
          .string()
          .max(500)
          .optional()
          .describe('Additional context'),
      },
      async (args, extra) => {
        // Authentication is handled by withMcpAuth wrapper
        // extra.authInfo contains the verified user info
        if (!extra.authInfo) {
          throw new Error('Authentication required. Please login first.');
        }

        const {
          code,
          language,
          triggeredBy,
          difficulty,
          questionCount,
          context,
        } = args;
        const focusAreas = FOCUS_AREAS[triggeredBy];

        const prompt = `You are an educational coding assistant helping students understand code they may have copied or written too quickly.

The code was flagged because of: ${triggeredBy.replace('_', ' ')}
Focus your questions on: ${focusAreas.join(', ')}
${context ? `Context: ${context}` : ''}

Analyse the following ${language} code and generate ${questionCount} multiple-choice comprehension questions at the ${difficulty} level.

Code:
\`\`\`${language}
${code}
\`\`\`

Generate questions that test whether the student truly understands:
1. What the code does
2. Why it's written this way
3. What would happen if certain parts were changed
4. Edge cases and potential issues

Respond with a JSON array of questions in this exact format:
[
  {
    "text": "What does this function return when...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "concept": "return values",
    "hint": "Look at the conditional on line 5"
  }
]

Each question must have:
- text: The question text
- options: Exactly 4 answer options
- correctAnswer: One of the options (must match exactly)
- concept: The programming concept being tested
- hint: A helpful hint (optional but recommended)

Respond only with the JSON array, no additional text.`;

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = response.content.find(
          (block) => block.type === 'text'
        );
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text response from Claude');
        }

        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Could not parse questions from response');
        }

        const questions = JSON.parse(jsonMatch[0]);
        const result = {
          questions: questions.map(
            (
              q: {
                text?: string;
                options?: unknown[];
                correctAnswer?: string;
                concept?: string;
                hint?: string;
              },
              i: number
            ) => ({
              id: `q_${Date.now()}_${i}`,
              text: String(q.text || ''),
              type: 'multiple_choice',
              options: Array.isArray(q.options) ? q.options.map(String) : [],
              correctAnswer: String(q.correctAnswer || ''),
              concept: String(q.concept || 'general'),
              hint: q.hint ? String(q.hint) : undefined,
            })
          ),
          focusAreas,
          estimatedDifficulty: difficulty,
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      }
    );
  },
  {
    serverInfo: {
      name: 'codswallop-mcp',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api/mcp',
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === 'development',
  }
);

// Wrap the handler with authentication
const authHandler = withMcpAuth(handler, verifyClerkToken, {
  required: true,
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
