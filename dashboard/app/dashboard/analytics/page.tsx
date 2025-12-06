'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StatsCard } from '@/components/stats-card';
import clsx from 'clsx';

interface VibecheckData {
  _id: string;
  triggeredBy: 'line_spike' | 'high_complexity' | 'paste';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  answers: Array<{ correct: boolean }>;
  questions: Array<{ concept: string }>;
  complexity?: number;
  createdAt: number;
}

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
 * Analytics dashboard page showing aggregate statistics and charts.
 *
 * Returns:
 *     The analytics view with charts and statistics.
 */
export default function AnalyticsPage() {
  const metrics = useQuery(api.metrics.getAggregated, {}) as AggregatedMetrics | undefined;
  const recentVibechecks = useQuery(api.vibechecks.getRecent, {
    limit: 100,
  }) as VibecheckData[] | undefined;

  const triggerDistribution = recentVibechecks?.reduce(
    (acc, v) => {
      acc[v.triggeredBy] = (acc[v.triggeredBy] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const statusDistribution = recentVibechecks?.reduce(
    (acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const conceptErrors = new Map<string, number>();
  if (recentVibechecks) {
    for (const vc of recentVibechecks) {
      if (vc.status === 'completed') {
        for (let i = 0; i < vc.answers.length; i++) {
          if (!vc.answers[i].correct && vc.questions[i]) {
            const concept = vc.questions[i].concept;
            conceptErrors.set(concept, (conceptErrors.get(concept) || 0) + 1);
          }
        }
      }
    }
  }
  const topConceptErrors = Array.from(conceptErrors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const passRate = metrics && metrics.vibechecksCompleted > 0
    ? Math.round((metrics.vibechecksPassed / metrics.vibechecksCompleted) * 100)
    : 0;

  const totalTriggers = Object.values(triggerDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Aggregate statistics and insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Vibechecks"
          value={recentVibechecks?.length ?? '-'}
          subtitle="in recent history"
        />
        <StatsCard
          title="Completion Rate"
          value={
            recentVibechecks
              ? `${Math.round((statusDistribution.completed || 0) / recentVibechecks.length * 100)}%`
              : '-'
          }
          subtitle="vibechecks completed"
        />
        <StatsCard
          title="Skip Rate"
          value={
            recentVibechecks
              ? `${Math.round((statusDistribution.skipped || 0) / recentVibechecks.length * 100)}%`
              : '-'
          }
          subtitle="vibechecks skipped"
        />
        <StatsCard
          title="Pass Rate"
          value={`${passRate}%`}
          subtitle="of completed checks"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detection Type Distribution
          </h3>
          {totalTriggers === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'line_spike', label: 'Line Spike', colour: 'bg-blue-500' },
                { key: 'high_complexity', label: 'High Complexity', colour: 'bg-purple-500' },
                { key: 'paste', label: 'Paste Detected', colour: 'bg-orange-500' },
              ].map(({ key, label, colour }) => {
                const count = triggerDistribution[key] || 0;
                const percentage = Math.round((count / totalTriggers) * 100);

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={clsx('h-2 rounded-full', colour)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vibecheck Status Distribution
          </h3>
          {!recentVibechecks || recentVibechecks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'completed', label: 'Completed', colour: 'bg-green-500' },
                { key: 'skipped', label: 'Skipped', colour: 'bg-yellow-500' },
                { key: 'in_progress', label: 'In Progress', colour: 'bg-blue-500' },
                { key: 'pending', label: 'Pending', colour: 'bg-gray-500' },
              ].map(({ key, label, colour }) => {
                const count = statusDistribution[key] || 0;
                const percentage = Math.round((count / recentVibechecks.length) * 100);

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={clsx('h-2 rounded-full', colour)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Struggling Concepts (Class-wide)
        </h3>
        {topConceptErrors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No data yet - concepts will appear here once students complete vibechecks
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topConceptErrors.map(([concept, count], index) => (
              <div
                key={concept}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-600"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      index < 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {concept}
                  </span>
                </div>
                <span className="text-sm text-red-600 font-medium">
                  {count} errors
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
