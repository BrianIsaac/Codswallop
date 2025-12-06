'use client';

import { motion } from 'framer-motion';

interface TechLogo {
  name: string;
  icon: React.ReactNode;
}

function ClerkLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zm0 2.25a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" />
    </svg>
  );
}

function ConvexLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    </svg>
  );
}

function VercelLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M24 22.525H0l12-21.05 12 21.05z" />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2l2.5 7h7.5l-6 4.5 2.3 7.5L12 16l-6.3 5 2.3-7.5-6-4.5h7.5L12 2z" />
    </svg>
  );
}

function VSCodeLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
    </svg>
  );
}

const techLogos: TechLogo[] = [
  { name: 'Clerk', icon: <ClerkLogo /> },
  { name: 'Convex', icon: <ConvexLogo /> },
  { name: 'Vercel', icon: <VercelLogo /> },
  { name: 'Claude AI', icon: <AnthropicLogo /> },
  { name: 'VS Code', icon: <VSCodeLogo /> },
];

export function LogoMarquee() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider">
          Powered by modern technologies
        </p>

        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 dark:from-gray-900/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 dark:from-gray-900/50 to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-16 pr-16"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                duration: 25,
                ease: 'linear',
                repeat: Infinity,
              }}
            >
              {/* Duplicate logos for seamless loop */}
              {[...techLogos, ...techLogos].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-vibe-600 dark:hover:text-vibe-400 transition-colors shrink-0"
                >
                  <span className="opacity-70">{logo.icon}</span>
                  <span className="font-medium text-lg whitespace-nowrap">{logo.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
