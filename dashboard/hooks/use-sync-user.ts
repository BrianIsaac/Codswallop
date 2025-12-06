'use client';

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';

export function useSyncUser() {
  const { isSignedIn, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncUser().catch(console.error);
    }
  }, [isLoaded, isSignedIn, syncUser]);
}
