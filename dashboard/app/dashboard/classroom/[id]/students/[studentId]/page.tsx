'use client';

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { StatsCard } from '@/components/stats-card';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

interface VibecheckData {
  _id: Id<'vibechecks'>;
  fileUri: string;
  line: number;
  language: string;
  triggeredBy: 'line_spike' | 'high_complexity' | 'paste';
  indicatorValue: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  answers: Array<{ correct: boolean }>;
  questions: Array<{ concept: string }>;
  createdAt: number;
  completedAt?: number;
}

interface StudentData {
  _id: Id<'users'>;
  displayName: string;
  email: string;
  role: 'student' | 'teacher';
  createdAt: number;
}

function getTriggerLabel(trigger: string): string {
  const labels: Record<string, string> = {
    line_spike: 'Line Spike',
    high_complexity: 'High Complexity',
    paste: 'Paste Detected',
  };
  return labels[trigger] || trigger;
}

/**
 * Individual student detail page showing their vibecheck history.
 *
 * Args:
 *     params: Route parameters containing classroom and student IDs.
 *
 * Returns:
 *     The student detail view with vibecheck history and stats.
 */
export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = use(params);
  const classroomId = id as Id<'classrooms'>;
  const userId = studentId as Id<'users'>;

  const student = useQuery(api.users.getById, { userId }) as StudentData | null | undefined;
  const vibechecks = useQuery(api.vibechecks.getByUser, {
    userId,
  }) as VibecheckData[] | undefined;

  if (student === undefined || vibechecks === undefined) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (student === null) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Student not found
        </h2>
        <Link
          href={`/dashboard/classroom/${classroomId}`}
          className="text-vibe-600 hover:text-vibe-700"
        >
          Back to classroom
        </Link>
      </div>
    );
  }

  const completedChecks = vibechecks.filter((v) => v.status === 'completed');
  const passedChecks = completedChecks.filter((v) => {
    const correctCount = v.answers.filter((a) => a.correct).length;
    return v.questions.length > 0 && correctCount / v.questions.length >= 0.75;
  });
  const skippedChecks = vibechecks.filter((v) => v.status === 'skipped');

  const passRate = completedChecks.length > 0
    ? (passedChecks.length / completedChecks.length) * 100
    : 0;

  const triggerCounts = vibechecks.reduce(
    (acc, v) => {
      acc[v.triggeredBy] = (acc[v.triggeredBy] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const strugglingConcepts = new Map<string, number>();
  for (const vc of completedChecks) {
    for (let i = 0; i < vc.answers.length; i++) {
      if (!vc.answers[i].correct && vc.questions[i]) {
        const concept = vc.questions[i].concept;
        strugglingConcepts.set(concept, (strugglingConcepts.get(concept) || 0) + 1);
      }
    }
  }
  const topStruggles = Array.from(strugglingConcepts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm">
          <Link
            href="/dashboard/classroom"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Classrooms
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/dashboard/classroom/${classroomId}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Classroom
          </Link>
          <span className="text-gray-400">/</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {student.displayName}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{student.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Vibechecks"
          value={vibechecks.length}
          subtitle={`${completedChecks.length} completed`}
        />
        <StatsCard
          title="Pass Rate"
          value={`${Math.round(passRate)}%`}
          subtitle={`${passedChecks.length} passed`}
        />
        <StatsCard
          title="Skipped"
          value={skippedChecks.length}
          subtitle="vibechecks skipped"
        />
        <StatsCard
          title="Most Common Trigger"
          value={
            Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
              ? getTriggerLabel(
                  Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0][0]
                )
              : '-'
          }
          subtitle="detection type"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Vibechecks
          </h3>
          {vibechecks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No vibechecks yet
            </p>
          ) : (
            <div className="space-y-3">
              {vibechecks.slice(0, 10).map((vc) => {
                const correctCount = vc.answers.filter((a) => a.correct).length;
                const score =
                  vc.questions.length > 0
                    ? correctCount / vc.questions.length
                    : 0;
                const passed = score >= 0.75;

                return (
                  <div
                    key={vc._id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-600"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getTriggerLabel(vc.triggeredBy)}
                      </span>
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded-full',
                          vc.status === 'completed' && passed && 'bg-green-100 text-green-700',
                          vc.status === 'completed' && !passed && 'bg-red-100 text-red-700',
                          vc.status === 'skipped' && 'bg-yellow-100 text-yellow-700',
                          vc.status === 'pending' && 'bg-gray-100 text-gray-700',
                          vc.status === 'in_progress' && 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {vc.status === 'completed'
                          ? passed
                            ? `Passed (${Math.round(score * 100)}%)`
                            : `Failed (${Math.round(score * 100)}%)`
                          : vc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {vc.language} - Line {vc.line}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(vc.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Struggling Concepts
          </h3>
          {topStruggles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-3">
              {topStruggles.map(([concept, count]) => (
                <div
                  key={concept}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-600"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {concept}
                  </span>
                  <span className="text-sm text-red-600">
                    {count} incorrect
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
