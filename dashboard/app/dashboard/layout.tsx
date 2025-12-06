'use client';

import { ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { UserButton, SignOutButton } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { Sidebar } from '@/components/sidebar';
import { useSyncUser } from '@/hooks/use-sync-user';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  useSyncUser();

  const user = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-vibe-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-vibe-500" />
      </div>
    );
  }

  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-4">Educator Access Required</h1>
        <p className="text-gray-400 mb-6">
          This dashboard is for educators only. Would you like to register as an educator?
        </p>
        <TeacherRegistration />
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">
            Logged in as {user?.email}
          </p>
          <SignOutButton>
            <button className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors">
              Sign out to switch accounts
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function TeacherRegistration() {
  const requestTeacher = useMutation(api.users.requestTeacherRole);

  const handleRequest = async () => {
    await requestTeacher();
    window.location.reload();
  };

  return (
    <button
      onClick={handleRequest}
      className="px-6 py-3 bg-vibe-600 hover:bg-vibe-700 rounded-lg font-medium transition-colors"
    >
      Register as Educator
    </button>
  );
}
