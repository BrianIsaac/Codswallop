'use client';

import { AlertTriangle, Bot, Brain, Briefcase } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from './motion-wrapper';

export function Problem() {
  const problems = [
    {
      icon: Bot,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'Surface-Level Knowledge',
      description: 'AI writes the code, you hit accept. The result works, but you cannot explain why, modify it confidently, or debug when it breaks.',
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'Fragile Foundations',
      description: 'Without understanding fundamentals, learners struggle when AI suggestions are wrong. Debugging becomes guesswork instead of systematic problem-solving.',
    },
    {
      icon: Brain,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: 'Interview Exposure',
      description: 'Technical interviews quickly reveal comprehension gaps. Explaining code you did not truly write becomes impossible under pressure.',
    },
    {
      icon: Briefcase,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'Workplace Struggles',
      description: 'Junior developers who cannot reason about code become bottlenecks. Code reviews, pair programming, and on-call rotations expose the skills gap.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The Hidden Cost of Vibe Coding
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            AI can accelerate development, but over-reliance stunts the engineering skills you need to succeed.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem) => (
            <StaggerItem key={problem.title}>
              <ScaleOnHover>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className={`w-12 h-12 ${problem.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                    <problem.icon className={`h-6 w-6 ${problem.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {problem.description}
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
