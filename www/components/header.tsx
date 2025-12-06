'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800"
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-vibe-600 dark:text-vibe-400 hover:text-vibe-700 dark:hover:text-vibe-300 transition-colors">
            Codswallop
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/BrianIsaac/Codswallop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://marketplace.visualstudio.com/items?itemName=codswallop.codswallop"
              className="px-4 py-2 bg-vibe-600 hover:bg-vibe-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md shadow-vibe-600/25"
            >
              Get Extension
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
