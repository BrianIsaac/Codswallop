/**
 * Input schema for vibecheck generation.
 *
 * Defines the structure and validation rules for requests to generate
 * comprehension questions based on code snippets.
 */

/** Valid programming languages for vibecheck generation. */
export type Language = 'typescript' | 'javascript' | 'python';

/** Trigger types that can initiate a vibecheck. */
export type TriggerType = 'line_spike' | 'high_complexity' | 'paste';

/** Difficulty levels for generated questions. */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Input parameters for generating a vibecheck quiz.
 */
export interface VibecheckInput {
  /** Code snippet to analyse and generate questions for. */
  code: string;

  /** Programming language of the code snippet. */
  language: Language;

  /** The indicator that triggered this vibecheck. */
  triggeredBy: TriggerType;

  /** Additional context about the code (e.g., file path, function name). */
  context?: string;

  /** Difficulty level for generated questions. */
  difficulty?: Difficulty;

  /** Number of questions to generate (2-6). */
  numQuestions?: number;
}

/**
 * Validates a VibecheckInput object.
 *
 * Args:
 *     input: The input object to validate.
 *
 * Returns:
 *     An object containing isValid boolean and optional error message.
 */
export function validateVibecheckInput(
  input: VibecheckInput
): { isValid: boolean; error?: string } {
  if (!input.code || input.code.trim().length === 0) {
    return { isValid: false, error: 'Code snippet is required' };
  }

  if (input.code.length > 10000) {
    return { isValid: false, error: 'Code snippet exceeds maximum length of 10000 characters' };
  }

  const validLanguages: Language[] = ['typescript', 'javascript', 'python'];
  if (!validLanguages.includes(input.language)) {
    return { isValid: false, error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` };
  }

  const validTriggers: TriggerType[] = ['line_spike', 'high_complexity', 'paste'];
  if (!validTriggers.includes(input.triggeredBy)) {
    return { isValid: false, error: `Invalid trigger type. Must be one of: ${validTriggers.join(', ')}` };
  }

  if (input.context && input.context.length > 500) {
    return { isValid: false, error: 'Context exceeds maximum length of 500 characters' };
  }

  if (input.numQuestions !== undefined) {
    if (input.numQuestions < 2 || input.numQuestions > 6) {
      return { isValid: false, error: 'Number of questions must be between 2 and 6' };
    }
  }

  const validDifficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  if (input.difficulty && !validDifficulties.includes(input.difficulty)) {
    return { isValid: false, error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` };
  }

  return { isValid: true };
}

/**
 * Creates a VibecheckInput with default values applied.
 *
 * Args:
 *     partial: Partial input with required fields.
 *
 * Returns:
 *     Complete VibecheckInput with defaults applied.
 */
export function createVibecheckInput(
  partial: Pick<VibecheckInput, 'code' | 'language' | 'triggeredBy'> &
    Partial<VibecheckInput>
): VibecheckInput {
  return {
    code: partial.code,
    language: partial.language,
    triggeredBy: partial.triggeredBy,
    context: partial.context,
    difficulty: partial.difficulty ?? 'intermediate',
    numQuestions: partial.numQuestions ?? 4,
  };
}
