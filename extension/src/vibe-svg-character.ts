/**
 * SVG character generators for the Vibe animated agent.
 *
 * Vibe is a detective-style cosmic blob companion that lives in a VSCode
 * webview panel. This module provides SVG generators for each character state.
 */

/**
 * Colour palette for the Vibe character.
 */
export interface VibeColours {
  primary: string;
  secondary: string;
  tertiary: string;
  glow: string;
  dark: string;
  accent: string;
  sparkle: string;
  danger: string;
}

/**
 * Default Codswallop detective theme colours.
 */
export const vibeColours: VibeColours = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  tertiary: '#C7D2FE',
  glow: '#A78BFA',
  dark: '#312E81',
  accent: '#10B981',
  sparkle: '#F59E0B',
  danger: '#EF4444',
};

/**
 * Pointing directions for the character.
 */
export type PointingDirection = 'left' | 'right' | 'down';

/**
 * Generates the idle state SVG.
 * Default floating detective blob with subtle animations.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for idle state
 */
export function generateIdleVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="blobGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Outer aura -->
      <ellipse cx="75" cy="75" rx="60" ry="58" fill="${colours.glow}" opacity="0.2" filter="url(#glow)">
        <animate attributeName="rx" values="60;63;60" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="58;61;58" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Top hat -->
      <g id="top-hat">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob body -->
      <path d="M 75 35
               C 105 35, 125 55, 120 85
               S 105 125, 75 125
               S 30 115, 30 85
               S 45 35, 75 35 Z"
            fill="url(#blobGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.9">
        <animate attributeName="d"
                 values="M 75 35 C 105 35, 125 55, 120 85 S 105 125, 75 125 S 30 115, 30 85 S 45 35, 75 35 Z;
                         M 75 40 C 100 38, 118 58, 115 85 S 100 120, 75 122 S 35 110, 32 85 S 50 42, 75 40 Z;
                         M 75 35 C 105 35, 125 55, 120 85 S 105 125, 75 125 S 30 115, 30 85 S 45 35, 75 35 Z"
                 dur="8s"
                 repeatCount="indefinite"/>
      </path>

      <!-- Eyes -->
      <g id="eyes">
        <ellipse cx="60" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8">
          <animate attributeName="ry" values="12;12;2;12;12" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="90" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8">
          <animate attributeName="ry" values="12;12;2;12;12" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="62" cy="72" r="2" fill="${colours.tertiary}" opacity="0.9"/>
        <circle cx="92" cy="72" r="2" fill="${colours.tertiary}" opacity="0.9"/>
      </g>

      <!-- Subtle levitation -->
      <animateTransform attributeName="transform" type="translate"
                        values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite"/>
    </svg>
  `;
}

/**
 * Generates the watching state SVG.
 * Eyes follow code with alert posture.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for watching state
 */
export function generateWatchingVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="watchGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Outer aura -->
      <ellipse cx="75" cy="75" rx="60" ry="58" fill="${colours.glow}" opacity="0.25">
        <animate attributeName="rx" values="60;62;60" dur="2s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Top hat -->
      <g id="top-hat">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob body -->
      <path d="M 75 35
               C 105 35, 125 55, 120 85
               S 105 125, 75 125
               S 30 115, 30 85
               S 45 35, 75 35 Z"
            fill="url(#watchGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.9">
      </path>

      <!-- Wide alert eyes -->
      <g id="eyes">
        <ellipse cx="60" cy="75" rx="9" ry="14" fill="${colours.dark}" opacity="0.8"/>
        <ellipse cx="90" cy="75" rx="9" ry="14" fill="${colours.dark}" opacity="0.8"/>
        <circle cx="63" cy="73" r="3" fill="${colours.tertiary}" opacity="0.9">
          <animate attributeName="cx" values="63;65;63;61;63" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="93" cy="73" r="3" fill="${colours.tertiary}" opacity="0.9">
          <animate attributeName="cx" values="93;95;93;91;93" dur="3s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Subtle levitation -->
      <animateTransform attributeName="transform" type="translate"
                        values="0,0; 0,-2; 0,0" dur="2s" repeatCount="indefinite"/>
    </svg>
  `;
}

/**
 * Generates the detecting state SVG.
 * Suspicious code found - magnifying glass and squinting eyes.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for detecting state
 */
export function generateDetectingVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="detectGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.sparkle};stop-opacity:0.7" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
        <filter id="alertGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Alert aura (pulsing amber) -->
      <circle cx="75" cy="75" r="65" fill="none" stroke="${colours.sparkle}" stroke-width="3" opacity="0.5">
        <animate attributeName="r" values="65;72;65" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Top hat -->
      <g id="top-hat">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band (alert colour) -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.sparkle}" opacity="0.8"/>
      </g>

      <!-- Main blob (alert posture) -->
      <path d="M 75 35
               C 100 35, 118 55, 115 85
               S 100 120, 75 120
               S 35 110, 35 85
               S 50 35, 75 35 Z"
            fill="url(#detectGrad)"
            stroke="${colours.dark}"
            stroke-width="2">
        <animate attributeName="d"
                 values="M 75 35 C 100 35, 118 55, 115 85 S 100 120, 75 120 S 35 110, 35 85 S 50 35, 75 35 Z;
                         M 75 33 C 102 33, 120 54, 117 85 S 102 118, 75 118 S 33 108, 33 85 S 48 33, 75 33 Z;
                         M 75 35 C 100 35, 118 55, 115 85 S 100 120, 75 120 S 35 110, 35 85 S 50 35, 75 35 Z"
                 dur="1.5s"
                 repeatCount="indefinite"/>
      </path>

      <!-- Suspicious squinting eyes -->
      <g id="suspicious-eyes">
        <path d="M 52 75 Q 60 70 68 75" stroke="${colours.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 82 75 Q 90 70 98 75" stroke="${colours.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Magnifying glass -->
      <g id="magnifying-glass" transform="translate(125, 70)" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze"/>

        <!-- Glass circle -->
        <circle cx="0" cy="0" r="20" fill="none" stroke="${colours.dark}" stroke-width="3"/>
        <circle cx="0" cy="0" r="18" fill="${colours.tertiary}" opacity="0.3"/>

        <!-- Handle -->
        <rect x="15" y="15" width="6" height="25" rx="2" fill="${colours.dark}"
              transform="rotate(45 15 15)"/>

        <!-- Gleam on glass -->
        <path d="M -8 -12 Q -4 -14, 0 -12" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>

        <!-- Search animation -->
        <animateTransform attributeName="transform"
                          type="translate"
                          values="125,70; 130,65; 125,70; 120,75; 125,70"
                          dur="2s"
                          repeatCount="indefinite"/>
      </g>

      <!-- Alert exclamation marks -->
      <g opacity="0.8">
        <text x="40" y="50" font-size="16" fill="${colours.sparkle}" font-weight="bold">!</text>
        <text x="110" y="45" font-size="12" fill="${colours.danger}" font-weight="bold">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite"/>
          !
        </text>
      </g>
    </svg>
  `;
}

/**
 * Generates the questioning state SVG.
 * During vibecheck quiz - thoughtful with floating question marks.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for questioning state
 */
export function generateQuestioningVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="questionGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:0.8" />
          <stop offset="60%" style="stop-color:${colours.secondary};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Thinking aura -->
      <circle cx="75" cy="75" r="62" fill="none" stroke="${colours.glow}" stroke-width="2" opacity="0.3">
        <animate attributeName="r" values="62;68;62" dur="2.5s" repeatCount="indefinite"/>
      </circle>

      <!-- Top hat tilted (thinking pose) -->
      <g id="top-hat" transform="rotate(-5 75 30)">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob -->
      <path d="M 75 40
               C 98 40, 112 58, 110 85
               S 98 115, 75 115
               S 40 105, 40 85
               S 52 40, 75 40 Z"
            fill="url(#questionGrad)"
            stroke="${colours.dark}"
            stroke-width="2">
        <animate attributeName="d"
                 values="M 75 40 C 98 40, 112 58, 110 85 S 98 115, 75 115 S 40 105, 40 85 S 52 40, 75 40 Z;
                         M 75 42 C 96 41, 110 59, 108 85 S 96 113, 75 114 S 42 103, 42 85 S 54 42, 75 42 Z;
                         M 75 40 C 98 40, 112 58, 110 85 S 98 115, 75 115 S 40 105, 40 85 S 52 40, 75 40 Z"
                 dur="4s"
                 repeatCount="indefinite"/>
      </path>

      <!-- Curious wide eyes -->
      <g id="curious-eyes">
        <ellipse cx="60" cy="75" rx="10" ry="13" fill="${colours.dark}">
          <animate attributeName="ry" values="13;14;13" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="90" cy="75" rx="10" ry="13" fill="${colours.dark}">
          <animate attributeName="ry" values="13;14;13" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="63" cy="72" r="3" fill="${colours.tertiary}"/>
        <circle cx="93" cy="72" r="3" fill="${colours.tertiary}"/>
      </g>

      <!-- Floating question marks -->
      <g class="question-marks" opacity="0.7">
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colours.accent}">
          <tspan x="110" y="45" font-size="20" opacity="0">
            ?
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y" values="50;30;20" dur="3s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colours.secondary}">
          <tspan x="25" y="55" font-size="14" opacity="0">
            ?
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="y" values="60;40;30" dur="3s" begin="1s" repeatCount="indefinite"/>
          </tspan>
        </text>
      </g>

      <!-- Clipboard/checklist -->
      <g id="clipboard" transform="translate(115, 90)" opacity="0.8">
        <rect x="-10" y="-15" width="20" height="28" rx="2" fill="${colours.dark}" opacity="0.3"/>
        <rect x="-8" y="-12" width="16" height="22" fill="white" opacity="0.9"/>
        <line x1="-5" y1="-6" x2="5" y2="-6" stroke="${colours.accent}" stroke-width="2"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="${colours.dark}" stroke-width="1" opacity="0.3"/>
        <line x1="-5" y1="4" x2="5" y2="4" stroke="${colours.dark}" stroke-width="1" opacity="0.3"/>
      </g>
    </svg>
  `;
}

/**
 * Generates the celebrating state SVG.
 * Student passed vibecheck - party mode with confetti and star eyes.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for celebrating state
 */
export function generateCelebratingVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="celebrateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colours.accent};stop-opacity:1">
            <animate attributeName="stop-color" values="${colours.accent};${colours.tertiary};${colours.accent}" dur="2s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1"/>
        </linearGradient>
      </defs>

      <!-- Success burst -->
      <circle cx="75" cy="75" r="70" fill="${colours.accent}" opacity="0.15">
        <animate attributeName="r" values="60;75;60" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Confetti -->
      <g opacity="0.9">
        <rect x="20" y="10" width="4" height="8" fill="${colours.accent}" transform="rotate(25 22 14)">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2s" repeatCount="indefinite"/>
        </rect>
        <circle cx="110" cy="20" r="3" fill="${colours.sparkle}">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2.3s" repeatCount="indefinite"/>
        </circle>
        <path d="M 60 5 L 63 8 L 60 11 L 57 8 Z" fill="${colours.glow}">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="1.8s" repeatCount="indefinite"/>
        </path>
        <rect x="90" y="15" width="3" height="6" fill="${colours.danger}" transform="rotate(-30 91.5 18)">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2.1s" repeatCount="indefinite"/>
        </rect>
      </g>

      <!-- Top hat flying up with joy -->
      <g id="top-hat">
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 0,-8; 0,0; 0,-5; 0,0" dur="1s" repeatCount="indefinite"/>
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band (celebration colour) -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}"/>
      </g>

      <!-- Main blob (bouncing) -->
      <g>
        <path d="M 75 30
                 C 110 30, 130 55, 125 85
                 S 110 130, 75 130
                 S 25 115, 25 85
                 S 40 30, 75 30 Z"
              fill="url(#celebrateGrad)"
              stroke="${colours.dark}"
              stroke-width="2">
          <animate attributeName="d"
                   values="M 75 30 C 110 30, 130 55, 125 85 S 110 130, 75 130 S 25 115, 25 85 S 40 30, 75 30 Z;
                           M 70 32 C 108 28, 132 57, 127 87 S 112 128, 77 132 S 23 117, 23 83 S 38 32, 70 32 Z;
                           M 75 30 C 110 30, 130 55, 125 85 S 110 130, 75 130 S 25 115, 25 85 S 40 30, 75 30 Z"
                   dur="0.8s"
                   repeatCount="indefinite"/>
        </path>

        <!-- Star eyes -->
        <g id="star-eyes">
          <g transform="translate(60, 75)">
            <path d="M 0,-8 L 2,-2 L 8,-1 L 2,1 L 0,8 L -2,1 L -8,-1 L -2,-2 Z"
                  fill="${colours.sparkle}" stroke="${colours.dark}" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite"/>
            </path>
          </g>
          <g transform="translate(90, 75)">
            <path d="M 0,-8 L 2,-2 L 8,-1 L 2,1 L 0,8 L -2,1 L -8,-1 L -2,-2 Z"
                  fill="${colours.sparkle}" stroke="${colours.dark}" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="2s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>

        <!-- Big smile -->
        <path d="M 55 90 Q 75 105 95 90" stroke="${colours.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Bounce animation -->
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 0,-8; 0,0; 0,-5; 0,0" dur="1s" repeatCount="indefinite"/>
      </g>

      <!-- Checkmark badge -->
      <g transform="translate(115, 110)">
        <circle cx="0" cy="0" r="12" fill="${colours.accent}"/>
        <path d="M -5 0 L -2 4 L 6 -4" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

/**
 * Generates the concerned state SVG.
 * Student failed/skipped vibecheck - sympathetic and encouraging.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for concerned state
 */
export function generateConcernedVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="concernGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:0.7" />
          <stop offset="60%" style="stop-color:${colours.secondary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:0.9" />
        </radialGradient>
      </defs>

      <!-- Subdued aura -->
      <circle cx="75" cy="75" r="60" fill="none" stroke="${colours.danger}" stroke-width="1" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.1;0.2" dur="3s" repeatCount="indefinite"/>
      </circle>

      <!-- Top hat drooping -->
      <g id="top-hat" transform="rotate(8 75 30)">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}" opacity="0.8"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1" opacity="0.8"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}" opacity="0.8"/>
        <!-- Hat band (subdued) -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.secondary}" opacity="0.5"/>
      </g>

      <!-- Main blob (slightly deflated) -->
      <path d="M 75 40
               C 95 40, 110 58, 108 85
               S 95 118, 75 120
               S 40 110, 40 85
               S 55 40, 75 40 Z"
            fill="url(#concernGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.85">
        <animate attributeName="d"
                 values="M 75 40 C 95 40, 110 58, 108 85 S 95 118, 75 120 S 40 110, 40 85 S 55 40, 75 40 Z;
                         M 75 42 C 93 41, 108 59, 106 85 S 93 116, 75 118 S 42 108, 42 85 S 57 42, 75 42 Z;
                         M 75 40 C 95 40, 110 58, 108 85 S 95 118, 75 120 S 40 110, 40 85 S 55 40, 75 40 Z"
                 dur="5s"
                 repeatCount="indefinite"/>
      </path>

      <!-- Worried eyes (upturned eyebrows) -->
      <g id="worried-eyes">
        <!-- Eyebrows -->
        <path d="M 52 65 L 68 60" stroke="${colours.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 82 60 L 98 65" stroke="${colours.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- Eyes -->
        <ellipse cx="60" cy="75" rx="7" ry="10" fill="${colours.dark}" opacity="0.8"/>
        <ellipse cx="90" cy="75" rx="7" ry="10" fill="${colours.dark}" opacity="0.8"/>
        <circle cx="61" cy="73" r="2" fill="${colours.tertiary}"/>
        <circle cx="91" cy="73" r="2" fill="${colours.tertiary}"/>
      </g>

      <!-- Worried mouth -->
      <path d="M 60 95 Q 75 88 90 95" stroke="${colours.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>

      <!-- Encouraging sparkle -->
      <circle cx="35" cy="50" r="2" fill="${colours.sparkle}" opacity="0.5">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}

/**
 * Generates the sleeping state SVG.
 * Zzz floating, dimmed appearance after 30s inactivity.
 *
 * @param colours - The colour palette to use
 * @returns SVG string for sleeping state
 */
export function generateSleepingVibe(colours: VibeColours = vibeColours): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sleepGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:0.5" />
          <stop offset="60%" style="stop-color:${colours.secondary};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:0.7" />
        </radialGradient>
      </defs>

      <!-- Dimmed aura -->
      <circle cx="75" cy="75" r="65" fill="none" stroke="${colours.glow}" stroke-width="2" opacity="0.15">
        <animate attributeName="opacity" values="0.15;0.08;0.15" dur="4s" repeatCount="indefinite"/>
      </circle>

      <!-- Top hat askew (sleeping) -->
      <g id="top-hat" transform="rotate(15 75 30) translate(5, 5)">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}" opacity="0.6"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1" opacity="0.6"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}" opacity="0.6"/>
        <!-- Hat band (dimmed) -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.secondary}" opacity="0.4"/>
      </g>

      <!-- Main blob (breathing animation) -->
      <path d="M 75 45
               C 98 45, 115 62, 112 88
               S 98 120, 75 120
               S 38 112, 38 88
               S 52 45, 75 45 Z"
            fill="url(#sleepGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.75">
        <animate attributeName="d"
                 values="M 75 45 C 98 45, 115 62, 112 88 S 98 120, 75 120 S 38 112, 38 88 S 52 45, 75 45 Z;
                         M 75 47 C 96 47, 113 63, 110 88 S 96 118, 75 118 S 40 110, 40 88 S 54 47, 75 47 Z;
                         M 75 45 C 98 45, 115 62, 112 88 S 98 120, 75 120 S 38 112, 38 88 S 52 45, 75 45 Z"
                 dur="4s"
                 repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.75;0.65;0.75" dur="4s" repeatCount="indefinite"/>
      </path>

      <!-- Closed sleeping eyes -->
      <g id="sleeping-eyes">
        <path d="M 52 80 L 68 80" stroke="${colours.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
        <path d="M 82 80 L 98 80" stroke="${colours.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
      </g>

      <!-- Peaceful smile -->
      <path d="M 65 92 Q 75 98 85 92" stroke="${colours.dark}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>

      <!-- Floating Zzz -->
      <g class="zzz-group">
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colours.glow}">
          <tspan x="105" y="50" font-size="16" opacity="0">
            Z
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y" values="55;35;25" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="x" values="105;115;120" dur="3s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colours.secondary}">
          <tspan x="112" y="60" font-size="12" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="y" values="65;45;35" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="x" values="112;122;130" dur="3s" begin="1s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colours.accent}">
          <tspan x="118" y="68" font-size="9" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.5;0.5;0" dur="3s" begin="2s" repeatCount="indefinite"/>
            <animate attributeName="y" values="73;53;43" dur="3s" begin="2s" repeatCount="indefinite"/>
            <animate attributeName="x" values="118;130;140" dur="3s" begin="2s" repeatCount="indefinite"/>
          </tspan>
        </text>
      </g>
    </svg>
  `;
}

/**
 * Generates a pointing state SVG.
 * Character points in specified direction (left, right, or down).
 *
 * @param direction - The direction to point
 * @param colours - The colour palette to use
 * @returns SVG string for pointing state
 */
export function generatePointingVibe(
  direction: PointingDirection,
  colours: VibeColours = vibeColours
): string {
  switch (direction) {
    case 'right':
      return generatePointingRightVibe(colours);
    case 'left':
      return generatePointingLeftVibe(colours);
    case 'down':
      return generatePointingDownVibe(colours);
  }
}

/**
 * Generates pointing right state SVG.
 * Eyes look right, small blob extension on right side.
 */
function generatePointingRightVibe(colours: VibeColours): string {
  return `
    <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pointGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Outer aura -->
      <ellipse cx="75" cy="75" rx="60" ry="58" fill="${colours.glow}" opacity="0.2"/>

      <!-- Top hat -->
      <g id="top-hat">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob with right extension -->
      <path d="M 75 35
               C 105 35, 125 55, 120 85
               S 105 125, 75 125
               S 30 115, 30 85
               S 45 35, 75 35 Z"
            fill="url(#pointGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.9"/>

      <!-- Pointing arm -->
      <g id="pointing-arm">
        <ellipse cx="130" cy="75" rx="25" ry="12" fill="${colours.primary}" opacity="0.9">
          <animate attributeName="rx" values="25;27;25" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="155" cy="75" r="8" fill="${colours.secondary}"/>
        <path d="M 160 70 L 175 75 L 160 80" fill="${colours.dark}"/>
      </g>

      <!-- Eyes looking right -->
      <g id="eyes">
        <ellipse cx="60" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8"/>
        <ellipse cx="90" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8"/>
        <circle cx="65" cy="74" r="2" fill="${colours.tertiary}" opacity="0.9"/>
        <circle cx="95" cy="74" r="2" fill="${colours.tertiary}" opacity="0.9"/>
      </g>
    </svg>
  `;
}

/**
 * Generates pointing left state SVG.
 * Mirror of pointing right.
 */
function generatePointingLeftVibe(colours: VibeColours): string {
  return `
    <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pointLeftGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Outer aura -->
      <ellipse cx="105" cy="75" rx="60" ry="58" fill="${colours.glow}" opacity="0.2"/>

      <!-- Pointing arm (left side) -->
      <g id="pointing-arm">
        <ellipse cx="50" cy="75" rx="25" ry="12" fill="${colours.primary}" opacity="0.9">
          <animate attributeName="rx" values="25;27;25" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="25" cy="75" r="8" fill="${colours.secondary}"/>
        <path d="M 20 70 L 5 75 L 20 80" fill="${colours.dark}"/>
      </g>

      <!-- Top hat -->
      <g id="top-hat" transform="translate(30, 0)">
        <!-- Brim -->
        <ellipse cx="75" cy="32" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="8" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="6" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="26" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob -->
      <path d="M 105 35
               C 135 35, 155 55, 150 85
               S 135 125, 105 125
               S 60 115, 60 85
               S 75 35, 105 35 Z"
            fill="url(#pointLeftGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.9"/>

      <!-- Eyes looking left -->
      <g id="eyes">
        <ellipse cx="90" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8"/>
        <ellipse cx="120" cy="75" rx="8" ry="12" fill="${colours.dark}" opacity="0.8"/>
        <circle cx="87" cy="74" r="2" fill="${colours.tertiary}" opacity="0.9"/>
        <circle cx="117" cy="74" r="2" fill="${colours.tertiary}" opacity="0.9"/>
      </g>
    </svg>
  `;
}

/**
 * Generates pointing down state SVG.
 * Extended viewBox with anatomical arm pointing down.
 */
function generatePointingDownVibe(colours: VibeColours): string {
  return `
    <svg width="150" height="220" viewBox="0 0 150 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pointDownGrad" cx="50%" cy="30%">
          <stop offset="0%" style="stop-color:${colours.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colours.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colours.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Outer aura -->
      <ellipse cx="75" cy="60" rx="60" ry="55" fill="${colours.glow}" opacity="0.2"/>

      <!-- Top hat -->
      <g id="top-hat">
        <!-- Brim -->
        <ellipse cx="75" cy="22" rx="30" ry="6" fill="${colours.dark}"/>
        <!-- Crown -->
        <rect x="58" y="-2" width="34" height="24" rx="2" fill="${colours.dark}" stroke="${colours.primary}" stroke-width="1"/>
        <!-- Flat top -->
        <rect x="58" y="-4" width="34" height="4" rx="2" fill="${colours.dark}"/>
        <!-- Hat band -->
        <rect x="58" y="16" width="34" height="4" fill="${colours.accent}" opacity="0.8"/>
      </g>

      <!-- Main blob -->
      <path d="M 75 25
               C 105 25, 125 45, 120 75
               S 105 115, 75 115
               S 30 105, 30 75
               S 45 25, 75 25 Z"
            fill="url(#pointDownGrad)"
            stroke="${colours.dark}"
            stroke-width="2"
            opacity="0.9"/>

      <!-- Eyes looking down -->
      <g id="eyes">
        <ellipse cx="60" cy="65" rx="8" ry="10" fill="${colours.dark}" opacity="0.8"/>
        <ellipse cx="90" cy="65" rx="8" ry="10" fill="${colours.dark}" opacity="0.8"/>
        <circle cx="60" cy="68" r="2" fill="${colours.tertiary}" opacity="0.9"/>
        <circle cx="90" cy="68" r="2" fill="${colours.tertiary}" opacity="0.9"/>
      </g>

      <!-- Pointing arm going down -->
      <g id="pointing-arm">
        <ellipse cx="75" cy="130" rx="12" ry="25" fill="${colours.primary}" opacity="0.9">
          <animate attributeName="ry" values="25;27;25" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="75" cy="155" r="8" fill="${colours.secondary}"/>
        <path d="M 70 160 L 75 175 L 80 160" fill="${colours.dark}"/>
      </g>

      <!-- Arrow indicator -->
      <g transform="translate(75, 190)" opacity="0.7">
        <path d="M 0 0 L -10 -15 L -5 -15 L -5 -30 L 5 -30 L 5 -15 L 10 -15 Z"
              fill="${colours.accent}">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
        </path>
      </g>
    </svg>
  `;
}

/**
 * Map of state names to SVG generator functions.
 */
export const stateGenerators: Record<string, (colours?: VibeColours) => string> = {
  idle: generateIdleVibe,
  watching: generateWatchingVibe,
  detecting: generateDetectingVibe,
  questioning: generateQuestioningVibe,
  celebrating: generateCelebratingVibe,
  concerned: generateConcernedVibe,
  sleeping: generateSleepingVibe,
};

/**
 * Gets the SVG for a given state.
 *
 * @param state - The character state
 * @param direction - Optional pointing direction (for pointing state)
 * @param colours - Optional colour palette override
 * @returns SVG string for the state
 */
export function getSvgForState(
  state: string,
  direction?: PointingDirection,
  colours: VibeColours = vibeColours
): string {
  if (state === 'pointing' && direction) {
    return generatePointingVibe(direction, colours);
  }

  const generator = stateGenerators[state];
  if (generator) {
    return generator(colours);
  }

  return generateIdleVibe(colours);
}
