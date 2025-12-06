'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { VibeCharacter } from './vibe-character';

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vibe-100 dark:bg-vibe-900/30 text-vibe-700 dark:text-vibe-400 text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span>For educators fighting AI-assisted plagiarism</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Stop Vibe Coding.
              <br />
              <span className="text-vibe-600 dark:text-vibe-400">Start Understanding.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-xl"
            >
              Codswallop detects when students blindly accept AI-generated code and
              prompts them with comprehension quizzes to ensure genuine learning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="#"
                className="w-full sm:w-auto px-8 py-3 bg-vibe-600 hover:bg-vibe-700 text-white rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-vibe-600/25"
              >
                Install Extension
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://app.codswallop.dev"
                className="w-full sm:w-auto px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-all hover:scale-105"
              >
                Teacher Dashboard
              </Link>
            </motion.div>
          </div>

          {/* Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 100 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow effect behind character */}
              <div className="absolute inset-0 bg-vibe-500/20 rounded-full blur-3xl scale-150" />
              <VibeCharacter size={300} className="relative z-10 animate-pulse-glow" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
