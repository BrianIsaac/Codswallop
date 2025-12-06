/**
 * Vibecheck generation service using Anthropic Claude.
 *
 * Generates comprehension quiz questions based on code snippets,
 * with focus areas determined by the trigger type.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VibecheckInput,
  TriggerType,
  validateVibecheckInput,
} from '../schemas/vibecheck-input';
import {
  VibecheckOutput,
  VibecheckQuestion,
  generateQuestionId,
} from '../schemas/vibecheck-output';

/** Focus areas mapping based on trigger type. */
const FOCUS_AREAS: Record<TriggerType, string[]> = {
  line_spike: ['control flow', 'edge cases', 'variable scope', 'function purpose'],
  high_complexity: ['branching logic', 'loop conditions', 'error paths', 'state management'],
  paste: ['overall logic', 'data flow', 'API contracts', 'integration points'],
};

/** Focus area descriptions for the LLM prompt. */
const FOCUS_DESCRIPTIONS: Record<TriggerType, string> = {
  line_spike:
    'The student added many lines quickly. Focus on whether they understand control flow, edge cases, and variable scope.',
  high_complexity:
    'The code has high cyclomatic complexity. Focus on branching logic, loop conditions, and error handling paths.',
  paste:
    'The student pasted this code. Focus on overall logic comprehension, data flow, and how it integrates with surrounding code.',
};

/**
 * Service for generating vibecheck quiz questions using Anthropic Claude.
 */
export class VibecheckService {
  private anthropic: Anthropic | null = null;
  private apiKey: string | null = null;

  /**
   * Sets the Anthropic API key for the service.
   *
   * Args:
   *     apiKey: The Anthropic API key.
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Checks if the service is configured with an API key.
   *
   * Returns:
   *     True if an API key has been set.
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.anthropic !== null;
  }

  /**
   * Generates vibecheck quiz questions for a code snippet.
   *
   * Args:
   *     input: The vibecheck input parameters.
   *
   * Returns:
   *     A promise resolving to the generated questions.
   *
   * Raises:
   *     Error: If the service is not configured or input is invalid.
   */
  async generateVibecheck(input: VibecheckInput): Promise<VibecheckOutput> {
    if (!this.anthropic) {
      throw new Error('VibecheckService not configured. Call setApiKey() first.');
    }

    const validation = validateVibecheckInput(input);
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.error}`);
    }

    const focusAreas = FOCUS_AREAS[input.triggeredBy];
    const focusDescription = FOCUS_DESCRIPTIONS[input.triggeredBy];
    const numQuestions = input.numQuestions ?? 4;
    const difficulty = input.difficulty ?? 'intermediate';

    const prompt = this.buildPrompt(input, focusDescription, numQuestions, difficulty);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Anthropic');
    }

    const questions = this.parseQuestionsFromResponse(textContent.text);

    return {
      questions,
      focusAreas,
      estimatedDifficulty: difficulty,
    };
  }

  /**
   * Builds the prompt for Claude to generate questions.
   */
  private buildPrompt(
    input: VibecheckInput,
    focusDescription: string,
    numQuestions: number,
    difficulty: string
  ): string {
    const contextLine = input.context ? `\nContext: ${input.context}` : '';

    return `You are an educational coding assistant helping students understand code they may have copied or written too quickly.

${focusDescription}

Analyse the following ${input.language} code and generate ${numQuestions} multiple-choice comprehension questions at the ${difficulty} level.
${contextLine}

Code:
\`\`\`${input.language}
${input.code}
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
  }

  /**
   * Parses questions from Claude's JSON response.
   */
  private parseQuestionsFromResponse(responseText: string): VibecheckQuestion[] {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse questions from response');
    }

    let parsed: unknown[];
    try {
      parsed = JSON.parse(jsonMatch[0]) as unknown[];
    } catch {
      throw new Error('Invalid JSON in response');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Response does not contain a valid questions array');
    }

    return parsed.map((q: unknown) => {
      const question = q as Record<string, unknown>;
      return {
        id: generateQuestionId(),
        text: String(question.text || ''),
        type: 'multiple_choice' as const,
        options: Array.isArray(question.options)
          ? question.options.map(String)
          : [],
        correctAnswer: String(question.correctAnswer || ''),
        concept: String(question.concept || 'general'),
        hint: question.hint ? String(question.hint) : undefined,
      };
    });
  }
}

let vibecheckServiceInstance: VibecheckService | null = null;

/**
 * Gets the singleton VibecheckService instance.
 *
 * Returns:
 *     The VibecheckService singleton.
 */
export function getVibecheckService(): VibecheckService {
  if (!vibecheckServiceInstance) {
    vibecheckServiceInstance = new VibecheckService();
  }
  return vibecheckServiceInstance;
}
