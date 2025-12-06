'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface Props {
  children: ReactNode;
}

/**
 * Provides the Convex client to the application.
 *
 * Args:
 *     children: Child components to wrap with the provider.
 *
 * Returns:
 *     The wrapped children with Convex context.
 */
export function ConvexClientProvider({ children }: Props): ReactNode {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
