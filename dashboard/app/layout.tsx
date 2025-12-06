import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/convex-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Codswallop Dashboard',
  description: 'Teacher dashboard for monitoring student vibecheck progress',
};

/**
 * Root layout for the Codswallop dashboard application.
 *
 * Args:
 *     children: Child components to render within the layout.
 *
 * Returns:
 *     The HTML document with Convex provider wrapping children.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
