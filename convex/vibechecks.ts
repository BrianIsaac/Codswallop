import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const questionValidator = v.object({
  id: v.string(),
  text: v.string(),
  type: v.union(v.literal('multiple_choice'), v.literal('free_text')),
  options: v.optional(v.array(v.string())),
  correctAnswer: v.string(),
  concept: v.string(),
});

const answerValidator = v.object({
  questionId: v.string(),
  answer: v.string(),
  correct: v.boolean(),
  timestamp: v.number(),
});

/**
 * Creates a new vibecheck record.
 */
export const create = mutation({
  args: {
    userId: v.id('users'),
    fileUri: v.string(),
    line: v.number(),
    code: v.string(),
    language: v.string(),
    triggeredBy: v.union(
      v.literal('line_spike'),
      v.literal('high_complexity'),
      v.literal('paste')
    ),
    indicatorValue: v.number(),
    indicatorThreshold: v.number(),
    complexity: v.optional(v.number()),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('vibechecks', {
      userId: args.userId,
      fileUri: args.fileUri,
      line: args.line,
      code: args.code,
      language: args.language,
      triggeredBy: args.triggeredBy,
      indicatorValue: args.indicatorValue,
      indicatorThreshold: args.indicatorThreshold,
      complexity: args.complexity,
      questions: args.questions,
      answers: [],
      status: 'pending',
      createdAt: Date.now(),
    });
  },
});

/**
 * Marks a vibecheck as started (in progress).
 */
export const start = mutation({
  args: { vibecheckId: v.id('vibechecks') },
  handler: async (ctx, args) => {
    const vibecheck = await ctx.db.get(args.vibecheckId);
    if (!vibecheck) {
      throw new Error('Vibecheck not found');
    }

    await ctx.db.patch(args.vibecheckId, {
      status: 'in_progress',
    });

    return await ctx.db.get(args.vibecheckId);
  },
});

/**
 * Submits an answer to a question.
 */
export const submitAnswer = mutation({
  args: {
    vibecheckId: v.id('vibechecks'),
    questionId: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const vibecheck = await ctx.db.get(args.vibecheckId);
    if (!vibecheck) {
      throw new Error('Vibecheck not found');
    }

    const question = vibecheck.questions.find((q) => q.id === args.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const correct = args.answer === question.correctAnswer;

    const newAnswer = {
      questionId: args.questionId,
      answer: args.answer,
      correct,
      timestamp: Date.now(),
    };

    const existingAnswerIndex = vibecheck.answers.findIndex(
      (a) => a.questionId === args.questionId
    );

    let updatedAnswers;
    if (existingAnswerIndex >= 0) {
      updatedAnswers = [...vibecheck.answers];
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers = [...vibecheck.answers, newAnswer];
    }

    await ctx.db.patch(args.vibecheckId, {
      answers: updatedAnswers,
    });

    return { correct };
  },
});

/**
 * Completes a vibecheck and calculates the final score.
 */
export const complete = mutation({
  args: { vibecheckId: v.id('vibechecks') },
  handler: async (ctx, args) => {
    const vibecheck = await ctx.db.get(args.vibecheckId);
    if (!vibecheck) {
      throw new Error('Vibecheck not found');
    }

    const correctCount = vibecheck.answers.filter((a) => a.correct).length;
    const totalQuestions = vibecheck.questions.length;
    const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    const passed = score >= 0.75;

    await ctx.db.patch(args.vibecheckId, {
      status: 'completed',
      completedAt: Date.now(),
    });

    return {
      passed,
      score,
      correctCount,
      totalQuestions,
    };
  },
});

/**
 * Marks a vibecheck as skipped.
 */
export const skip = mutation({
  args: {
    vibecheckId: v.id('vibechecks'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const vibecheck = await ctx.db.get(args.vibecheckId);
    if (!vibecheck) {
      throw new Error('Vibecheck not found');
    }

    await ctx.db.patch(args.vibecheckId, {
      status: 'skipped',
      completedAt: Date.now(),
    });

    return await ctx.db.get(args.vibecheckId);
  },
});

/**
 * Gets a vibecheck by ID.
 */
export const getById = query({
  args: { vibecheckId: v.id('vibechecks') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vibecheckId);
  },
});

/**
 * Gets all vibechecks for a user.
 */
export const getByUser = query({
  args: {
    userId: v.id('users'),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('skipped')
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query('vibechecks')
        .withIndex('by_user_status', (q) =>
          q.eq('userId', args.userId).eq('status', args.status!)
        )
        .collect();
    }

    return await ctx.db
      .query('vibechecks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

/**
 * Gets pending vibechecks for a user.
 */
export const getPending = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibechecks')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', args.userId).eq('status', 'pending')
      )
      .collect();
  },
});

/**
 * Gets recent vibechecks with user data (for dashboard).
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const vibechecks = await ctx.db
      .query('vibechecks')
      .order('desc')
      .take(limit);

    const withUsers = await Promise.all(
      vibechecks.map(async (vibecheck) => {
        const user = await ctx.db.get(vibecheck.userId);
        return {
          ...vibecheck,
          user: user
            ? { displayName: user.displayName, email: user.email }
            : null,
        };
      })
    );

    return withUsers;
  },
});
