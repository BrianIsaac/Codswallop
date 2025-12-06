'use client';

import {
  Zap,
  BarChart3,
  ClipboardPaste,
  Smile,
  Users,
  RefreshCw
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from './motion-wrapper';

export function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Line Spike Detection',
      description: 'Detects when code is added faster than humanly possible, flagging potential AI generation or copy-paste.',
    },
    {
      icon: BarChart3,
      title: 'Complexity Analysis',
      description: 'Monitors cyclomatic complexity to identify suddenly complex code that may not be understood.',
    },
    {
      icon: ClipboardPaste,
      title: 'Paste Monitoring',
      description: 'Catches large code pastes that bypass the learning process of typing and thinking.',
    },
    {
      icon: Smile,
      title: 'Animated Vibe Character',
      description: 'Friendly visual feedback shows current coding behaviour and alerts when patterns seem suspicious.',
    },
    {
      icon: Users,
      title: 'Teacher Dashboard',
      description: 'Real-time classroom monitoring with student progress, comprehension scores, and pattern analytics.',
    },
    {
      icon: RefreshCw,
      title: 'Real-time Sync',
      description: 'Quiz results and activity data sync instantly between the extension and teacher dashboard.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to ensure students actually understand their code.
          </p>
        </FadeIn>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <ScaleOnHover>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all h-full border border-transparent hover:border-vibe-200 dark:hover:border-vibe-800">
                  <div className="w-10 h-10 bg-vibe-100 dark:bg-vibe-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-vibe-600 dark:text-vibe-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </ScaleOnHover>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
