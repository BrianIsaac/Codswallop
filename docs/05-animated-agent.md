# Codswallop Animated Agent: "Vibe" the Detective Blob

## Overview

Codswallop features an animated mascot called **"Vibe"** - a detective-style cosmic blob companion that lives in a VSCode webview panel. Vibe monitors coding activity, detects potential vibe coding, and guides students through vibechecks with expressive animations.

The design is adapted from the Living IDE "Codey" character, using the same SVG-based animation system with a new colour palette and detective-themed states.

```
+------------------------------------------------------------------------+
|                         VIBE CHARACTER SYSTEM                           |
+------------------------------------------------------------------------+
|                                                                         |
|                          +-------------+                                |
|                          |   WebView   |                                |
|                          |   Panel     |                                |
|                          +------+------+                                |
|                                 |                                       |
|                    +------------+------------+                          |
|                    |                         |                          |
|              +-----+-----+            +------+------+                   |
|              |   State   |            |    SVG      |                   |
|              |  Machine  |            |  Generator  |                   |
|              +-----+-----+            +------+------+                   |
|                    |                         |                          |
|         +----------+-----------+    +--------+--------+                 |
|         |          |           |    |        |        |                 |
|      Events    Transitions   States  Idle  Detect  Point               |
|                                                                         |
+------------------------------------------------------------------------+
```

## Character Design

### Visual Identity

Vibe is a cosmic blob with detective-themed elements:

```
        Detective Hat
           /\
          /  \
         /____\
        +------+
       /  O  O  \     <-- Wide curious eyes
      |   ____   |    <-- Body morphs organically
       \        /
        +------+
           ||
      Magnifying glass (when detecting)
```

### Colour Palette

Aligned with the main UI colour palette from `02-uiux-wireframes.md`:

```typescript
// Codswallop detective theme colours (aligned with UI palette)
const vibeColors: CharacterColors = {
  primary: '#6366F1',    // Indigo (main body) - matches UI PRIMARY
  secondary: '#8B5CF6',  // Violet - matches UI SECONDARY
  tertiary: '#C7D2FE',   // Very light indigo (internal highlight)
  glow: '#A78BFA',       // Purple glow (character effect)
  dark: '#312E81',       // Dark indigo shadow
  accent: '#10B981',     // Emerald - matches UI SUCCESS
  sparkle: '#F59E0B',    // Amber - matches UI WARNING
  danger: '#EF4444',     // Red - matches UI DANGER
};
```

## Character States

### State Definitions

```typescript
export type VibeState =
  | 'idle'           // Default state, gentle floating
  | 'watching'       // Monitoring code changes
  | 'detecting'      // Analysing suspicious code
  | 'questioning'    // During vibecheck quiz
  | 'celebrating'    // Student passed vibecheck
  | 'concerned'      // Student failed/skipped
  | 'sleeping'       // Inactive for 30+ seconds
  | 'pointing';      // Pointing at code/terminal

export type PointingDirection = 'left' | 'right' | 'down';
```

### State Diagram

```
                              +----------+
                              |   IDLE   |<-----------------+
                              +----+-----+                  |
                                   |                        |
                    +--------------+--------------+         |
                    |              |              |         |
                    v              v              v         |
              +---------+    +---------+    +---------+    |
              |WATCHING |    |POINTING |    |SLEEPING |    |
              +----+----+    +----+----+    +----+----+    |
                   |              |              |          |
                   v              |              |          |
              +---------+         |              |          |
              |DETECTING|<--------+              |          |
              +----+----+                        |          |
                   |                             |          |
                   v                             |          |
             +----------+                        |          |
             |QUESTIONING|                       |          |
             +----+-----+                        |          |
                  |                              |          |
         +--------+--------+                     |          |
         |                 |                     |          |
         v                 v                     |          |
   +-----------+    +-----------+               |          |
   |CELEBRATING|    | CONCERNED |               |          |
   +-----+-----+    +-----+-----+               |          |
         |                |                      |          |
         +----------------+----------------------+----------+
```

## SVG Character Implementation

### 1. Idle State

The default floating detective blob with subtle animations:

```typescript
export function generateIdleVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="blobGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colors.tertiary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1" />
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
      <ellipse cx="75" cy="75" rx="60" ry="58" fill="${colors.glow}" opacity="0.2" filter="url(#glow)">
        <animate attributeName="rx" values="60;63;60" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="58;61;58" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Detective hat -->
      <g id="detective-hat">
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}"/>
        <!-- Hat band -->
        <rect x="47" y="28" width="56" height="4" fill="${colors.accent}" opacity="0.6"/>
      </g>

      <!-- Main blob body -->
      <path d="M 75 35
               C 105 35, 125 55, 120 85
               S 105 125, 75 125
               S 30 115, 30 85
               S 45 35, 75 35 Z"
            fill="url(#blobGrad)"
            stroke="${colors.dark}"
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
        <ellipse cx="60" cy="75" rx="8" ry="12" fill="${colors.dark}" opacity="0.8">
          <animate attributeName="ry" values="12;12;2;12;12" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="90" cy="75" rx="8" ry="12" fill="${colors.dark}" opacity="0.8">
          <animate attributeName="ry" values="12;12;2;12;12" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="62" cy="72" r="2" fill="${colors.tertiary}" opacity="0.9"/>
        <circle cx="92" cy="72" r="2" fill="${colors.tertiary}" opacity="0.9"/>
      </g>

      <!-- Subtle levitation -->
      <animateTransform attributeName="transform" type="translate"
                        values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite"/>
    </svg>
  `;
}
```

### 2. Detecting State (Vibe Detected)

When suspicious code is found, Vibe pulls out a magnifying glass:

```typescript
export function generateDetectingVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="180" height="150" viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="detectGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colors.sparkle};stop-opacity:0.7" />
          <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1" />
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
      <circle cx="75" cy="75" r="65" fill="none" stroke="${colors.sparkle}" stroke-width="3" opacity="0.5">
        <animate attributeName="r" values="65;72;65" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Detective hat -->
      <g id="detective-hat">
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}"/>
        <rect x="47" y="28" width="56" height="4" fill="${colors.sparkle}" opacity="0.8"/>
      </g>

      <!-- Main blob (alert posture) -->
      <path d="M 75 35
               C 100 35, 118 55, 115 85
               S 100 120, 75 120
               S 35 110, 35 85
               S 50 35, 75 35 Z"
            fill="url(#detectGrad)"
            stroke="${colors.dark}"
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
        <path d="M 52 75 Q 60 70 68 75" stroke="${colors.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 82 75 Q 90 70 98 75" stroke="${colors.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Magnifying glass -->
      <g id="magnifying-glass" transform="translate(125, 70)" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze"/>

        <!-- Glass circle -->
        <circle cx="0" cy="0" r="20" fill="none" stroke="${colors.dark}" stroke-width="3"/>
        <circle cx="0" cy="0" r="18" fill="${colors.tertiary}" opacity="0.3"/>

        <!-- Handle -->
        <rect x="15" y="15" width="6" height="25" rx="2" fill="${colors.dark}"
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
        <text x="40" y="50" font-size="16" fill="${colors.sparkle}" font-weight="bold">!</text>
        <text x="110" y="45" font-size="12" fill="${colors.danger}" font-weight="bold">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite"/>
          !
        </text>
      </g>
    </svg>
  `;
}
```

### 3. Questioning State (During Vibecheck)

Thoughtful appearance with floating question marks:

```typescript
export function generateQuestioningVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="questionGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colors.tertiary};stop-opacity:0.8" />
          <stop offset="60%" style="stop-color:${colors.secondary};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Thinking aura -->
      <circle cx="75" cy="75" r="62" fill="none" stroke="${colors.glow}" stroke-width="2" opacity="0.3">
        <animate attributeName="r" values="62;68;62" dur="2.5s" repeatCount="indefinite"/>
      </circle>

      <!-- Detective hat tilted (thinking pose) -->
      <g id="detective-hat" transform="rotate(-5 75 30)">
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}"/>
        <rect x="47" y="28" width="56" height="4" fill="${colors.accent}" opacity="0.6"/>
      </g>

      <!-- Main blob -->
      <path d="M 75 40
               C 98 40, 112 58, 110 85
               S 98 115, 75 115
               S 40 105, 40 85
               S 52 40, 75 40 Z"
            fill="url(#questionGrad)"
            stroke="${colors.dark}"
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
        <ellipse cx="60" cy="75" rx="10" ry="13" fill="${colors.dark}">
          <animate attributeName="ry" values="13;14;13" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="90" cy="75" rx="10" ry="13" fill="${colors.dark}">
          <animate attributeName="ry" values="13;14;13" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="63" cy="72" r="3" fill="${colors.tertiary}"/>
        <circle cx="93" cy="72" r="3" fill="${colors.tertiary}"/>
      </g>

      <!-- Floating question marks -->
      <g class="question-marks" opacity="0.7">
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colors.accent}">
          <tspan x="110" y="45" font-size="20" opacity="0">
            ?
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y" values="50;30;20" dur="3s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colors.secondary}">
          <tspan x="25" y="55" font-size="14" opacity="0">
            ?
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="y" values="60;40;30" dur="3s" begin="1s" repeatCount="indefinite"/>
          </tspan>
        </text>
      </g>

      <!-- Clipboard/checklist -->
      <g id="clipboard" transform="translate(115, 90)" opacity="0.8">
        <rect x="-10" y="-15" width="20" height="28" rx="2" fill="${colors.dark}" opacity="0.3"/>
        <rect x="-8" y="-12" width="16" height="22" fill="white" opacity="0.9"/>
        <line x1="-5" y1="-6" x2="5" y2="-6" stroke="${colors.accent}" stroke-width="2"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="${colors.dark}" stroke-width="1" opacity="0.3"/>
        <line x1="-5" y1="4" x2="5" y2="4" stroke="${colors.dark}" stroke-width="1" opacity="0.3"/>
      </g>
    </svg>
  `;
}
```

### 4. Celebrating State (Passed Vibecheck)

Party mode with confetti and star eyes:

```typescript
export function generateCelebratingVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="celebrateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:1">
            <animate attributeName="stop-color" values="${colors.accent};${colors.tertiary};${colors.accent}" dur="2s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1"/>
        </linearGradient>
      </defs>

      <!-- Success burst -->
      <circle cx="75" cy="75" r="70" fill="${colors.accent}" opacity="0.15">
        <animate attributeName="r" values="60;75;60" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Confetti -->
      <g opacity="0.9">
        <rect x="20" y="10" width="4" height="8" fill="${colors.accent}" transform="rotate(25 22 14)">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2s" repeatCount="indefinite"/>
        </rect>
        <circle cx="110" cy="20" r="3" fill="${colors.sparkle}">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2.3s" repeatCount="indefinite"/>
        </circle>
        <path d="M 60 5 L 63 8 L 60 11 L 57 8 Z" fill="${colors.glow}">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="1.8s" repeatCount="indefinite"/>
        </path>
        <rect x="90" y="15" width="3" height="6" fill="${colors.danger}" transform="rotate(-30 91.5 18)">
          <animateTransform attributeName="transform" type="translate" values="0,-20; 0,160" dur="2.1s" repeatCount="indefinite"/>
        </rect>
      </g>

      <!-- Detective hat flying up with joy -->
      <g id="detective-hat">
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 0,-8; 0,0; 0,-5; 0,0" dur="1s" repeatCount="indefinite"/>
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}"/>
        <rect x="47" y="28" width="56" height="4" fill="${colors.accent}"/>
      </g>

      <!-- Main blob (bouncing) -->
      <g>
        <path d="M 75 30
                 C 110 30, 130 55, 125 85
                 S 110 130, 75 130
                 S 25 115, 25 85
                 S 40 30, 75 30 Z"
              fill="url(#celebrateGrad)"
              stroke="${colors.dark}"
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
                  fill="${colors.sparkle}" stroke="${colors.dark}" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite"/>
            </path>
          </g>
          <g transform="translate(90, 75)">
            <path d="M 0,-8 L 2,-2 L 8,-1 L 2,1 L 0,8 L -2,1 L -8,-1 L -2,-2 Z"
                  fill="${colors.sparkle}" stroke="${colors.dark}" stroke-width="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="2s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>

        <!-- Big smile -->
        <path d="M 55 90 Q 75 105 95 90" stroke="${colors.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>

        <!-- Bounce animation -->
        <animateTransform attributeName="transform" type="translate"
                          values="0,0; 0,-8; 0,0; 0,-5; 0,0" dur="1s" repeatCount="indefinite"/>
      </g>

      <!-- Checkmark badge -->
      <g transform="translate(115, 110)">
        <circle cx="0" cy="0" r="12" fill="${colors.accent}"/>
        <path d="M -5 0 L -2 4 L 6 -4" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}
```

### 5. Concerned State (Failed/Skipped)

Sympathetic appearance encouraging retry:

```typescript
export function generateConcernedVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="concernGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colors.tertiary};stop-opacity:0.7" />
          <stop offset="60%" style="stop-color:${colors.secondary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:0.9" />
        </radialGradient>
      </defs>

      <!-- Subdued aura -->
      <circle cx="75" cy="75" r="60" fill="none" stroke="${colors.danger}" stroke-width="1" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.1;0.2" dur="3s" repeatCount="indefinite"/>
      </circle>

      <!-- Detective hat drooping -->
      <g id="detective-hat" transform="rotate(8 75 30)">
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1" opacity="0.8"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}" opacity="0.8"/>
        <rect x="47" y="28" width="56" height="4" fill="${colors.secondary}" opacity="0.5"/>
      </g>

      <!-- Main blob (slightly deflated) -->
      <path d="M 75 40
               C 95 40, 110 58, 108 85
               S 95 118, 75 120
               S 40 110, 40 85
               S 55 40, 75 40 Z"
            fill="url(#concernGrad)"
            stroke="${colors.dark}"
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
        <path d="M 52 65 L 68 60" stroke="${colors.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 82 60 L 98 65" stroke="${colors.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- Eyes -->
        <ellipse cx="60" cy="75" rx="7" ry="10" fill="${colors.dark}" opacity="0.8"/>
        <ellipse cx="90" cy="75" rx="7" ry="10" fill="${colors.dark}" opacity="0.8"/>
        <circle cx="61" cy="73" r="2" fill="${colors.tertiary}"/>
        <circle cx="91" cy="73" r="2" fill="${colors.tertiary}"/>
      </g>

      <!-- Worried mouth -->
      <path d="M 60 95 Q 75 88 90 95" stroke="${colors.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>

      <!-- Encouraging hand gesture -->
      <g transform="translate(120, 100)" opacity="0.7">
        <text font-size="24">&#128170;</text> <!-- Flexed bicep emoji placeholder or path -->
      </g>

      <!-- "Try again" sparkle -->
      <circle cx="35" cy="50" r="2" fill="${colors.sparkle}" opacity="0.5">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}
```

### 6. Sleeping State

Zzz floating, dimmed appearance:

```typescript
export function generateSleepingVibe(colors: VibeColors = vibeColors): string {
  return `
    <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sleepGrad" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${colors.tertiary};stop-opacity:0.5" />
          <stop offset="60%" style="stop-color:${colors.secondary};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:0.7" />
        </radialGradient>
      </defs>

      <!-- Dimmed aura -->
      <circle cx="75" cy="75" r="65" fill="none" stroke="${colors.glow}" stroke-width="2" opacity="0.15">
        <animate attributeName="opacity" values="0.15;0.08;0.15" dur="4s" repeatCount="indefinite"/>
      </circle>

      <!-- Detective hat askew (sleeping) -->
      <g id="detective-hat" transform="rotate(15 75 30) translate(5, 5)">
        <path d="M 50 28 L 75 12 L 100 28 L 95 32 L 55 32 Z"
              fill="${colors.dark}" stroke="${colors.primary}" stroke-width="1" opacity="0.6"/>
        <ellipse cx="75" cy="32" rx="28" ry="6" fill="${colors.dark}" opacity="0.6"/>
        <rect x="47" y="28" width="56" height="4" fill="${colors.secondary}" opacity="0.4"/>
      </g>

      <!-- Main blob (breathing animation) -->
      <path d="M 75 45
               C 98 45, 115 62, 112 88
               S 98 120, 75 120
               S 38 112, 38 88
               S 52 45, 75 45 Z"
            fill="url(#sleepGrad)"
            stroke="${colors.dark}"
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
        <path d="M 52 80 L 68 80" stroke="${colors.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
        <path d="M 82 80 L 98 80" stroke="${colors.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
      </g>

      <!-- Peaceful smile -->
      <path d="M 65 92 Q 75 98 85 92" stroke="${colors.dark}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>

      <!-- Floating Zzz -->
      <g class="zzz-group">
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colors.glow}">
          <tspan x="105" y="50" font-size="16" opacity="0">
            Z
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y" values="55;35;25" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="x" values="105;115;120" dur="3s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colors.secondary}">
          <tspan x="112" y="60" font-size="12" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="y" values="65;45;35" dur="3s" begin="1s" repeatCount="indefinite"/>
            <animate attributeName="x" values="112;122;130" dur="3s" begin="1s" repeatCount="indefinite"/>
          </tspan>
        </text>
        <text font-family="Arial, sans-serif" font-weight="bold" fill="${colors.accent}">
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
```

## Pointing Directions

### Point Right (At Code)

```typescript
export function generatePointingRightVibe(colors: VibeColors = vibeColors): string {
  // Eyes look right, small blob extension on right side
  // Same pattern as living-ide but with detective hat
  // See full implementation in svg-character.ts
}
```

### Point Left (At File Explorer)

```typescript
export function generatePointingLeftVibe(colors: VibeColors = vibeColors): string {
  // Eyes look left, small blob extension on left side
  // Mirror of pointing right
}
```

### Point Down (At Terminal)

```typescript
export function generatePointingDownVibe(colors: VibeColors = vibeColors): string {
  // Extended viewBox (150x300), anatomical arm pointing down
  // Most complex pointing direction
  // See full implementation in living-ide svg-character.ts:922-1255
}
```

## State Machine Integration

### State Machine Configuration

```typescript
// extension/src/state-machine.ts
export type VibeState =
  | 'idle'
  | 'watching'
  | 'detecting'
  | 'questioning'
  | 'celebrating'
  | 'concerned'
  | 'sleeping'
  | 'pointing';

type IndicatorType = 'line_spike' | 'high_complexity' | 'paste';

export type VibeEvent =
  | { type: 'CODE_CHANGED'; linesDelta: number }
  | { type: 'VIBE_DETECTED'; triggeredBy: IndicatorType; indicatorValue: number; line: number }
  | { type: 'START_VIBECHECK'; vibecheckId: string; triggeredBy: IndicatorType }
  | { type: 'ANSWER_SUBMITTED'; correct: boolean }
  | { type: 'VIBECHECK_PASSED' }
  | { type: 'VIBECHECK_FAILED' }
  | { type: 'VIBECHECK_SKIPPED' }
  | { type: 'POINT_AT'; direction: PointingDirection; target: string }
  | { type: 'TIMEOUT' }
  | { type: 'RESET' }
  | { type: 'SLEEP' }
  | { type: 'WAKE' };

const stateConfig: Record<VibeState, StateDefinition> = {
  idle: {
    entry: (ctx) => { ctx.isInterruptible = true; },
    on: {
      CODE_CHANGED: { target: 'watching' },
      VIBE_DETECTED: { target: 'detecting' },
      POINT_AT: { target: 'pointing' },
      SLEEP: { target: 'sleeping' }
    }
  },
  watching: {
    entry: (ctx) => { ctx.isInterruptible = true; },
    on: {
      VIBE_DETECTED: { target: 'detecting' },
      TIMEOUT: { target: 'idle' }
    }
  },
  detecting: {
    entry: (ctx) => { ctx.isInterruptible = false; },
    on: {
      START_VIBECHECK: { target: 'questioning' },
      TIMEOUT: { target: 'idle' }
    }
  },
  questioning: {
    entry: (ctx) => { ctx.isInterruptible = false; },
    on: {
      VIBECHECK_PASSED: { target: 'celebrating' },
      VIBECHECK_FAILED: { target: 'concerned' },
      VIBECHECK_SKIPPED: { target: 'concerned' }
    }
  },
  celebrating: {
    entry: (ctx) => { ctx.isInterruptible = false; },
    on: {
      TIMEOUT: { target: 'idle' }
    }
  },
  concerned: {
    entry: (ctx) => { ctx.isInterruptible = true; },
    on: {
      TIMEOUT: { target: 'idle' },
      START_VIBECHECK: { target: 'questioning' }
    }
  },
  sleeping: {
    entry: (ctx) => { ctx.isInterruptible = true; },
    on: {
      WAKE: { target: 'idle' },
      VIBE_DETECTED: { target: 'detecting' }
    }
  },
  pointing: {
    entry: (ctx) => { ctx.isInterruptible = false; },
    on: {
      TIMEOUT: { target: 'idle' },
      START_VIBECHECK: { target: 'questioning' }
    }
  }
};
```

## Activity Tracker Integration

### Multi-Checkpoint Flow

```
+------------------------------------------------------------------------+
|                    ACTIVITY TRACKER CHECKPOINTS                         |
+------------------------------------------------------------------------+
|                                                                         |
|  Time Since Last Action:                                                |
|                                                                         |
|  0s -----> 5s -----> 10s -----> 15s -----> 20s -----> 25s -----> 30s   |
|    |        |         |          |          |          |          |     |
|    v        v         v          v          v          v          v     |
|  Active  Reset to   Idle      Idle       Idle       Idle      Sleep    |
|          idle       anim #1   anim #2    anim #3    anim #4    state   |
|                                                                         |
|  ANY Codey action resets ALL checkpoints back to 0s                    |
|                                                                         |
+------------------------------------------------------------------------+
```

### Implementation

```typescript
// extension/src/activity-tracker.ts
const activityTracker = ActivityTracker.getInstance({
  inactivityTimeout: 30000, // 30 seconds to sleep

  onResetToIdle: () => {
    // 5s checkpoint: Clear any active animation
    sendEvent({ type: 'RESET' });
    vibePanel.setState('idle');
  },

  onIdleAnimation: () => {
    // 10s, 15s, 20s, 25s: Random idle animation
    vibePanel.triggerIdleAnimation();
  },

  onSleep: () => {
    // 30s checkpoint: Enter sleep state
    sendEvent({ type: 'SLEEP' });
    vibePanel.setState('sleeping');
  },

  onWake: () => {
    // Wake from sleep
    sendEvent({ type: 'WAKE' });
    vibePanel.setState('idle');
  }
});
```

## Webview Panel Structure

### HTML Template

```typescript
function getWebviewHtml(webview: vscode.Webview): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${webview.cspSource} data:;
                 script-src 'unsafe-inline';
                 style-src 'unsafe-inline';">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: var(--vscode-editor-background);
      overflow: hidden;
    }

    #character-container {
      position: absolute;
      width: 250px;
      height: 250px;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 100;
    }

    #character {
      width: 100%;
      height: 100%;
    }

    #chat-bubble {
      position: absolute;
      background: var(--vscode-editor-background);
      border: 2px solid var(--vscode-button-background);
      border-radius: 12px;
      padding: 12px 16px;
      max-width: 280px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
    }

    #chat-bubble.visible {
      opacity: 1;
      transform: scale(1);
    }

    /* Idle animations */
    @keyframes idle-bob {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px) rotate(-2deg); }
      75% { transform: translateX(8px) rotate(2deg); }
    }

    @keyframes sleeping-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(0.98); }
    }

    #character-container.sleeping {
      animation: sleeping-breathe 4s ease-in-out infinite;
      filter: brightness(0.85) saturate(0.8);
    }
  </style>
</head>
<body>
  <div id="character-container">
    <div id="character"></div>
  </div>
  <div id="chat-bubble">
    <div id="chat-message"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const character = document.getElementById('character');
    const container = document.getElementById('character-container');
    const bubble = document.getElementById('chat-bubble');
    const message = document.getElementById('chat-message');

    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.command) {
        case 'setState':
          updateCharacter(msg.state);
          break;
        case 'showBubble':
          showChatBubble(msg.text);
          break;
        case 'hideBubble':
          hideChatBubble();
          break;
        case 'triggerIdleAnimation':
          triggerRandomIdleAnimation();
          break;
      }
    });

    function updateCharacter(state) {
      container.className = state;
      // SVG will be injected based on state
    }

    function showChatBubble(text) {
      message.textContent = text;
      bubble.classList.add('visible');
    }

    function hideChatBubble() {
      bubble.classList.remove('visible');
    }

    const idleAnimations = ['idle-bob', 'idle-look-around', 'idle-stretch'];
    function triggerRandomIdleAnimation() {
      const anim = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
      container.style.animation = \`\${anim} 2s ease-in-out\`;
      setTimeout(() => container.style.animation = '', 2000);
    }
  </script>
</body>
</html>`;
}
```

## Gutter Icons (Mascot Variants)

In addition to the full animated character in the webview panel, Vibe appears as 16x16 SVG icons in the editor gutter when indicators are triggered:

```
+------------------------------------------------------------------------+
|                         GUTTER ICON VARIANTS                            |
+------------------------------------------------------------------------+
|                                                                         |
|  +------------------+  +------------------+  +------------------+       |
|  | vibe-rushing.svg |  | vibe-confused.svg|  | vibe-clipboard.svg      |
|  |                  |  |                  |  |                  |       |
|  |   Line Spike     |  | High Complexity  |  |  Paste Detected  |       |
|  |   (>50/min)      |  |     (>20)        |  |   (>10 lines)    |       |
|  +------------------+  +------------------+  +------------------+       |
|                                                                         |
+------------------------------------------------------------------------+
```

### Gutter Icon Specifications

- **Size**: 16x16 pixels (viewBox)
- **Format**: SVG with inline styles
- **Variants**: Light and dark theme versions
- **gutterIconSize**: 'contain'

### Implementation

```typescript
// extension/src/decoration-manager.ts
const gutterIcons: Record<IndicatorType, vscode.TextEditorDecorationType> = {
  line_spike: vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath('media/vibe-rushing.svg'),
    gutterIconSize: 'contain',
  }),
  high_complexity: vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath('media/vibe-confused.svg'),
    gutterIconSize: 'contain',
  }),
  paste: vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath('media/vibe-clipboard.svg'),
    gutterIconSize: 'contain',
  }),
};
```

---

## File Structure

Aligned with `01-architecture.md` and `03-implementation-roadmap.md`:

```
extension/src/
├── extension.ts              # Entry point (imports agent components)
├── event-bus.ts              # Type-safe pub/sub messaging
├── vibe-panel-provider.ts    # WebviewPanel management
├── vibe-svg-character.ts     # All SVG generation functions
├── vibe-state-machine.ts     # State definitions and transitions
├── vibe-activity-tracker.ts  # Sleep/wake checkpoint system
├── vibe-movement.ts          # Pointing and positioning logic
├── decoration-manager.ts     # Mascot gutter icons per indicator
├── vibecheck-panel.ts        # Quiz webview (separate from agent)
├── vibe-detector.ts          # Detection orchestrator + deduplication
├── complexity-analyser.ts    # Cyclomatic complexity (TS)
├── document-tracker.ts       # Line/paste detection
├── codelens-provider.ts      # Clickable CodeLens indicators
└── convex-client.ts          # Database sync

extension/media/               # Gutter icons
├── vibe-rushing.svg          # Line spike indicator
├── vibe-confused.svg         # High complexity indicator
└── vibe-clipboard.svg        # Paste detected indicator
```

---

## Service Integration

The animated agent connects to backend services for data persistence and vibecheck generation.

### Convex Integration

Agent events are persisted to Convex for teacher dashboard visibility:

```typescript
// extension/src/convex-client.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

// Log agent state changes
async function logAgentEvent(event: VibeEvent) {
  await client.mutation(api.activityLog.create, {
    eventType: event.type,
    metadata: event,
    timestamp: Date.now(),
  });
}

// Sync vibecheck results
async function syncVibecheckResult(vibecheckId: string, passed: boolean, score: number) {
  await client.mutation(api.vibechecks.complete, {
    id: vibecheckId,
    passed,
    score,
    completedAt: Date.now(),
  });
}
```

### LeanMCP Integration

Vibecheck questions are generated via the LeanMCP server hosted on ship.leanmcp.com:

```typescript
// extension/src/mcp-client.ts
async function requestVibecheck(code: string, language: string, triggeredBy: IndicatorType) {
  const response = await fetch('https://your-server.ship.leanmcp.com/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'generateVibecheck',
        arguments: { code, language, triggeredBy }
      }
    })
  });

  return response.json();
}
```

### Anthropic (via LeanMCP)

The LeanMCP server uses Anthropic Claude to generate context-aware questions:
- Model: `claude-sonnet-4-5-20250929`
- Questions focus on areas relevant to the trigger type
- Prompt caching reduces costs for repeated system prompts

### Vercel Dashboard

Teacher dashboard (deployed on Vercel) displays agent activity in real-time:
- Live activity feed shows agent state transitions
- Vibecheck history per student
- Pass/fail statistics by trigger type

---

## Summary

The Vibe animated agent provides:

- **7 character states**: idle, watching, detecting, questioning, celebrating, concerned, sleeping
- **3 pointing directions**: left (file explorer), right (code), down (terminal)
- **3 gutter icon variants**: rushing (line spike), confused (complexity), clipboard (paste)
- **Detective theme**: Hat, magnifying glass, clipboard elements
- **Immediate trigger system**: Events carry `triggeredBy` indicator type, not weighted score
- **Multi-checkpoint activity system**: Progressive idle animations before sleep
- **Event-driven state machine**: Clean transitions with interruptibility controls
- **GPU-accelerated CSS animations**: Smooth 60fps performance
- **Dynamic SVG generation**: No external asset files needed (except 16x16 gutter icons)

The implementation follows the exact patterns from Living IDE, ensuring consistent behaviour and maintainability.
