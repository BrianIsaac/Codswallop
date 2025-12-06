import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Syncs the authenticated Clerk user to Convex.
 * Creates a new user if they don't exist, or updates existing user data.
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email ?? existing.email,
        displayName: identity.name ?? existing.displayName,
        imageUrl: identity.pictureUrl,
      });
      return existing;
    }

    const userId = await ctx.db.insert('users', {
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: identity.subject,
      email: identity.email ?? '',
      displayName: identity.name ?? 'Anonymous',
      imageUrl: identity.pictureUrl,
      role: 'student',
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Gets the currently authenticated user.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();
  },
});

/**
 * Requests teacher role for the current user.
 */
export const requestTeacherRole = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, { role: 'teacher' });
    return await ctx.db.get(user._id);
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
