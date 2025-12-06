'use client';

import Link from 'next/link';
import { ArrowLeft, Download, LogIn, Users, Play, CheckCircle, Settings, BookOpen } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion-wrapper';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-vibe-600 dark:text-vibe-400 hover:text-vibe-700 dark:hover:text-vibe-300 mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              User Guide
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Everything you need to know to get started with Codswallop and build genuine programming skills.
            </p>
          </FadeIn>

          <div className="space-y-16">
            {/* Getting Started */}
            <FadeIn delay={0.2}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-vibe-100 dark:bg-vibe-900/30 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-vibe-600 dark:text-vibe-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Install the Extension</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Open VS Code, go to Extensions (<code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Ctrl+Shift+X</code>),
                        search for &quot;Codswallop&quot;, and click Install.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Start Coding</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        The extension activates automatically. Code as you normally would - Codswallop monitors
                        your patterns in the background.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Take Quizzes</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        When vibe patterns are detected, a &quot;Take Quiz&quot; prompt appears above your code.
                        Click it to test your understanding.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Joining a Classroom */}
            <FadeIn delay={0.3}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Joining a Classroom</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If your educator has provided a classroom code, follow these steps to join and sync your progress:
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Open Command Palette</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Press <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Ctrl+Shift+P</code> (Windows/Linux)
                        or <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Cmd+Shift+P</code> (Mac).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Login</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Type <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Codswallop: Login</code> and
                        press Enter. A browser window will open for authentication.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Join Classroom</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Open the Command Palette again and type <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Codswallop: Join Classroom</code>.
                        Enter the 6-character code from your educator.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Understanding Detection */}
            <FadeIn delay={0.4}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Play className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Understanding Detection</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Codswallop monitors three patterns that may indicate code was added without full comprehension:
                </p>

                <StaggerContainer className="grid gap-4">
                  <StaggerItem>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border-l-4 border-amber-500">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Line Spike Detection</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Triggers when more than <strong>50 lines per minute</strong> are added.
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Rapid code additions often suggest copy-paste from AI assistants or external sources.
                      </p>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border-l-4 border-purple-500">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Complexity Analysis</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Triggers when cyclomatic complexity exceeds <strong>20</strong>.
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Complex branching logic (many if/else, loops, conditions) requires deeper understanding.
                      </p>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border-l-4 border-red-500">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Paste Detection</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        Triggers when more than <strong>10 lines</strong> are pasted at once.
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Large paste operations bypass the learning process of writing code step by step.
                      </p>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </section>
            </FadeIn>

            {/* Taking Quizzes */}
            <FadeIn delay={0.5}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Taking Quizzes</h2>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    When a vibecheck is triggered, you will see a clickable <strong>&quot;Take Quiz&quot;</strong> prompt
                    appear above your code (called a CodeLens). Here is what to expect:
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                    <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                      <li className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>4 multiple-choice questions</strong> generated by Claude AI based on your specific code</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>75% pass threshold</strong> - answer 3 out of 4 correctly to pass</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Questions focus on <strong>control flow, edge cases, and behaviour</strong> - not memorisation</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Immediate feedback</strong> after each answer with explanations</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Results sync to dashboard if you have joined a classroom</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400">
                    You can also manually trigger a quiz by running <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Codswallop: Start Vibecheck</code> from
                    the Command Palette.
                  </p>
                </div>
              </section>
            </FadeIn>

            {/* Command Reference */}
            <FadeIn delay={0.6}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Command Reference</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access all commands via the Command Palette (<code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Ctrl+Shift+P</code> / <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Cmd+Shift+P</code>):
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Command</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Start Vibecheck</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Manually trigger a quiz</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Show Detections</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">View all active detections</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Show Vibe Character</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Display the animated companion</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Login</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Authenticate with your account</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Logout</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Sign out of your account</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Join Classroom</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Enter a classroom code</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Open Dashboard</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Open the educator dashboard</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Show Auth Status</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Check authentication state</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Set Anthropic API Key</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Configure personal API key</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-vibe-600 dark:text-vibe-400">Codswallop: Clear Anthropic API Key</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Remove stored API key</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </FadeIn>

            {/* Configuration */}
            <FadeIn delay={0.7}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Adjust detection thresholds in VS Code Settings (<code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Ctrl+,</code> / <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-sm">Cmd+,</code>):
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Setting</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Default</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      <tr>
                        <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-white">codswallop.enabled</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">true</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Enable/disable detection</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-white">codswallop.thresholds.lineSpike</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">50</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Lines per minute threshold</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-white">codswallop.thresholds.complexity</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">20</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Cyclomatic complexity threshold</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-white">codswallop.thresholds.pasteLines</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">10</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Pasted lines threshold</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-white">codswallop.debounceWindow</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">60000</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Cooldown (ms) before re-triggering</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </FadeIn>

            {/* For Educators */}
            <FadeIn delay={0.8}>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-vibe-100 dark:bg-vibe-900/30 rounded-lg flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-vibe-600 dark:text-vibe-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">For Educators</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Educators can create classrooms and monitor student progress through the dashboard:
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Access the Dashboard</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Visit <Link href="https://codswallop-m6n9.vercel.app" className="text-vibe-600 dark:text-vibe-400 hover:underline">codswallop-m6n9.vercel.app</Link> and
                        sign in. First-time users can register as an educator.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Create a Classroom</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Navigate to Classrooms and create a new classroom. You will receive a 6-character join code to share with students.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-vibe-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Monitor Progress</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        View real-time activity feeds, student leaderboards, vibecheck results, and identify common struggle areas.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Need Help */}
            <FadeIn delay={0.9}>
              <section className="bg-vibe-50 dark:bg-vibe-900/20 rounded-xl p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need Help?</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Found a bug or have a feature request? We would love to hear from you.
                </p>
                <Link
                  href="https://github.com/BrianIsaac/Codswallop/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-vibe-600 hover:bg-vibe-700 text-white rounded-lg font-medium transition-all hover:scale-105"
                >
                  Open an Issue on GitHub
                </Link>
              </section>
            </FadeIn>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
