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
      description: 'Identifies rapid code additions that suggest copy-paste from AI or external sources, prompting you to verify understanding.',
    },
    {
      icon: BarChart3,
      title: 'Complexity Analysis',
      description: 'Monitors cyclomatic complexity to catch when complex logic appears suddenly. Understanding branching and loops is essential.',
    },
    {
      icon: ClipboardPaste,
      title: 'Paste Monitoring',
      description: 'Large paste operations trigger comprehension checks. Typing code helps retention; pasting requires verification.',
    },
    {
      icon: Smile,
      title: 'Animated Companion',
      description: 'A friendly detective character provides visual feedback on your coding, celebrating when you pass quizzes and encouraging practice when needed.',
    },
    {
      icon: Users,
      title: 'Educator Dashboard',
      description: 'Educators can monitor progress across classrooms, identify common struggle areas, and provide targeted support to learners.',
    },
    {
      icon: RefreshCw,
      title: 'Progress Tracking',
      description: 'Quiz results sync in real-time. Track your improvement over time and see which concepts need more attention.',
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
            Tools designed to build comprehension, not just detect gaps.
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
