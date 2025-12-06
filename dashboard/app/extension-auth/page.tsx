import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface ExtensionAuthPageProps {
  searchParams: Promise<{
    state?: string;
    callbackUri?: string;
  }>;
}

export default async function ExtensionAuthPage({
  searchParams,
}: ExtensionAuthPageProps) {
  const params = await searchParams;
  const { state, callbackUri } = params;

  // Check if user is authenticated
  const { userId, getToken } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    // Not authenticated, redirect to sign-in with return URL
    const returnUrl = `/extension-auth?${new URLSearchParams({
      state: state || '',
      callbackUri: callbackUri || '',
    }).toString()}`;

    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
  }

  // Get the JWT token from Clerk
  const token = await getToken({ template: 'convex' });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-400">
            Failed to generate authentication token. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (!callbackUri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Request</h1>
          <p className="text-gray-400">Missing callback URI parameter.</p>
        </div>
      </div>
    );
  }

  // Build the callback URL with auth data
  const callbackUrl = new URL(decodeURIComponent(callbackUri));
  callbackUrl.searchParams.set('state', state || '');
  callbackUrl.searchParams.set('token', token);
  callbackUrl.searchParams.set('userId', userId);
  callbackUrl.searchParams.set(
    'email',
    user.emailAddresses[0]?.emailAddress || ''
  );

  // Redirect back to VS Code
  redirect(callbackUrl.toString());
}
