import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

/**
 * A card component displaying a statistic with optional trend indicator.
 *
 * Args:
 *     title: The label for the statistic.
 *     value: The main value to display.
 *     subtitle: Optional additional context text.
 *     trend: Optional trend data with value and direction.
 *     icon: Optional icon to display.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     A styled card showing the statistic.
 */
export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: StatsCardProps): React.ReactNode {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={clsx(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-vibe-100 dark:bg-vibe-900 rounded-lg text-vibe-600 dark:text-vibe-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
