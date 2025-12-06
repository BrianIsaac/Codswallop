'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import clsx from 'clsx';

interface VibecheckData {
  _id: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  answers: Array<{ correct: boolean }>;
  questions: Array<unknown>;
  user: {
    displayName: string;
    email: string;
  } | null;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalVibechecks: number;
  passed: number;
  avgScore: number;
  vibeRate: number;
}

interface StudentLeaderboardProps {
  limit?: number;
  className?: string;
}

/**
 * Leaderboard showing student rankings by vibecheck performance.
 *
 * Args:
 *     limit: Maximum number of students to show.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     A ranked list of students with their vibecheck stats.
 */
export function StudentLeaderboard({ limit = 10, className }: StudentLeaderboardProps): React.ReactNode {
  const vibechecks = useQuery(api.vibechecks.getRecent, { limit: 100 }) as VibecheckData[] | undefined;

  if (vibechecks === undefined) {
    return (
      <div className={clsx('bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Student Leaderboard
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const leaderboardMap = new Map<string, LeaderboardEntry>();

  for (const vc of vibechecks) {
    if (!vc.user || vc.status !== 'completed') continue;

    const existing = leaderboardMap.get(vc.userId);
    const correctAnswers = vc.answers.filter((a) => a.correct).length;
    const totalQuestions = vc.questions.length;
    const score = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const passed = score >= 0.75;

    if (existing) {
      existing.totalVibechecks += 1;
      existing.passed += passed ? 1 : 0;
      existing.avgScore = (existing.avgScore * (existing.totalVibechecks - 1) + score) / existing.totalVibechecks;
    } else {
      leaderboardMap.set(vc.userId, {
        userId: vc.userId,
        displayName: vc.user.displayName,
        totalVibechecks: 1,
        passed: passed ? 1 : 0,
        avgScore: score,
        vibeRate: 0,
      });
    }
  }

  const leaderboard = Array.from(leaderboardMap.values())
    .map((entry) => ({
      ...entry,
      vibeRate: entry.totalVibechecks > 0 ? (entry.passed / entry.totalVibechecks) * 100 : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);

  return (
    <div className={clsx('bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Student Leaderboard
      </h3>
      {leaderboard.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No vibecheck data yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Student</th>
                <th className="pb-3 text-right">Checks</th>
                <th className="pb-3 text-right">Passed</th>
                <th className="pb-3 text-right">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {leaderboard.map((entry, index) => (
                <tr key={entry.userId}>
                  <td className="py-3">
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                        index === 0 && 'bg-yellow-100 text-yellow-800',
                        index === 1 && 'bg-gray-100 text-gray-800',
                        index === 2 && 'bg-orange-100 text-orange-800',
                        index > 2 && 'bg-gray-50 text-gray-600'
                      )}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.displayName}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    {entry.totalVibechecks}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    {entry.passed}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        entry.avgScore >= 0.75 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {Math.round(entry.avgScore * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
