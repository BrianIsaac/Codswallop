'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from './motion-wrapper';
import { VibeCharacter } from './vibe-character';

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vibe-600 via-vibe-700 to-vibe-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-vibe-400 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn direction="left">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to build real engineering skills?
              </h2>
              <p className="text-xl text-vibe-100 mb-8 max-w-xl">
                Stop letting AI do your thinking. Start understanding the code you write and prepare for interviews, code reviews, and your engineering career.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="https://marketplace.visualstudio.com/items?itemName=codswallop.codswallop"
                  className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-gray-100 text-vibe-700 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-xl"
                >
                  Get the Extension
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="https://codswallop-m6n9.vercel.app/"
                  className="w-full sm:w-auto px-8 py-3 border-2 border-white text-white hover:bg-white/10 rounded-lg font-medium transition-all hover:scale-105"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.2}>
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-150" />
                <VibeCharacter size={200} className="relative z-10" />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
