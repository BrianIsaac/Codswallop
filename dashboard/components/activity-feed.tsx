'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface ActivityItem {
  _id: string;
  eventType: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  user: {
    displayName: string;
    email: string;
  } | null;
}

function getEventIcon(eventType: string): React.ReactNode {
  switch (eventType) {
    case 'vibecheck:completed':
      return (
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'vibecheck:started':
      return (
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'vibecheck:skipped':
      return (
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    case 'vibe:detected':
      return (
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

function getEventDescription(activity: ActivityItem): string {
  const metadata = activity.metadata as Record<string, unknown>;

  switch (activity.eventType) {
    case 'vibecheck:completed':
      const passed = metadata.passed as boolean;
      const score = metadata.score as number;
      return passed
        ? `Passed vibecheck with ${Math.round(score * 100)}% score`
        : `Failed vibecheck with ${Math.round(score * 100)}% score`;
    case 'vibecheck:started':
      return 'Started a vibecheck';
    case 'vibecheck:skipped':
      return 'Skipped a vibecheck';
    case 'vibe:detected':
      const trigger = metadata.triggeredBy as string;
      const triggerLabels: Record<string, string> = {
        line_spike: 'line spike',
        high_complexity: 'high complexity',
        paste: 'paste',
      };
      return `Vibe coding detected: ${triggerLabels[trigger] || trigger}`;
    default:
      return activity.eventType;
  }
}

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

/**
 * Real-time activity feed showing recent student actions.
 *
 * Args:
 *     limit: Maximum number of activities to show.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     A list of recent activities with real-time updates.
 */
export function ActivityFeed({ limit = 10, className }: ActivityFeedProps): React.ReactNode {
  const activities = useQuery(api.activityLog.getRecent, { limit }) as ActivityItem[] | undefined;

  if (activities === undefined) {
    return (
      <div className={clsx('bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-3">
              {getEventIcon(activity.eventType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.user?.displayName || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getEventDescription(activity)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
