'use client';

import { AlertTriangle, Bot, Brain } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from './motion-wrapper';

export function Problem() {
  const problems = [
    {
      icon: Bot,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'AI Does the Thinking',
      description: 'Tools like Copilot and ChatGPT generate complete solutions. Students accept them without reading or understanding.',
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'Copy-Paste Culture',
      description: 'Stack Overflow answers and AI suggestions become muscle memory. Debugging skills atrophy when code "just works".',
    },
    {
      icon: Brain,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: 'Knowledge Gaps',
      description: 'Students graduate with impressive portfolios but struggle in interviews when asked to explain their own code.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The Problem with AI-Assisted Coding
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Students are passing courses without understanding their code.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-3 gap-8">
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
