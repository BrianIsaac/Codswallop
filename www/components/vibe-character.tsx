'use client';

import { motion } from 'framer-motion';

interface VibeCharacterProps {
  className?: string;
  size?: number;
}

export function VibeCharacter({ className = '', size = 200 }: VibeCharacterProps) {
  const scale = size / 150;

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        width={150 * scale}
        height={150 * scale}
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6366F1" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow aura */}
        <motion.ellipse
          cx="75"
          cy="85"
          rx="60"
          ry="55"
          fill="#A78BFA"
          opacity="0.2"
          filter="url(#glow)"
          animate={{ rx: [60, 63, 60], ry: [55, 58, 55] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main blob body */}
        <motion.path
          d="M 75 35 C 110 35 130 60 130 90 C 130 120 105 135 75 135 C 45 135 20 120 20 90 C 20 60 40 35 75 35"
          fill="url(#bodyGradient)"
          filter="url(#glow)"
          animate={{
            d: [
              'M 75 35 C 110 35 130 60 130 90 C 130 120 105 135 75 135 C 45 135 20 120 20 90 C 20 60 40 35 75 35',
              'M 75 33 C 112 33 132 58 132 88 C 132 118 107 137 75 137 C 43 137 18 118 18 88 C 18 58 38 33 75 33',
              'M 75 35 C 110 35 130 60 130 90 C 130 120 105 135 75 135 C 45 135 20 120 20 90 C 20 60 40 35 75 35',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top hat - brim */}
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="#1a1744" />

        {/* Top hat - crown */}
        <rect x="58" y="-2" width="34" height="34" rx="2" fill="#1a1744" stroke="#6366F1" strokeWidth="1" />

        {/* Hat band */}
        <rect x="58" y="26" width="34" height="4" fill="#10B981" opacity="0.8" />

        {/* Left eye */}
        <ellipse cx="60" cy="75" rx="8" ry="12" fill="#C7D2FE">
          <animate attributeName="ry" values="12;2;12" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="60" cy="75" rx="4" ry="6" fill="#1a1744">
          <animate attributeName="ry" values="6;1;6" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <circle cx="58" cy="72" r="2" fill="white" opacity="0.8" />

        {/* Right eye */}
        <ellipse cx="90" cy="75" rx="8" ry="12" fill="#C7D2FE">
          <animate attributeName="ry" values="12;2;12" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="90" cy="75" rx="4" ry="6" fill="#1a1744">
          <animate attributeName="ry" values="6;1;6" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <circle cx="88" cy="72" r="2" fill="white" opacity="0.8" />

        {/* Friendly smile */}
        <path
          d="M 60 95 Q 75 108 90 95"
          stroke="#1a1744"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Sparkle decorations */}
        <motion.g
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 125 45 L 127 50 L 132 50 L 128 53 L 130 58 L 125 55 L 120 58 L 122 53 L 118 50 L 123 50 Z" fill="#F59E0B" />
        </motion.g>
        <motion.g
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 0.8, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <path d="M 25 60 L 26 63 L 29 63 L 27 65 L 28 68 L 25 66 L 22 68 L 23 65 L 21 63 L 24 63 Z" fill="#F59E0B" opacity="0.7" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
