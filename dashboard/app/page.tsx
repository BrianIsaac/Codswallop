import { redirect } from 'next/navigation';

/**
 * Root page that redirects to the dashboard.
 *
 * Returns:
 *     Never returns - always redirects.
 */
export default function Home() {
  redirect('/dashboard');
}
