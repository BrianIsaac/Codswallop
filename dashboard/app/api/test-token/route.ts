import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Temporary test endpoint to get a Clerk JWT token
// DELETE THIS FILE AFTER TESTING
export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Not authenticated. Please sign in at /sign-in first.' },
      { status: 401 }
    );
  }

  const token = await getToken({ template: 'convex' });

  return NextResponse.json({
    userId,
    token,
  });
}
