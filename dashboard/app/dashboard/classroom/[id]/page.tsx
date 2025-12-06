'use client';

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { StatsCard } from '@/components/stats-card';
import { ActivityFeed } from '@/components/activity-feed';
import clsx from 'clsx';

interface StudentData {
  _id: Id<'users'>;
  displayName: string;
  email: string;
  vibecheckCount: number;
  passRate: number;
}

interface ClassroomData {
  _id: Id<'classrooms'>;
  name: string;
  description?: string;
  joinCode: string;
  students: StudentData[];
  teacher: {
    displayName: string;
    email: string;
  } | null;
  settings: {
    autoVibecheck: boolean;
    minComplexity: number;
    notifyOnFail: boolean;
  };
}

interface ClassroomStats {
  studentCount: number;
  totalVibechecks: number;
  passedVibechecks: number;
  passRate: number;
  averageComplexity: number;
}

/**
 * Individual classroom detail page showing students and activity.
 *
 * Args:
 *     params: Route parameters containing the classroom ID.
 *
 * Returns:
 *     The classroom detail view with student list and stats.
 */
export default function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const classroomId = id as Id<'classrooms'>;

  const classroom = useQuery(api.classrooms.getById, {
    classroomId,
  }) as ClassroomData | null | undefined;

  const stats = useQuery(api.classrooms.getStats, {
    classroomId,
  }) as ClassroomStats | null | undefined;

  if (classroom === undefined) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (classroom === null) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Classroom not found
        </h2>
        <Link
          href="/dashboard/classroom"
          className="text-vibe-600 hover:text-vibe-700"
        >
          Back to classrooms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/classroom"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Classrooms
            </Link>
            <span className="text-gray-400">/</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {classroom.name}
          </h1>
          {classroom.description && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {classroom.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Join Code</p>
          <p className="text-2xl font-mono font-bold text-vibe-600">
            {classroom.joinCode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Students"
          value={stats?.studentCount ?? 0}
          subtitle="enrolled"
        />
        <StatsCard
          title="Vibechecks"
          value={stats?.totalVibechecks ?? 0}
          subtitle={`${stats?.passedVibechecks ?? 0} passed`}
        />
        <StatsCard
          title="Pass Rate"
          value={stats ? `${Math.round(stats.passRate)}%` : '-'}
          subtitle="class average"
        />
        <StatsCard
          title="Avg Complexity"
          value={stats?.averageComplexity ? stats.averageComplexity.toFixed(1) : '-'}
          subtitle="cyclomatic"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Students
          </h3>
          {classroom.students.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No students enrolled yet. Share the join code to add students.
            </p>
          ) : (
            <div className="space-y-3">
              {classroom.students.map((student) => (
                <Link
                  key={student._id}
                  href={`/dashboard/classroom/${classroom._id}/students/${student._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.vibecheckCount} checks
                    </p>
                    <p
                      className={clsx(
                        'text-sm font-medium',
                        student.passRate >= 75
                          ? 'text-green-600'
                          : student.passRate >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      )}
                    >
                      {Math.round(student.passRate)}% pass rate
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <ActivityFeed limit={10} />
      </div>
    </div>
  );
}
