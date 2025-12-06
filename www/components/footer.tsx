'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { FadeIn } from './motion-wrapper';

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-vibe-600 dark:text-vibe-400">Codswallop</span>
              <span className="text-gray-600 dark:text-gray-400">
                - Detect vibe coding. Ensure understanding.
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="https://marketplace.visualstudio.com/items?itemName=codswallop.codswallop"
                className="text-gray-600 hover:text-vibe-600 dark:text-gray-400 dark:hover:text-vibe-400 text-sm transition-colors"
              >
                VS Code Extension
              </Link>
              <Link
                href="https://codswallop-m6n9.vercel.app/"
                className="text-gray-600 hover:text-vibe-600 dark:text-gray-400 dark:hover:text-vibe-400 text-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="https://github.com/BrianIsaac/Codswallop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-vibe-600 dark:text-gray-400 dark:hover:text-vibe-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Copyright 2025 Brian Isaac. All Rights Reserved.</p>
          </div>
        </FadeIn>
      </div>
    </footer>
  );
}
