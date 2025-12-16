
# 2. give me complete project specification of this product

I'll analyze the codebase thoroughly to create a complete project specification document for you.

Read type definitionsRead behavioral engineRead database schemaRead AI generatorRead main page
# Smart Life Planner - Complete Project Specification

## 1. Executive Summary

**Product Name:** Smart Life Planner  
**Version:** 1.0  
**Type:** Progressive Web Application (PWA)  
**Platform:** Next.js 16 (App Router), React 19.2

**Vision Statement:**  
Smart Life Planner is an AI-powered behavioral intelligence platform that transforms vague aspirations into achievable action plans. Unlike traditional goal-tracking apps that simply record progress, this system actively learns from user behavior, adapts plans in real-time, and provides personalized coaching to maximize sustainable success.

**Core Innovation:**  
The app's Behavioral Engine uses proven psychology principles (consistency tracking, failure recovery, adaptive difficulty) to automatically recalibrate goals when users struggle or excel, creating a truly intelligent planning experience.

---

## 2. Target Users

### Primary Persona: "The Ambitious Self-Improver"
- Age: 25-45
- Characteristics: Goal-oriented, has tried multiple productivity apps, struggles with consistency
- Pain Points: Plans too ambitious, loses motivation after failures, no personalized guidance
- Goals: Achieve fitness milestones, learn new skills, build sustainable habits

### Secondary Personas:
- Career professionals pursuing skill development
- Fitness enthusiasts needing structured progression
- Students managing learning goals
- Individuals building life habits (health, finance, personal growth)

---

## 3. Technical Architecture

### 3.1 Tech Stack

**Frontend:**
- Next.js 16 with App Router
- React 19.2 with Server Components
- TypeScript (strict mode)
- Tailwind CSS v4 (Material Design elevation system)
- shadcn/ui component library

**Backend:**
- Next.js API Routes (Server Actions)
- Vercel AI SDK v5 with AI Gateway
- Database: PostgreSQL (Supabase/Neon)

**AI/ML:**
- OpenAI GPT-5 (goal generation, plan adaptation)
- OpenAI GPT-5 Mini (intent analysis, quick responses)
- Vercel AI Gateway (built-in, no API keys needed)

**State Management:**
- SWR for client-side caching and state synchronization
- Server Components for data fetching

**Authentication:**
- Supabase Auth (email/password)
- Row Level Security (RLS) policies

---

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Progressive Web App - Mobile-First Responsive Design)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   Presentation Layer                         │
│  • Goal Dashboard    • Chat Interface    • Analytics        │
│  • Task Management   • Community Feed    • Notifications    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  • Behavioral Engine     • AI Coach System                   │
│  • Task Scheduler        • Notification Engine              │
│  • Progress Calculator   • Community Manager                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                    AI Integration Layer                      │
│  • Goal Generator        • Plan Adapter                      │
│  • Intent Analyzer       • Encouragement Generator           │
│  • Task Recalibrator     • Chat Processor                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                     Data Layer                               │
│  PostgreSQL Database with RLS (Supabase/Neon)              │
│  • Users  • Goals  • Tasks  • Chat  • Communities           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features & Functional Requirements

### 4.1 AI-Powered Goal Creation

**User Flow:**
1. User taps floating action button "Create Goal"
2. Natural language input: "I want to get 6-pack abs in 3 months"
3. AI processes request using behavioral science principles
4. System generates:
   - Goal breakdown with milestones
   - Daily/weekly tasks with difficulty levels
   - Estimated timeline and success metrics
   - Personalized coach name and avatar

**AI Processing:**
- Model: OpenAI GPT-5
- Schema: `goalPlanSchema` (Zod validation)
- Principles Applied:
  - SMART framework validation
  - Progressive difficulty curve
  - Habit stacking opportunities
  - Failure-resilient design
  - Milestone-based motivation

**Output Example:**
```typescript
{
  title: "Achieve 6-Pack Abs",
  category: "fitness",
  estimatedDuration: 90 days,
  milestones: [
    {
      title: "Foundation Phase (Days 1-30)",
      tasks: [
        { title: "20 push-ups daily", difficulty: "easy", frequency: "daily" },
        { title: "2-min plank hold", difficulty: "medium", frequency: "daily" },
        { title: "Track meals in app", difficulty: "easy", frequency: "daily" }
      ]
    },
    // ... more milestones
  ]
}
```

---

### 4.2 Behavioral Intelligence Engine

**Purpose:** The core differentiator that makes this app intelligent rather than just a tracker.

#### 4.2.1 Consistency Tracking
**Metrics Calculated:**
- Current streak (consecutive days with completed tasks)
- Longest streak (historical best)
- Completion rate (0-1 scale)
- Consistency score (0-100, weighted formula)
- Last activity date
- Missed days count

**Formula:**
```typescript
consistencyScore = (completionRate × 70) + (streakBonus × 5) - (recencyPenalty × 5)
```

**Use Cases:**
- Display progress badges
- Trigger motivational messages
- Determine when to recalibrate plans

---

#### 4.2.2 Failure Recovery System

**Detection Logic:**
- Tracks consecutive failed tasks (skipped or overdue)
- Monitors time since last failure
- Counts recovery attempts

**Adaptive Response:**
```typescript
if (consecutiveFailures >= 5) → "gentle" mode
  - Reduce task difficulty by 30%
  - Add 2 rest days per week
  - Make 50% of tasks optional
  
if (consecutiveFailures >= 3) → "moderate" mode
  - Break tasks into smaller steps
  - Extend deadlines by 20%
  
if (consecutiveFailures === 0 && previouslyFailing) → "strict" mode
  - Maintain current momentum
  - Celebrate recovery milestone
```

**Messaging Adaptation:**
- Gentle: "It's okay to stumble. Let's take one small step."
- Moderate: "I've adjusted the plan. Ready to try again?"
- Strict: "You're back on track! Let's keep this energy going."

---

#### 4.2.3 Progress Signals

**Real-Time Tracking:**
1. **User Engagement** (0-1 scale)
   - Formula: `interactionsPerDay / 3`
   - Triggers: Low engagement → send check-in message

2. **Task Completion Velocity** (tasks/day)
   - Monitors completion speed
   - Too fast + high completion → increase difficulty
   - Too slow + failures → reduce difficulty

3. **Self-Reported Difficulty** (1-5 scale)
   - Derived from: `actualDuration / estimatedDuration`
   - >4 → tasks too hard
   - <2 → tasks too easy

4. **Time-of-Day Patterns**
   - Analyzes when user completes tasks
   - Suggests optimal scheduling
   - Example: "You're most active at 6 AM and 8 PM"

5. **Recovery Rate**
   - Measures: `successfulRecoveries / totalFailures`
   - Predicts resilience

---

#### 4.2.4 Automatic Plan Recalibration

**Trigger Conditions:**
```typescript
shouldRecalibrate = 
  consistencyScore < 40 ||
  consecutiveFailures >= 3 ||
  userEngagement < 0.3 ||
  selfReportedDifficulty > 4 ||
  taskVelocity > 5 && completionRate > 0.9
```

**Adaptation Actions:**
- **Reduce Difficulty:** Break tasks smaller, extend deadlines, add buffer time
- **Increase Difficulty:** Add advanced tasks, accelerate timeline
- **Redistribute Tasks:** Align with user's time-of-day patterns
- **Add Buffer:** Insert rest days, make tasks optional

---

### 4.3 AI Coach Chat Interface

**Design:** WhatsApp-style conversational UI with bubbles and timestamps

**Coach Persona:**
- Assigned unique name (e.g., "Coach Mike", "Dr. Sarah")
- Consistent communication style (supportive/direct/motivational)
- Contextually aware of user's behavioral state

**Message Types:**
1. **Plan Generation:** Initial goal breakdown
2. **Plan Modification:** Task adjustments based on feedback
3. **Encouragement:** Motivational check-ins
4. **Check-In:** "How did today go?"
5. **General:** Conversational responses

**Intent Analysis:**
```typescript
User: "This is too hard, I keep failing"
→ Intent: seek_encouragement + modify_plan
→ Response: Empathize + Adapt plan (reduce difficulty)

User: "Completed 30 push-ups today!"
→ Intent: report_progress
→ Response: Celebrate + Update metrics + Suggest next challenge
```

**Streaming Response:** Uses AI SDK's streaming API for real-time message generation

---

### 4.4 Task Management System

**Task Properties:**
- Title, description, status
- Frequency: daily, weekly, milestone, custom
- Difficulty: easy, medium, hard, extreme
- Estimated vs actual duration
- Dependencies (task order/prerequisites)
- Optional flag

**Task States:**
- Pending: Not yet due
- Completed: User marked done
- Skipped: User intentionally skipped
- Overdue: Past due date, not completed

**Smart Features:**
- Auto-mark overdue after 24 hours
- Task dependencies (must complete A before B)
- Estimated vs actual time tracking for difficulty calibration

---

### 4.5 Progress Analytics Dashboard

**Visualizations:**
1. **Consistency Chart:** Line graph showing daily completion rate
2. **Streak Counter:** Current vs longest streak with fire emoji
3. **Completion Funnel:** Total → Completed → Remaining
4. **Time-of-Day Heatmap:** When user is most active
5. **Difficulty Distribution:** Pie chart of task difficulty levels

**Metrics Displayed:**
- Consistency Score (0-100)
- Completion Rate (%)
- Current Streak (days)
- Tasks Completed / Total
- Recovery Rate (%)

---

### 4.6 Community & Accountability

**Community Types:**
- Fitness Communities
- Learning Communities
- Career Development
- Health & Wellness
- Custom Categories

**Features:**
- Join public communities
- Share progress updates (optional)
- See member activity feed
- Group challenges (future)
- Leaderboards (future)

**Privacy Controls:**
- Choose which goals to share
- Toggle progress sharing on/off
- Public vs private communities

---

### 4.7 Notifications & Reminders

**Notification Types:**
1. **Task Reminders:** Scheduled based on user preferences
2. **Milestone Celebrations:** "You completed Phase 1!"
3. **Recovery Encouragement:** After 2+ consecutive failures
4. **Check-In Messages:** "Haven't seen you in 3 days..."
5. **Streak Alerts:** "You're on a 10-day streak!"

**Smart Scheduling:**
- Learns user's time-of-day patterns
- Respects user's preferred reminder times
- Reduces frequency if user consistently ignores

**Delivery Channels:**
- In-app notifications
- Browser push notifications (PWA)
- Email digests (optional)

---

### 4.8 Archive System

**WhatsApp-Inspired:**
- Swipe to archive goals
- Archived goals hidden from main view
- Separate "Archived" tab to review
- Unarchive anytime

**Use Cases:**
- Pause goals without deleting
- Declutter active goal list
- Keep historical data for insights

---

## 5. Data Models

### 5.1 Core Entities

**User Profile**
```typescript
{
  id: UUID
  email: string
  name: string
  timezone: string
  preferred_reminder_times: string[]
  communication_style: 'supportive' | 'direct' | 'motivational'
  difficulty_preference: 'gradual' | 'moderate' | 'aggressive'
  global_consistency_score: number
}
```

**Goal**
```typescript
{
  id: UUID
  user_id: UUID
  title: string
  coach_name: string
  target_date: timestamp
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  is_archived: boolean
  category: string
  
  // Behavioral data (JSONB)
  consistency_metrics: ConsistencyMetrics
  failure_recovery: FailureRecoveryData
  progress_signals: ProgressSignals
  
  // Plan versioning
  original_plan: text
  plan_version: integer
  last_recalibration_date: timestamp
}
```

**Task**
```typescript
{
  id: UUID
  goal_id: UUID
  title: string
  status: TaskStatus
  frequency: TaskFrequency
  difficulty: DifficultyLevel
  estimated_duration: integer (minutes)
  actual_duration: integer (minutes)
  dependencies: UUID[]
}
```

**Chat Message**
```typescript
{
  id: UUID
  goal_id: UUID
  role: 'user' | 'assistant'
  content: text
  message_type: MessageType
  metadata: JSONB
}
```

---

### 5.2 Database Schema

**Tables:**
- users
- goals
- tasks
- chat_messages
- notifications
- communities
- community_memberships

**Key Indexes:**
- `idx_goals_user_id` - Fast user goal lookups
- `idx_tasks_goal_id` - Fast task queries per goal
- `idx_tasks_due_date` - Efficient overdue task detection
- `idx_notifications_scheduled_for` - Notification scheduling

**Row Level Security (RLS):**
- Users can only access their own data
- Communities: public read, member write
- All queries automatically filtered by `auth.uid()`

---

## 6. API Endpoints

### 6.1 Goal Management
- `POST /api/goals/generate` - Create goal from natural language
- `GET /api/goals` - List user's goals
- `GET /api/goals/[id]` - Get single goal with tasks
- `POST /api/goals/adapt` - Adapt existing goal based on feedback
- `PATCH /api/goals/[id]` - Update goal (archive, status, etc.)

### 6.2 Task Management
- `GET /api/tasks?goalId=[id]` - Get tasks for goal
- `PATCH /api/tasks/[id]` - Update task status
- `POST /api/tasks/[id]/complete` - Mark task complete
- `POST /api/tasks/[id]/skip` - Skip task

### 6.3 Chat & Coaching
- `POST /api/chat/goal` - Send message to AI coach (streaming)
- `GET /api/chat/[goalId]` - Get chat history
- `POST /api/chat/analyze-intent` - Analyze user message intent

### 6.4 Analytics
- `GET /api/analytics/consistency` - Get consistency metrics
- `GET /api/analytics/progress` - Get progress signals

### 6.5 Notifications
- `POST /api/notifications/schedule` - Schedule notification
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/[id]/read` - Mark as read

---

## 7. User Flows

### 7.1 Onboarding Flow
1. User signs up (email/password)
2. Welcome screen: "What's your first goal?"
3. Natural language input
4. AI generates plan (loading screen with motivational text)
5. Review plan with coach introduction
6. Confirm and start

### 7.2 Daily Usage Flow
1. Open app → See goal dashboard
2. View unread task count badges
3. Tap goal → See task list
4. Complete tasks (swipe or tap)
5. Receive encouragement message
6. Check progress charts

### 7.3 Goal Conversation Flow
1. Tap goal card → Goal detail page
2. Tap "Chat with Coach" button
3. WhatsApp-style interface opens
4. Type message (e.g., "This is too hard")
5. AI analyzes intent
6. Streaming response appears
7. Plan automatically adapts if needed

### 7.4 Failure Recovery Flow
1. User skips 3 tasks in a row
2. Behavioral engine detects pattern
3. System auto-generates encouragement message
4. Notification sent: "Let's adjust your plan"
5. User opens chat
6. Coach suggests easier tasks
7. Plan recalibrated with reduced difficulty

---

## 8. Design System

### 8.1 Visual Design

**Color Palette:**
- Primary: `#00796b` (Teal - WhatsApp inspired)
- Secondary: `#004d40` (Dark teal)
- Accent: `#ffab00` (Amber for celebrations)
- Background: `#fafafa` (Light gray)
- Surface: `#ffffff` (White cards)
- Text: `#212121` (Near black)

**Elevation System (Material Design):**
- `elevation-0`: No shadow
- `elevation-1`: Subtle shadow (cards)
- `elevation-2`: Medium shadow (header)
- `elevation-3`: Prominent shadow (FAB, dialogs)

**Typography:**
- Font Family: `Inter` (sans-serif)
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Captions: 12px

---

### 8.2 Component Library

**shadcn/ui Components Used:**
- Button, Card, Input, Dialog
- Progress, Badge, Avatar
- Dropdown Menu, Tabs, Tooltip
- Custom: GoalListItem, TaskListView, ChatView, BottomNav

---

### 8.3 Responsive Design

**Breakpoints:**
- Mobile: 320-767px (primary target)
- Tablet: 768-1023px
- Desktop: 1024px+

**Mobile-First Principles:**
- Bottom navigation for primary actions
- Floating action button for goal creation
- Swipe gestures for task completion
- Pull-to-refresh for updates

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Initial page load: <2 seconds
- API response time: <500ms
- AI generation: <5 seconds (with loading states)
- Optimistic UI updates for task completion

### 9.2 Security
- All data encrypted in transit (HTTPS)
- Row Level Security (RLS) on all tables
- Password hashing with bcrypt
- HTTP-only cookies for sessions
- Input validation on all forms
- SQL injection prevention (parameterized queries)

### 9.3 Scalability
- Serverless architecture (auto-scales)
- Database connection pooling
- Caching with SWR (client-side)
- Stateless API design

### 9.4 Accessibility
- WCAG 2.1 Level AA compliance
- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode
- Text scaling support

### 9.5 Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 10. AI Model Configuration

### 10.1 Model Selection

**Goal Generation (High Quality):**
- Model: `openai/gpt-5`
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 2000
- System Prompt: 800+ words on behavioral science principles

**Chat Responses (Fast & Cost-Effective):**
- Model: `openai/gpt-5-mini`
- Temperature: 0.8 (more personality)
- Max Tokens: 500
- Streaming: Enabled for real-time responses

**Intent Analysis (Precise):**
- Model: `openai/gpt-5-mini`
- Temperature: 0.3 (deterministic)
- Structured Output: Zod schema validation

---

### 10.2 Prompt Engineering

**System Prompts Include:**
- Behavioral psychology frameworks (SMART goals, habit stacking)
- Tone guidelines (empathetic, non-judgmental)
- Output structure (JSON schemas for consistency)
- Examples of good vs bad tasks

**Context Passed:**
- User's consistency metrics
- Current streak and failures
- Time-of-day patterns
- Communication style preference

---

## 11. Deployment & Infrastructure

### 11.1 Hosting
- **Platform:** Vercel
- **Region:** Auto (global CDN)
- **Environment:** Production + Preview branches

### 11.2 Database
- **Provider:** Supabase (preferred) or Neon
- **Type:** PostgreSQL 15+
- **Backup:** Automated daily backups
- **Migration:** SQL scripts in `/scripts` folder

### 11.3 Environment Variables
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Behavioral engine functions
- Task difficulty calculations
- Consistency metric formulas

### 12.2 Integration Tests
- API route responses
- Database queries
- AI model integrations

### 12.3 E2E Tests
- Goal creation flow
- Task completion flow
- Chat interaction flow

---

## 13. Future Enhancements (Roadmap)

### Phase 2 (Q2 2025)
- Voice mode for hands-free task interaction
- Scheduled coaching calls (video/audio)
- Advanced community features (challenges, leaderboards)
- Integration with fitness trackers (Apple Health, Google Fit)

### Phase 3 (Q3 2025)
- Team goals for families/groups
- Coach marketplace (human coaches)
- Habit stacking recommendations
- Predictive analytics (success probability scoring)

### Phase 4 (Q4 2025)
- Native mobile apps (iOS/Android)
- Offline mode with sync
- Premium subscription tier
- White-label solution for corporate wellness

---

## 14. Success Metrics (KPIs)

**User Engagement:**
- Daily Active Users (DAU)
- Goal completion rate (target: >65%)
- Average session duration (target: 5+ minutes)

**Behavioral Impact:**
- Average consistency score (target: >70)
- Average streak length (target: 14+ days)
- Recovery rate after failures (target: >80%)

**Retention:**
- Day 7 retention (target: >50%)
- Day 30 retention (target: >30%)
- Monthly Active Users (MAU)

**Business Metrics:**
- User acquisition cost (UAC)
- Lifetime value (LTV)
- Conversion rate to premium (future)

---

## 15. Technical Constraints & Assumptions

**Assumptions:**
- Users have stable internet connection (no offline mode in v1)
- Users access primarily via mobile web browser
- AI API costs remain within budget ($0.02/goal generation)
- Database can scale to 100k users without optimization

**Constraints:**
- Must work in browser (no native app download)
- Must support low-end mobile devices
- Must respect user privacy (GDPR compliance)
- Must handle AI rate limits gracefully

---

## 16. Documentation Requirements

**Developer Docs:**
- API reference (all endpoints documented)
- Database schema diagrams
- Architecture decision records (ADRs)
- Contributing guidelines

**User Docs:**
- Help center with FAQs
- Video tutorials (goal creation, chat usage)
- Privacy policy
- Terms of service

---

This specification represents a comprehensive, production-ready behavioral intelligence platform that goes far beyond simple todo lists. The system's core value lies in its ability to learn from user behavior and automatically adapt plans to maximize sustainable success through proven psychological principles.
