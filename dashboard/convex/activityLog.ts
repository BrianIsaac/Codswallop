import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Logs an activity event.
 */
export const log = mutation({
  args: {
    userId: v.id('users'),
    classroomId: v.optional(v.id('classrooms')),
    eventType: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('activityLog', {
      userId: args.userId,
      classroomId: args.classroomId,
      eventType: args.eventType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

/**
 * Gets recent activity for a classroom.
 */
export const getByClassroom = query({
  args: {
    classroomId: v.id('classrooms'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const activities = await ctx.db
      .query('activityLog')
      .withIndex('by_classroom', (q) => q.eq('classroomId', args.classroomId))
      .order('desc')
      .take(limit);

    const withUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          user: user
            ? { displayName: user.displayName, email: user.email }
            : null,
        };
      })
    );

    return withUsers;
  },
});

/**
 * Gets recent activity for a user.
 */
export const getByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query('activityLog')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

/**
 * Gets recent global activity (for teacher dashboard).
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const activities = await ctx.db
      .query('activityLog')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit);

    const withUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          user: user
            ? { displayName: user.displayName, email: user.email }
            : null,
        };
      })
    );

    return withUsers;
  },
});
