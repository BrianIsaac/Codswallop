import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.optional(v.string()),
    email: v.string(),
    displayName: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal('student'), v.literal('teacher')),
    createdAt: v.number(),
  })
    .index('by_token', ['tokenIdentifier'])
    .index('by_email', ['email']),

  vibechecks: defineTable({
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
    questions: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        type: v.union(v.literal('multiple_choice'), v.literal('free_text')),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.string(),
        concept: v.string(),
      })
    ),
    answers: v.array(
      v.object({
        questionId: v.string(),
        answer: v.string(),
        correct: v.boolean(),
        timestamp: v.number(),
      })
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('skipped')
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_status', ['status'])
    .index('by_trigger', ['triggeredBy']),

  metrics: defineTable({
    userId: v.id('users'),
    date: v.string(),
    totalLines: v.number(),
    vibeCodedLines: v.number(),
    vibechecksCompleted: v.number(),
    vibechecksPassed: v.number(),
    averageComplexity: v.number(),
    averageVibeScore: v.number(),
  }).index('by_user_date', ['userId', 'date']),

  classrooms: defineTable({
    teacherId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    joinCode: v.string(),
    studentIds: v.array(v.id('users')),
    settings: v.object({
      autoVibecheck: v.boolean(),
      minComplexity: v.number(),
      notifyOnFail: v.boolean(),
    }),
    createdAt: v.number(),
  })
    .index('by_teacher', ['teacherId'])
    .index('by_code', ['joinCode']),

  activityLog: defineTable({
    userId: v.id('users'),
    classroomId: v.optional(v.id('classrooms')),
    eventType: v.string(),
    metadata: v.any(),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_classroom', ['classroomId'])
    .index('by_timestamp', ['timestamp']),
});
