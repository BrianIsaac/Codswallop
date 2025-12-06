import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Updates or creates daily metrics for a user.
 */
export const updateDaily = mutation({
  args: {
    userId: v.id('users'),
    date: v.string(),
    updates: v.object({
      totalLines: v.optional(v.number()),
      vibeCodedLines: v.optional(v.number()),
      vibechecksCompleted: v.optional(v.number()),
      vibechecksPassed: v.optional(v.number()),
      averageComplexity: v.optional(v.number()),
      averageVibeScore: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('metrics')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', args.userId).eq('date', args.date)
      )
      .first();

    if (existing) {
      const updates: Record<string, number> = {};

      if (args.updates.totalLines !== undefined) {
        updates.totalLines = existing.totalLines + args.updates.totalLines;
      }
      if (args.updates.vibeCodedLines !== undefined) {
        updates.vibeCodedLines =
          existing.vibeCodedLines + args.updates.vibeCodedLines;
      }
      if (args.updates.vibechecksCompleted !== undefined) {
        updates.vibechecksCompleted =
          existing.vibechecksCompleted + args.updates.vibechecksCompleted;
      }
      if (args.updates.vibechecksPassed !== undefined) {
        updates.vibechecksPassed =
          existing.vibechecksPassed + args.updates.vibechecksPassed;
      }
      if (args.updates.averageComplexity !== undefined) {
        const totalChecks = existing.vibechecksCompleted + 1;
        updates.averageComplexity =
          (existing.averageComplexity * existing.vibechecksCompleted +
            args.updates.averageComplexity) /
          totalChecks;
      }
      if (args.updates.averageVibeScore !== undefined) {
        const totalChecks = existing.vibechecksCompleted + 1;
        updates.averageVibeScore =
          (existing.averageVibeScore * existing.vibechecksCompleted +
            args.updates.averageVibeScore) /
          totalChecks;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert('metrics', {
      userId: args.userId,
      date: args.date,
      totalLines: args.updates.totalLines ?? 0,
      vibeCodedLines: args.updates.vibeCodedLines ?? 0,
      vibechecksCompleted: args.updates.vibechecksCompleted ?? 0,
      vibechecksPassed: args.updates.vibechecksPassed ?? 0,
      averageComplexity: args.updates.averageComplexity ?? 0,
      averageVibeScore: args.updates.averageVibeScore ?? 0,
    });
  },
});

/**
 * Gets metrics for a user over a date range.
 */
export const getByUserDateRange = query({
  args: {
    userId: v.id('users'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query('metrics')
      .withIndex('by_user_date', (q) => q.eq('userId', args.userId))
      .collect();

    return metrics.filter(
      (m) => m.date >= args.startDate && m.date <= args.endDate
    );
  },
});

/**
 * Gets the most recent metrics for a user.
 */
export const getLatestByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query('metrics')
      .withIndex('by_user_date', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();

    return metrics;
  },
});

/**
 * Gets aggregated metrics for all users (for teacher dashboard).
 */
export const getAggregated = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const date = args.date ?? new Date().toISOString().split('T')[0];

    const allMetrics = await ctx.db.query('metrics').collect();

    const todayMetrics = allMetrics.filter((m) => m.date === date);

    const totals = todayMetrics.reduce(
      (acc, m) => ({
        totalLines: acc.totalLines + m.totalLines,
        vibeCodedLines: acc.vibeCodedLines + m.vibeCodedLines,
        vibechecksCompleted: acc.vibechecksCompleted + m.vibechecksCompleted,
        vibechecksPassed: acc.vibechecksPassed + m.vibechecksPassed,
        totalComplexity: acc.totalComplexity + m.averageComplexity,
        totalVibeScore: acc.totalVibeScore + m.averageVibeScore,
        count: acc.count + 1,
      }),
      {
        totalLines: 0,
        vibeCodedLines: 0,
        vibechecksCompleted: 0,
        vibechecksPassed: 0,
        totalComplexity: 0,
        totalVibeScore: 0,
        count: 0,
      }
    );

    return {
      date,
      totalLines: totals.totalLines,
      vibeCodedLines: totals.vibeCodedLines,
      vibechecksCompleted: totals.vibechecksCompleted,
      vibechecksPassed: totals.vibechecksPassed,
      averageComplexity:
        totals.count > 0 ? totals.totalComplexity / totals.count : 0,
      averageVibeScore:
        totals.count > 0 ? totals.totalVibeScore / totals.count : 0,
      activeStudents: totals.count,
    };
  },
});
