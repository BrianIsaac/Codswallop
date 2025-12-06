import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">Codswallop</h1>
      <p className="text-xl text-gray-400 mb-8">
        Detect vibe coding. Ensure understanding.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="px-6 py-3 bg-vibe-600 hover:bg-vibe-700 rounded-lg font-medium transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
