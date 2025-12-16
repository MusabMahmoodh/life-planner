# 8. Which parts of the app make decisions automatically, and what happens when those decisions are wrong?

Let me explore the codebase to understand the automated decision-making systems and their error handling.

Searched feedback mechanismsRead behavioral engineRead AI goal generator[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}Read goal-generator.tsRead adaptation APIBased on my exploration of the codebase, here's what makes automated decisions and what happens when they're wrong:

## Automated Decision Systems

**1. Behavioral Engine (`lib/behavioral-engine.ts`)**

- **Consistency Scoring**: Automatically calculates a 0-100 score based on completion rate, streak, and activity recency
- **Failure Detection**: Tracks consecutive failures and triggers "gentle" vs "strict" encouragement modes
- **Difficulty Adaptation**: Adjusts task difficulty based on completion velocity and struggle patterns
- **Plan Recalibration Triggers**: Automatically decides when to modify the entire plan based on 5 behavioral signals


**2. AI Goal Generator (`lib/ai/goal-generator.ts`)**

- **Task Breakdown**: Uses GPT-5 to automatically break goals into milestones and daily tasks
- **Difficulty Assignment**: Assigns "easy", "medium", "hard", or "extreme" difficulty to each task
- **Timeline Estimation**: Predicts how many days/minutes each task will take


**3. Adaptive Recommendations**
The `generatePlanAdaptations()` function automatically decides to:

- **Reduce difficulty** if 3+ consecutive failures or consistency score < 30%
- **Increase difficulty** if completing 5+ tasks/day with 90%+ completion rate
- **Redistribute tasks** based on time-of-day patterns
- **Add recovery buffers** if user is burning out


## What Happens When Decisions Are Wrong?

**Current Limitations:**

1. **No Direct User Override**: Users can't directly reject automated adaptations. The system generates suggestions but doesn't have a clear "undo" or "reject this change" mechanism.
2. **No Feedback Loop for Bad AI Suggestions**: If the AI generates unrealistic tasks (e.g., "complete 100 push-ups" for a beginner), there's no way to tell it "this was wrong" to improve future suggestions.
3. **One-Way Adaptation**: The system can detect struggles and ease up, but if it makes tasks *too* easy, the only correction is if velocity gets extremely high (5+ tasks/day). There's a wide range where you might be unchallenged but not triggering the "increase difficulty" threshold.
4. **Context-Blind Recalibration**: The system doesn't know *why* you failed—was it because tasks were too hard, or did you just have a busy week at work? It treats all failures the same way.


**Partial Safeguards:**

- **Chat Interface**: Users can send messages like "this is too hard" which triggers the adaptation API, but it's not a structured feedback mechanism
- **Manual Task Editing**: Users can manually mark tasks as complete/skipped, which feeds back into the behavioral signals
- **Adaptation Levels**: The system tracks `adaptationLevel` (0-1) to prevent over-adjusting


**Missing Critical Features:**

- No "thumbs up/down" on automated suggestions
- No ability to pin certain tasks as "don't change these"
- No confidence scores shown to users ("I'm 60% confident this timeline is right")
- No A/B testing of different plan strategies
- No rollback mechanism if an adaptation makes things worse


The system is sophisticated at *detecting* problems but assumes its solutions are correct without verification.
