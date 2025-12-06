/**
 * Output schema for vibecheck generation.
 *
 * Defines the structure of generated quiz questions and related types.
 */

/** Question types supported in vibechecks. */
export type QuestionType = 'multiple_choice' | 'free_text';

/**
 * A single question in a vibecheck quiz.
 */
export interface VibecheckQuestion {
  /** Unique identifier for the question. */
  id: string;

  /** The question text to display to the student. */
  text: string;

  /** Type of question (multiple choice or free text). */
  type: QuestionType;

  /** Answer options for multiple choice questions. */
  options?: string[];

  /** The correct answer string. */
  correctAnswer: string;

  /** The programming concept being tested. */
  concept: string;

  /** Optional hint to help the student. */
  hint?: string;
}

/**
 * Output from vibecheck generation.
 */
export interface VibecheckOutput {
  /** Array of generated comprehension questions. */
  questions: VibecheckQuestion[];

  /** Focus areas based on the trigger type. */
  focusAreas: string[];

  /** Estimated difficulty of the generated questions. */
  estimatedDifficulty: string;
}

/**
 * A student's answer to a single question.
 */
export interface QuestionAnswer {
  /** ID of the question being answered. */
  questionId: string;

  /** The student's submitted answer. */
  answer: string;

  /** Whether the answer was correct. */
  correct: boolean;

  /** Timestamp when the answer was submitted. */
  timestamp: number;
}

/**
 * Result of completing a vibecheck.
 */
export interface VibecheckResult {
  /** Unique identifier for this vibecheck instance. */
  vibecheckId: string;

  /** Whether the student passed (score >= 75%). */
  passed: boolean;

  /** Score as a decimal (0-1). */
  score: number;

  /** Number of correct answers. */
  correctCount: number;

  /** Total number of questions. */
  totalQuestions: number;

  /** Individual answers with correctness. */
  answers: QuestionAnswer[];

  /** Timestamp when the vibecheck was completed. */
  completedAt: number;
}

/**
 * Calculates the vibecheck result from answers.
 *
 * Args:
 *     vibecheckId: Unique ID for this vibecheck.
 *     answers: Array of question answers.
 *     totalQuestions: Total number of questions in the quiz.
 *
 * Returns:
 *     VibecheckResult with pass/fail status and score.
 */
export function calculateVibecheckResult(
  vibecheckId: string,
  answers: QuestionAnswer[],
  totalQuestions: number
): VibecheckResult {
  const correctCount = answers.filter((a) => a.correct).length;
  const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const passed = score >= 0.75;

  return {
    vibecheckId,
    passed,
    score,
    correctCount,
    totalQuestions,
    answers,
    completedAt: Date.now(),
  };
}

/**
 * Generates a unique question ID.
 *
 * Returns:
 *     A unique string identifier for a question.
 */
export function generateQuestionId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
