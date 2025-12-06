# Codswallop UI/UX Wireframes

## Animated Agent: "Vibe" the Detective Blob

Codswallop features an animated mascot called **Vibe** - a detective-themed cosmic blob that lives in a VSCode webview panel. Vibe monitors coding activity, detects vibe coding, and guides students through vibechecks.

### Character Design

```
                    Detective Hat
                       /\
                      /  \
                     /____\
                    +------+
                   /        \
        +--------+  O    O   +--------+     <-- Curious eyes
        | IDLE   |           | DETECT |
        |        |  +----+   |   (!)  |     <-- Magnifying glass when detecting
        +--------+  |BODY|   +--------+
                    +----+
                       |
              [Floating blob body with
               organic morphing animation]
```

### Character States

```
+------------------------------------------------------------------------+
|                         VIBE CHARACTER STATES                           |
+------------------------------------------------------------------------+
|                                                                         |
|    IDLE             WATCHING          DETECTING         QUESTIONING     |
|   +----+            +----+            +----+            +----+          |
|   | ^^ |            | -- |            | >< |            | ?? |          |
|   |(  )|            |(  )|            |(!!)|            |(?!)|          |
|   +----+            +----+            +----+            +----+          |
|   Floating          Eyes follow       Magnifying        Thought         |
|   gently            code changes      glass out         bubbles         |
|                                                                         |
|    CELEBRATING      CONCERNED         SLEEPING          POINTING        |
|   +----+            +----+            +----+            +----+          |
|   | ** |            | ;; |            | -- |            | >> |-->       |
|   |(**)| PASS!      |(  )|            |(zz)|            |(  )|          |
|   +----+            +----+            +----+            +----+          |
|   Star eyes,        Worried brows,    Zzz floating,     Points at       |
|   confetti          encouraging       dimmed            code/terminal   |
|                                                                         |
+------------------------------------------------------------------------+
```

### Vibe Panel Layout in VSCode

```
+------------------------------------------------------------------------------+
|  VS Code                                                           [-][o][x] |
+------------------------------------------------------------------------------+
|  EXPLORER    |  Vibe Panel       |  main.py                          x      |
|              | +---------------+ | +----------------------------------+      |
|  > src       | |    /\         | | |  1   import requests             |      |
|    > utils   | |   /  \        | | |  2   import json                 |      |
|    main.py   | |  /____\       | | |  3                               |      |
|              | | +------+      | | |  [!] Vibecheck needed            |      |
|              | |/  O  O \      | | |  4 + def fetch_data(...):        |      |
|              | |   ----  |     | | |  5 |     ...                     |      |
|              | | (      )      | | |  6 |     ...                     |      |
|              | |  +----+       | | +----------------------------------+      |
|              | |               | |                                           |
|              | | +----------+  | |                                           |
|              | | | Hmm, that|  | |   Vibe points at suspicious code --->     |
|              | | | looks    |  | |                                           |
|              | | | copied!  |  | |                                           |
|              | | +----------+  | |                                           |
|              | +---------------+ |                                           |
+------------------------------------------------------------------------------+
|  PROBLEMS  |  OUTPUT  |  TERMINAL  |  CODSWALLOP                             |
+------------------------------------------------------------------------------+

Panel Position: ViewColumn.One (first editor column)
Files open in: ViewColumn.Two (beside Vibe)
```

### Pointing Directions

```
+------------------------------------------------------------------------+
|                      VIBE POINTING SYSTEM                               |
+------------------------------------------------------------------------+
|                                                                         |
|  POINT LEFT (File Explorer)    POINT RIGHT (Code)    POINT DOWN (Term) |
|                                                                         |
|      <---o                          o--->                   o           |
|         /|\                        /|\                     /|\          |
|        / | \                      / | \                   / | \         |
|   [Points at                [Points at             [Arm extends         |
|    file tree]                editor code]           down to terminal]   |
|                                                                         |
|  Triggered by:              Triggered by:          Triggered by:        |
|  - New file created         - Vibe detected        - Terminal output    |
|  - File selected            - CodeLens click       - Error shown        |
|                                                                         |
+------------------------------------------------------------------------+
```

### Activity Tracker Timeline

```
+------------------------------------------------------------------------+
|                    VIBE INACTIVITY CHECKPOINTS                          |
+------------------------------------------------------------------------+
|                                                                         |
|  0s         5s        10s       15s       20s       25s       30s       |
|  |----------|---------|---------|---------|---------|---------|         |
|  ^          ^         ^         ^         ^         ^         ^         |
|  |          |         |         |         |         |         |         |
|  Active   Reset     Idle      Idle      Idle      Idle     SLEEP       |
|  state    to idle   anim #1   anim #2   anim #3   anim #4   state      |
|                                                                         |
|  ANY action by Vibe (pointing, speaking, detecting) resets to 0s       |
|                                                                         |
|  Idle Animations:                                                       |
|  - Look around curiously                                                |
|  - Adjust detective hat                                                 |
|  - Polish magnifying glass                                              |
|  - Gentle bobbing/stretching                                            |
|                                                                         |
+------------------------------------------------------------------------+
```

### Chat Bubble System

```
+----------------------------------------+
|  +----------------------------------+  |
|  |  "I noticed you added 47 lines  |  |
|  |   in one go! Let's make sure    |  |
|  |   you understand this code."    |  |
|  +----------------------------------+  |
|         \                              |
|          \   +------+                  |
|           \  |      |                  |
|              | O  O |                  |
|              | (__) |                  |
|              +------+                  |
|                                        |
|  Bubble Types:                         |
|  - Detection alert (amber border)      |
|  - Question prompt (purple border)     |
|  - Celebration (green border)          |
|  - Encouragement (blue border)         |
+----------------------------------------+
```

---

## VSCode Extension Interface

### 1. CodeLens Indicators

When any indicator threshold is exceeded, clickable CodeLens appears above the suspected code:

```
+------------------------------------------------------------------------------+
|  VS Code Editor                                                    [-][o][x] |
+------------------------------------------------------------------------------+
|  EXPLORER  |                                                                  |
|            |  main.py                                              x          |
|  > src     | +---------------------------------------------------------+     |
|    > utils |  |  1   import requests                                    |     |
|    main.py |  |  2   import json                                        |     |
|            |  |  3                                                       |     |
|            |  |      High Complexity: 24 [Take Quiz]                          |
|            |  |  4 + def fetch_and_process_data(url, params=None,       |     |
|            |  |  5 |     headers=None, timeout=30, retry=3,             |     |
|            |  |  6 |     backoff=1.5, verify_ssl=True):                 |     |
|            |  |  7 |     """Fetch data with retry logic."""            |     |
|            |  |  8 |     for attempt in range(retry):                   |     |
|            |  |  9 |         try:                                       |     |
|            |  | 10 |             if params:                             |     |
|            |  | 11 |                 response = requests.get(           |     |
|            |  | 12 |                     url, params=params,            |     |
|            |  | 13 |                     headers=headers or {},         |     |
|            |  | 14 |                     timeout=timeout,               |     |
|            |  | 15 |                     verify=verify_ssl              |     |
|            |  | 16 |                 )                                  |     |
|            |  | 17 |             else:                                  |     |
|            |  | ...                                                     |     |
|            |  | 45 |     return None                                    |     |
|            |  | 46                                                       |     |
|            | +---------------------------------------------------------+     |
+------------------------------------------------------------------------------+
|  PROBLEMS  |  OUTPUT  |  TERMINAL  |  CODSWALLOP                             |
+------------------------------------------------------------------------------+

CodeLens Labels by Indicator:
  - "High Complexity: 24 [Take Quiz]"      (complexity >20)
  - "Line Spike: 65 lines/min [Take Quiz]" (lines >50/min)
  - "Paste Detected: 15 lines [Take Quiz]" (paste >10 lines)
```

### 2. Gutter Decorations (Mascot Icons)

Each indicator type displays a unique 16x16 Vibe mascot SVG icon in the gutter:

```
+-----+----------------------------------------------------------------------+
| #   | Code                                                                  |
+-----+----------------------------------------------------------------------+
|  1  |   import numpy as np                                                 |
|  2  |   import pandas as pd                                                |
|  3  |                                                                      |
| [P] |  4 + def fetch_data(url):                          # Paste detected
|  5  |       """Fetched from StackOverflow."""                              |
|  6  |       response = requests.get(url)                                   |
|  7  |       return response.json()                                         |
|  8  |                                                                      |
| [C] |  9 + def complex_transform(df, cols, agg_funcs,    # High complexity
|     | 10 |     groupby=None, fillna=0, dropna=True,                        |
|     | 11 |     normalize=False, scale_factor=1.0):                         |
|     | ... |     [40+ lines of nested conditionals]                         |
|     | 55 |     return result                                               |
|     | 56 |                                                                 |
| [R] | 57 + def bulk_insert(data):                        # Line spike
|     | ... |     [65 lines added in <1 minute]                              |
|     |120 |     return results                                              |
+-----+----------------------------------------------------------------------+

Legend (Mascot Gutter Icons):
  [R] = Vibe Rushing      - Line spike detected (>50 lines/min)
  [C] = Vibe Confused     - High complexity detected (>20)
  [P] = Vibe Clipboard    - Paste detected (>10 lines)

Icon Implementation:
  - 16x16 SVG files in media/ folder
  - Theme-aware (light/dark variants)
  - gutterIconPath + gutterIconSize: 'contain'
  - One icon per line (VSCode limitation)
```

### 3. Vibecheck Quiz Panel (Webview)

```
+------------------------------------------------------------------------------+
|                           CODSWALLOP VIBECHECK                               |
+------------------------------------------------------------------------------+
|                                                                              |
|  Code Being Tested:                                                          |
|  +------------------------------------------------------------------------+  |
|  |  def fetch_and_process_data(url, params=None, headers=None, ...):     |  |
|  |      for attempt in range(retry):                                      |  |
|  |          try:                                                          |  |
|  |              response = requests.get(url, ...)                         |  |
|  |              ...                                                       |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +---------------------------------------------------------------------------+
|  |  Question 1 of 4                                        [Skip] [Hint]    |
|  +---------------------------------------------------------------------------+
|  |                                                                          |
|  |  What happens when the HTTP request fails on the first attempt?          |
|  |                                                                          |
|  |  ( ) The function immediately returns None                               |
|  |  ( ) The function raises an exception                                    |
|  |  (o) The function waits and retries up to 'retry' times                  |
|  |  ( ) The function logs an error and continues                            |
|  |                                                                          |
|  |                                          [Previous]  [Submit Answer]     |
|  +---------------------------------------------------------------------------+
|                                                                              |
|  Progress: [=====>                    ] 1/4                                  |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 4. Status Bar Integration

```
+------------------------------------------------------------------------------+
|                                                                              |
|  [Codswallop: 3 detections] [Complexity: 18 avg] [Sync: Live]                |
|                                                                              |
+------------------------------------------------------------------------------+

Clicking "3 detections" opens quick pick:

+-----------------------------------------------+
|  Vibecheck Detections                         |
+-----------------------------------------------+
|  > main.py:10 - High Complexity: 24           |
|    utils/api.py:45 - Paste: 18 lines          |
|    helpers.py:23 - Line Spike: 72 lines/min   |
+-----------------------------------------------+
```

## Teacher Dashboard (Vercel Frontend)

### 1. Dashboard Overview

```
+------------------------------------------------------------------------------+
|  CODSWALLOP                                      [Classroom v] [Profile] [?] |
+------------------------------------------------------------------------------+
|                                                                              |
|  +-------------------+  +-------------------+  +-------------------+         |
|  | ACTIVE STUDENTS   |  | VIBECHECKS TODAY  |  | CLASS AVG SCORE   |         |
|  |        12/15      |  |        47         |  |       0.68        |         |
|  |    [=====>   ]    |  |   +23 from avg    |  |   -0.12 from avg  |         |
|  +-------------------+  +-------------------+  +-------------------+         |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  LIVE ACTIVITY FEED                                        [Pause]     |  |
|  +------------------------------------------------------------------------+  |
|  |  10:45  @alice   Completed vibecheck on api.py:23         [Pass] 4/4   |  |
|  |  10:44  @bob     Started vibecheck on utils.py:156        [In Progress]|  |
|  |  10:42  @charlie Vibe detected: main.py:89 (score: 0.78)  [Pending]    |  |
|  |  10:40  @diana   Skipped vibecheck on helpers.py:34       [Skipped]    |  |
|  |  10:38  @eve     Completed vibecheck on models.py:12      [Fail] 2/4   |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  STUDENT LEADERBOARD                           [By Score v] [Export]   |  |
|  +------------------------------------------------------------------------+  |
|  |  Rank  Student    Vibechecks  Passed  Avg Score  Vibe Rate             |  |
|  |  ----  ---------  ----------  ------  ---------  ---------             |  |
|  |   1    @alice          23       21      0.91       12%                 |  |
|  |   2    @frank          19       17      0.89       15%                 |  |
|  |   3    @grace          21       18      0.86       18%                 |  |
|  |   4    @henry          18       15      0.83       22%                 |  |
|  |   5    @ivan           15       12      0.80       28%                 |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 2. Individual Student View

```
+------------------------------------------------------------------------------+
|  CODSWALLOP                              [< Back to Class]    [Message] [?]  |
+------------------------------------------------------------------------------+
|                                                                              |
|  +----+                                                                      |
|  |    |  Alice Johnson                                                       |
|  |    |  @alice | alice@school.edu                                           |
|  +----+  Member since: 15 Oct 2024                                           |
|                                                                              |
|  +-------------------+  +-------------------+  +-------------------+         |
|  | VIBECHECKS        |  | PASS RATE         |  | VIBE RATE         |         |
|  |        23         |  |       91%         |  |       12%         |         |
|  |   #2 in class     |  |   #1 in class     |  |   Best in class   |         |
|  +-------------------+  +-------------------+  +-------------------+         |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  CODING ACTIVITY (Last 7 Days)                                         |  |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  Lines  ^                                                               |  |
|  |   200   |                                    *                          |  |
|  |   150   |              *         *          * *                         |  |
|  |   100   |    *        * *       * *        *   *     *                  |  |
|  |    50   |   * *      *   *     *   *      *     *   * *                 |  |
|  |     0   +----+--------+--------+--------+--------+--------+----> Day    |  |
|  |              Mon      Tue      Wed      Thu      Fri      Sat           |  |
|  |                                                                         |  |
|  |  Legend: * = Total lines  o = Vibe-coded lines                          |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  RECENT VIBECHECKS                                                      |  |
|  +------------------------------------------------------------------------+  |
|  |  Date       File               Questions  Score  Status                 |  |
|  |  ---------  -----------------  ---------  -----  --------               |  |
|  |  Today      api.py:23              4       4/4   [Passed]               |  |
|  |  Today      models.py:56           3       3/3   [Passed]               |  |
|  |  Yesterday  utils.py:89            4       3/4   [Passed]               |  |
|  |  Yesterday  handlers.py:12         4       2/4   [Failed]               |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  STRUGGLE AREAS (Topics needing attention)                              |  |
|  +------------------------------------------------------------------------+  |
|  |  [Error Handling] - 2/5 correct answers                                 |  |
|  |  [Async/Await] - 3/6 correct answers                                    |  |
|  |  [API Design] - 4/7 correct answers                                     |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

### 3. Classroom Management

```
+------------------------------------------------------------------------------+
|  CODSWALLOP                                                      [+ New] [?] |
+------------------------------------------------------------------------------+
|                                                                              |
|  MY CLASSROOMS                                                               |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |  [/]  CS101 - Introduction to Programming                        |  |  |
|  |  |       15 students | Code: INTRO-2024                             |  |  |
|  |  |       Last activity: 5 minutes ago                               |  |  |
|  |  |       [View Dashboard] [Edit] [Share Code]                       |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |  [/]  CS201 - Data Structures                                    |  |  |
|  |  |       22 students | Code: DATA-2024                              |  |  |
|  |  |       Last activity: 1 hour ago                                  |  |  |
|  |  |       [View Dashboard] [Edit] [Share Code]                       |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |  [/]  CS301 - Algorithms                                         |  |  |
|  |  |       18 students | Code: ALGO-2024                              |  |  |
|  |  |       Last activity: 2 days ago                                  |  |  |
|  |  |       [View Dashboard] [Edit] [Share Code]                       |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+

Create New Classroom Modal:

+------------------------------------------+
|  CREATE NEW CLASSROOM              [x]   |
+------------------------------------------+
|                                          |
|  Classroom Name:                         |
|  +------------------------------------+  |
|  | Advanced Python                    |  |
|  +------------------------------------+  |
|                                          |
|  Description (optional):                 |
|  +------------------------------------+  |
|  | Fall 2024 advanced course          |  |
|  +------------------------------------+  |
|                                          |
|  Join Code (auto-generated):             |
|  +------------------------------------+  |
|  | PYTH-2024    [Regenerate]          |  |
|  +------------------------------------+  |
|                                          |
|            [Cancel]  [Create Classroom]  |
|                                          |
+------------------------------------------+
```

### 4. Analytics Dashboard

```
+------------------------------------------------------------------------------+
|  CODSWALLOP - ANALYTICS                    [This Week v] [Export] [Refresh]  |
+------------------------------------------------------------------------------+
|                                                                              |
|  CLASS OVERVIEW                                                              |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  VIBE SCORE DISTRIBUTION                                               |  |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  Students                                                               |  |
|  |      8  |                                                               |  |
|  |      6  |  #####                                                        |  |
|  |      4  |  #####  #####                                                 |  |
|  |      2  |  #####  #####  #####                 #####                    |  |
|  |      0  +--#####--#####--#####--#####--#####--#####--#####--> Score     |  |
|  |           0-0.1  0.2-0.3 0.4-0.5 0.6-0.7 0.8-0.9 0.9-1.0               |  |
|  |                                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +--------------------------------+  +------------------------------------+  |
|  |  TOP STRUGGLE CONCEPTS         |  |  VIBECHECK COMPLETION RATE         |  |
|  +--------------------------------+  +------------------------------------+  |
|  |  1. Exception Handling  42%    |  |                                    |  |
|  |  2. Async Programming   38%    |  |  Completed: [===========>   ] 73%  |  |
|  |  3. API Design          35%    |  |  Skipped:   [==>             ] 15%  |  |
|  |  4. Type Annotations    31%    |  |  Pending:   [=>              ] 12%  |  |
|  |  5. Error Messages      28%    |  |                                    |  |
|  +--------------------------------+  +------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  WEEKLY TREND                                                          |  |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  Avg Score                                                              |  |
|  |     1.0  |                                                              |  |
|  |     0.8  |                                       *---*                  |  |
|  |     0.6  |              *---*---*               /                       |  |
|  |     0.4  |         *---*         \         *---*                        |  |
|  |     0.2  |    *---*               \   *---*                             |  |
|  |     0.0  +----+---+---+---+---+---+---+---+---+---+---+---+--> Week     |  |
|  |             W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12             |  |
|  |                                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

## Student Self-View (Personal Dashboard)

```
+------------------------------------------------------------------------------+
|  CODSWALLOP                                          [Settings] [Help] [?]   |
+------------------------------------------------------------------------------+
|                                                                              |
|  Welcome back, Alice!                                                        |
|                                                                              |
|  +-------------------+  +-------------------+  +-------------------+         |
|  | TODAY'S PROGRESS  |  | STREAK            |  | RANK              |         |
|  |      3/5          |  |     7 days        |  |    #2 in class    |         |
|  |   vibechecks      |  |   Keep it up!     |  |    CS101          |         |
|  +-------------------+  +-------------------+  +-------------------+         |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  PENDING VIBECHECKS                                        [View All]  |  |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |  api.py:156                                                      |  |  |
|  |  |  Detected: 10 mins ago | Trigger: High Complexity (28)           |  |  |
|  |  |  [Start Vibecheck]                                               |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                         |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |  utils/helpers.py:89                                             |  |  |
|  |  |  Detected: 25 mins ago | Trigger: Paste Detected (35 lines)      |  |  |
|  |  |  [Start Vibecheck]                                               |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  MY LEARNING PROGRESS                                                  |  |
|  +------------------------------------------------------------------------+  |
|  |                                                                         |  |
|  |  Error Handling     [=======>          ] 65%   Improving!              |  |
|  |  Async/Await        [=====>            ] 50%   Keep practicing         |  |
|  |  API Design         [=========>        ] 78%   Strong!                 |  |
|  |  Type Annotations   [========>         ] 72%   Good progress           |  |
|  |                                                                         |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
|  +------------------------------------------------------------------------+  |
|  |  CLASSROOM: CS101 - Introduction to Programming                        |  |
|  +------------------------------------------------------------------------+  |
|  |  Teacher: Prof. Smith                                                  |  |
|  |  Your position: #2 of 15 students                                      |  |
|  |  Class average vibe rate: 24% | Your vibe rate: 12%                    |  |
|  +------------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

## Mobile Considerations

For the Vercel frontend, ensure responsive design:

```
+------------------+
| CODSWALLOP   [=] |
+------------------+
|                  |
| Active: 12/15    |
| Checks: 47       |
| Score: 0.68      |
|                  |
+------------------+
| LIVE FEED        |
+------------------+
| @alice Pass 4/4  |
| @bob   In Prog   |
| @charlie Pending |
+------------------+
| [Dashboard]      |
| [Students]       |
| [Analytics]      |
+------------------+

   Mobile View
   320px width
```

## Colour Palette

```
+------------------+------------------+------------------+
|    PRIMARY       |    SECONDARY     |    ACCENT        |
+------------------+------------------+------------------+
|                  |                  |                  |
|   #6366F1        |   #8B5CF6        |   #EC4899        |
|   Indigo         |   Violet         |   Pink           |
|                  |                  |                  |
+------------------+------------------+------------------+

+------------------+------------------+------------------+
|    SUCCESS       |    WARNING       |    DANGER        |
+------------------+------------------+------------------+
|                  |                  |                  |
|   #10B981        |   #F59E0B        |   #EF4444        |
|   Emerald        |   Amber          |   Red            |
|                  |                  |                  |
+------------------+------------------+------------------+

+------------------+------------------+------------------+
|    DARK BG       |    LIGHT BG      |    TEXT          |
+------------------+------------------+------------------+
|                  |                  |                  |
|   #1F2937        |   #F9FAFB        |   #374151        |
|   Gray-800       |   Gray-50        |   Gray-700       |
|                  |                  |                  |
+------------------+------------------+------------------+
```

## Iconography

```
Gutter Mascot Icons (16x16 SVG):
  Vibe Rushing     - Speed lines, urgent expression (line spike)
  Vibe Confused    - Spiral eyes, tilted hat (high complexity)
  Vibe Clipboard   - Holding clipboard/document (paste detected)

Actions:
  [>] Play/Start       - Begin vibecheck
  [||] Pause           - Pause activity
  [<] Back             - Navigate back
  [+] Add              - Create new item
  [x] Close            - Dismiss modal
  [?] Help             - Show documentation

Status:
  [/] Active           - Currently active
  [o] Pending          - Awaiting action
  [v] Complete         - Task finished
  [-] Skipped          - User skipped
```

## Next Steps

1. Review animated agent details (05-animated-agent.md)
2. Review implementation roadmap (03-implementation-roadmap.md)
3. Configure sponsor integrations (04-sponsor-integration.md)

---

## Service Integration Context

This section maps UI components to the underlying services that power them.

### Real-time Features → Convex
The following UI elements rely on Convex real-time subscriptions:
- **Live Activity Feed**: `useQuery(api.activityLog.getRecent)` subscription
- **Status Bar Sync Indicator**: Connection status from ConvexReactClient
- **Pending Vibechecks Badge**: `useQuery(api.vibechecks.getPendingByUser)` subscription
- **Student Leaderboard**: Real-time score updates via Convex subscriptions

### Vibecheck Questions → Anthropic + LeanMCP
Quiz questions displayed in the vibecheck panel are generated by:
- **LeanMCP Server**: Hosted on ship.leanmcp.com, exposes `generateVibecheck` tool
- **Anthropic Claude**: `claude-sonnet-4-5-20250929` generates context-aware questions
- Questions are customised based on `triggeredBy` indicator type (line_spike, high_complexity, paste)

### Gutter Icons → VSCode Extension
The mascot gutter icons (vibe-rushing, vibe-confused, vibe-clipboard) are:
- 16x16 SVG files in `extension/media/`
- Rendered via VSCode's `gutterIconPath` decoration API
- Triggered by immediate detection system (any indicator exceeding threshold)

### Teacher Dashboard → Vercel
The teacher dashboard wireframes are deployed on Vercel:
- **Framework**: Next.js App Router
- **Real-time data**: Convex React hooks (`useQuery`, `useMutation`)
- **Authentication**: Convex Auth integration
- **Deployment**: `vercel --prod` with Convex build integration
