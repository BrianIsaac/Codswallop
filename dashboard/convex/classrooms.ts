import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Creates a new classroom with a unique join code.
 */
export const create = mutation({
  args: {
    teacherId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return await ctx.db.insert('classrooms', {
      teacherId: args.teacherId,
      name: args.name,
      description: args.description,
      joinCode,
      studentIds: [],
      settings: {
        autoVibecheck: true,
        minComplexity: 20,
        notifyOnFail: true,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Gets all classrooms for a teacher.
 */
export const getByTeacher = query({
  args: { teacherId: v.id('users') },
  handler: async (ctx, args) => {
    const classrooms = await ctx.db
      .query('classrooms')
      .withIndex('by_teacher', (q) => q.eq('teacherId', args.teacherId))
      .collect();

    return await Promise.all(
      classrooms.map(async (classroom) => {
        const students = await Promise.all(
          classroom.studentIds.map((id) => ctx.db.get(id))
        );
        return {
          ...classroom,
          students: students.filter(Boolean),
          studentCount: classroom.studentIds.length,
        };
      })
    );
  },
});

/**
 * Lists all classrooms (for demo/development without auth).
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const classrooms = await ctx.db.query('classrooms').collect();

    return await Promise.all(
      classrooms.map(async (classroom) => ({
        ...classroom,
        studentCount: classroom.studentIds.length,
      }))
    );
  },
});

/**
 * Gets a classroom by its join code.
 */
export const getByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('classrooms')
      .withIndex('by_code', (q) => q.eq('joinCode', args.joinCode))
      .first();
  },
});

/**
 * Gets a classroom by ID with student details.
 */
export const getById = query({
  args: { classroomId: v.id('classrooms') },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) return null;

    const students = await Promise.all(
      classroom.studentIds.map(async (id) => {
        const user = await ctx.db.get(id);
        if (!user) return null;

        const vibechecks = await ctx.db
          .query('vibechecks')
          .withIndex('by_user', (q) => q.eq('userId', id))
          .collect();

        const completed = vibechecks.filter((v) => v.status === 'completed');
        const passed = completed.filter((v) => {
          const correctCount = v.answers.filter((a) => a.correct).length;
          return correctCount / v.questions.length >= 0.75;
        });

        return {
          ...user,
          vibecheckCount: completed.length,
          passRate: completed.length > 0 ? (passed.length / completed.length) * 100 : 0,
        };
      })
    );

    const teacher = await ctx.db.get(classroom.teacherId);

    return {
      ...classroom,
      students: students.filter(Boolean),
      teacher: teacher
        ? { displayName: teacher.displayName, email: teacher.email }
        : null,
    };
  },
});

/**
 * Adds a student to a classroom.
 */
export const addStudent = mutation({
  args: {
    classroomId: v.id('classrooms'),
    studentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    if (classroom.studentIds.includes(args.studentId)) {
      return classroom;
    }

    await ctx.db.patch(args.classroomId, {
      studentIds: [...classroom.studentIds, args.studentId],
    });

    return await ctx.db.get(args.classroomId);
  },
});

/**
 * Removes a student from a classroom.
 */
export const removeStudent = mutation({
  args: {
    classroomId: v.id('classrooms'),
    studentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    await ctx.db.patch(args.classroomId, {
      studentIds: classroom.studentIds.filter((id) => id !== args.studentId),
    });

    return await ctx.db.get(args.classroomId);
  },
});

/**
 * Updates classroom settings.
 */
export const updateSettings = mutation({
  args: {
    classroomId: v.id('classrooms'),
    settings: v.object({
      autoVibecheck: v.boolean(),
      minComplexity: v.number(),
      notifyOnFail: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    await ctx.db.patch(args.classroomId, {
      settings: args.settings,
    });

    return await ctx.db.get(args.classroomId);
  },
});

/**
 * Deletes a classroom.
 */
export const remove = mutation({
  args: { classroomId: v.id('classrooms') },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    await ctx.db.delete(args.classroomId);
    return { success: true };
  },
});

/**
 * Joins a classroom by join code.
 * Requires authentication.
 */
export const joinByCode = mutation({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
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

    const classroom = await ctx.db
      .query('classrooms')
      .withIndex('by_code', (q) => q.eq('joinCode', args.joinCode.toUpperCase()))
      .first();

    if (!classroom) {
      throw new Error('Classroom not found');
    }

    if (classroom.studentIds.includes(user._id)) {
      return { success: true, message: 'Already in classroom', classroomId: classroom._id };
    }

    await ctx.db.patch(classroom._id, {
      studentIds: [...classroom.studentIds, user._id],
    });

    return { success: true, message: 'Joined classroom', classroomId: classroom._id };
  },
});

/**
 * Gets the classroom the current user is a member of.
 * Requires authentication.
 */
export const getMyClassroom = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();

    if (!user) {
      return null;
    }

    const classrooms = await ctx.db.query('classrooms').collect();
    return classrooms.find((c) => c.studentIds.includes(user._id)) ?? null;
  },
});

/**
 * Gets classroom statistics.
 */
export const getStats = query({
  args: { classroomId: v.id('classrooms') },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) return null;

    let totalVibechecks = 0;
    let passedVibechecks = 0;
    let totalComplexity = 0;
    let complexityCount = 0;

    for (const studentId of classroom.studentIds) {
      const vibechecks = await ctx.db
        .query('vibechecks')
        .withIndex('by_user', (q) => q.eq('userId', studentId))
        .collect();

      for (const vc of vibechecks) {
        if (vc.status === 'completed') {
          totalVibechecks++;
          const correctCount = vc.answers.filter((a) => a.correct).length;
          if (correctCount / vc.questions.length >= 0.75) {
            passedVibechecks++;
          }
        }
        if (vc.complexity !== undefined) {
          totalComplexity += vc.complexity;
          complexityCount++;
        }
      }
    }

    return {
      studentCount: classroom.studentIds.length,
      totalVibechecks,
      passedVibechecks,
      passRate: totalVibechecks > 0 ? (passedVibechecks / totalVibechecks) * 100 : 0,
      averageComplexity: complexityCount > 0 ? totalComplexity / complexityCount : 0,
    };
  },
});
