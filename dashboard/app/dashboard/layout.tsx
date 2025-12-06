import { Sidebar } from '@/components/sidebar';

/**
 * Layout for the dashboard pages with sidebar navigation.
 *
 * Args:
 *     children: Child pages to render in the main content area.
 *
 * Returns:
 *     The dashboard layout with sidebar and main content.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-800">
        {children}
      </main>
    </div>
  );
}
