import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Creates or updates a user record.
 */
export const createOrUpdate = mutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.union(v.literal('student'), v.literal('teacher')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
        role: args.role,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      tokenIdentifier: args.tokenIdentifier,
      email: args.email,
      displayName: args.displayName,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

/**
 * Gets a user by their authentication token.
 */
export const getByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .first();
  },
});

/**
 * Gets a user by their email address.
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

/**
 * Gets a user by their ID.
 */
export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Gets or creates a demo teacher for development/testing.
 */
export const getOrCreateDemoTeacher = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', 'demo@codswallop.dev'))
      .first();

    if (existing) {
      return existing;
    }

    const id = await ctx.db.insert('users', {
      tokenIdentifier: 'demo_teacher_token',
      email: 'demo@codswallop.dev',
      displayName: 'Demo Teacher',
      role: 'teacher',
      createdAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});
