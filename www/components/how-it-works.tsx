'use client';

import { Eye, HelpCircle, CheckCircle } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion-wrapper';

export function HowItWorks() {
  const steps = [
    {
      icon: Eye,
      title: 'Detect',
      description: 'Codswallop monitors coding patterns in real-time: line spikes, complexity surges, and large paste events.',
    },
    {
      icon: HelpCircle,
      title: 'Quiz',
      description: 'When suspicious activity is detected, Claude AI generates contextual multiple-choice questions about the code.',
    },
    {
      icon: CheckCircle,
      title: 'Verify',
      description: 'Students demonstrate understanding. Results sync to the teacher dashboard for classroom-wide monitoring.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How Codswallop Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Three simple steps to ensure genuine comprehension.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
          {steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-vibe-100 dark:bg-vibe-900/30 rounded-full flex items-center justify-center mb-4 relative">
                    <step.icon className="h-8 w-8 text-vibe-600 dark:text-vibe-400" />
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-vibe-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-vibe-300 to-vibe-200 dark:from-vibe-700 dark:to-vibe-800" />
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
