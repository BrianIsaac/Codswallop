'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StatsCard } from '@/components/stats-card';
import { ActivityFeed } from '@/components/activity-feed';
import { StudentLeaderboard } from '@/components/student-leaderboard';

interface AggregatedMetrics {
  date: string;
  totalLines: number;
  vibeCodedLines: number;
  vibechecksCompleted: number;
  vibechecksPassed: number;
  averageComplexity: number;
  averageVibeScore: number;
  activeStudents: number;
}

/**
 * Main dashboard overview page showing stats and activity.
 *
 * Returns:
 *     The dashboard overview with stats cards, activity feed, and leaderboard.
 */
export default function DashboardPage() {
  const metrics = useQuery(api.metrics.getAggregated, {}) as AggregatedMetrics | undefined;

  const passRate = metrics && metrics.vibechecksCompleted > 0
    ? Math.round((metrics.vibechecksPassed / metrics.vibechecksCompleted) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Monitor student vibecheck activity in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Students"
          value={metrics?.activeStudents ?? '-'}
          subtitle="coding today"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Vibechecks Today"
          value={metrics?.vibechecksCompleted ?? '-'}
          subtitle={`${metrics?.vibechecksPassed ?? 0} passed`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Pass Rate"
          value={metrics ? `${passRate}%` : '-'}
          subtitle="vibecheck success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <StatsCard
          title="Avg Complexity"
          value={metrics?.averageComplexity ? metrics.averageComplexity.toFixed(1) : '-'}
          subtitle="cyclomatic complexity"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed limit={10} />
        <StudentLeaderboard limit={10} />
      </div>
    </div>
  );
}
