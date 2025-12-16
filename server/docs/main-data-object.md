# 7. What are the main data objects in this app, and who owns or edits them?

Found RLS policiesRead database schemaRead type definitions

## Main Data Objects & Ownership Model

### **1. User Profile**

**Object:** User account with behavioral preferences

**Fields:**

- Identity: email, name, timezone
- Preferences: communication style, difficulty preference, reminder times
- Global metrics: total goals created/completed, global consistency score


**Who Owns:** The user themselves**Who Edits:**

- User: Can update preferences, name
- System (AI): Updates global metrics automatically
- Nobody else can read/write (RLS: `auth.uid() = id`)


**Lifecycle:** Created on signup, persists forever (soft delete if needed)

---

### **2. Goal**

**Object:** A user's aspirational objective with adaptive tracking

**Fields:**

- Basic: title, description, target date, status, category, priority
- AI data: coach name, original plan, plan version
- Behavioral: consistency metrics, failure recovery data, progress signals
- Communication: unread task count, last interaction, next reminder


**Who Owns:** The user who created it**Who Edits:**

- User: Can archive, pause, abandon (status changes)
- System (AI): Updates all behavioral metrics automatically
- System (Behavioral Engine): Auto-recalibrates plan when user struggles
- Nobody else can access (RLS: `auth.uid() = user_id`)


**Key Mutations:**

- User creates goal → AI generates initial plan (plan_version = 1)
- User fails 3+ tasks → Behavioral engine adjusts → plan_version++
- User completes all tasks → status = 'completed'
- User archives → is_archived = true (WhatsApp-style)


**JSONB Fields (flexibility for iteration):**

```typescript
consistency_metrics: {
  currentStreak: 0,
  longestStreak: 0,
  completionRate: 0.75,
  consistencyScore: 72,
  lastActivityDate: "2025-01-15",
  missedDaysCount: 3
}

failure_recovery: {
  consecutiveFailures: 2,
  lastFailureDate: "2025-01-14",
  recoveryAttempts: 1,
  adaptationLevel: 0.3, // 30% difficulty reduction
  encouragementLevel: "moderate"
}

progress_signals: {
  userEngagement: 0.8, // High engagement
  taskCompletionVelocity: 2.5, // 2.5 tasks/day
  selfReportedDifficulty: 3, // Medium
  timeOfDayPattern: ["06:00", "20:00"],
  recoveryRate: 0.85 // 85% recovery rate
}
```

---

### **3. Task**

**Object:** A specific action item within a goal

**Fields:**

- Content: title, description
- Scheduling: due date, frequency (daily/weekly/milestone)
- Status: pending/completed/skipped/overdue
- Difficulty: easy/medium/hard/extreme
- Time tracking: estimated vs actual duration
- Dependencies: other tasks that must complete first
- Flags: is_optional, order_index


**Who Owns:** The goal (which is owned by the user)**Who Edits:**

- User: Marks complete/skip, updates actual duration
- System (AI): Creates tasks during goal generation
- System (Behavioral Engine): Adjusts difficulty, makes tasks optional, reorders
- System (Scheduler): Auto-marks overdue after 24 hours
- Access control: `EXISTS (SELECT 1 FROM goals WHERE goals.id = tasks.goal_id AND goals.user_id = auth.uid())`


**State Transitions:**

```plaintext
pending → completed (user marks done)
pending → skipped (user intentionally skips)
pending → overdue (24 hours past due_date, system auto-updates)
overdue → completed (user catches up)
```

**Key for Behavioral Engine:**

- Consecutive skips trigger failure detection
- Actual vs estimated duration informs difficulty calibration
- Completion velocity triggers plan adaptation


---

### **4. Chat Message**

**Object:** Conversation between user and AI coach

**Fields:**

- Content: role (user/assistant), message text
- Context: goal_id, message_type (plan_generation/encouragement/etc)
- Metadata: tasks modified, plan version, sentiment score


**Who Owns:** The user (linked to their goal)**Who Edits:**

- User: Creates messages by typing in chat
- System (AI): Creates assistant responses
- Nobody modifies existing messages (append-only log)
- Access control: `auth.uid() = user_id`


**Message Types:**

- `plan_generation`: Initial AI response with task breakdown
- `plan_modification`: AI explains adjustments made
- `encouragement`: Motivational check-ins
- `check_in`: "How did today go?"
- `general`: Conversational responses


**V1 Note:** In simplified V1, these might be system-generated notifications rather than real-time chat.

---

### **5. Notification**

**Object:** Reminder or system message for user

**Fields:**

- Target: user_id, goal_id, optional task_id
- Content: type, title, message
- Scheduling: scheduled_for, sent_at, read_at
- Action: optional action_url (deep link)


**Who Owns:** The user receiving it**Who Edits:**

- System (AI): Creates encouragement notifications
- System (Behavioral Engine): Creates recovery notifications
- System (Scheduler): Creates task reminders
- User: Marks as read (read_at timestamp)
- Access control: `auth.uid() = user_id`


**Notification Types:**

- `reminder`: "Time to complete your workout"
- `encouragement`: "You're on a 7-day streak!"
- `milestone`: "You completed Phase 1!"
- `recovery`: "Let's adjust your plan together"
- `call_scheduled`: (Future feature)


**Delivery Strategy (V1):**

- In-app only (query unread notifications)
- V2: Push notifications, email digests


---

### **6. Community**(Deferred to V2)

**Object:** Group accountability space

**Fields:**

- name, description, category
- member_count, is_public


**Who Owns:** System/admins**Who Edits:**

- System: Creates communities
- Users: Can join (create membership record)
- Access control: Public read (`is_public = TRUE`), anyone can join


---

### **7. Community Membership**(Deferred to V2)

**Object:** User's participation in a community

**Fields:**

- user_id, community_id, optional goal_id
- share_progress flag


**Who Owns:** The user**Who Edits:**

- User: Joins/leaves communities, toggles progress sharing
- Access control: `auth.uid() = user_id`


---

## Ownership & Edit Permissions Summary

| Object | Owner | Can Read | Can Write | RLS Policy
|-----|-----|-----|-----|-----
| **User Profile** | Self | Self only | Self (preferences) / System (metrics) | `auth.uid() = id`
| **Goal** | User | Self only | Self (status) / System (behavioral data) | `auth.uid() = user_id`
| **Task** | User (via Goal) | Self only | Self (completion) / System (difficulty) | Via goal ownership
| **Chat Message** | User | Self only | Self (send) / AI (respond) | `auth.uid() = user_id`
| **Notification** | User | Self only | System (create) / Self (mark read) | `auth.uid() = user_id`
| **Community** | System | Anyone (if public) | Anyone (join) | Public read
| **Membership** | User | Self only | Self (join/leave) | `auth.uid() = user_id`


---

## Critical Data Flow

### **User Action → System Response:**

1. **User creates goal** ("I want to run 5K")

1. Creates Goal record (status: active, plan_version: 1)
2. AI generates Tasks (3-20 tasks with difficulty, frequency)
3. Creates ChatMessage (role: assistant, type: plan_generation)
4. User owns all created records



2. **User completes task**

1. Updates Task.status = 'completed', Task.completed_at = now
2. System recalculates Goal.consistency_metrics (streak++, completion rate)
3. If milestone reached → System creates Notification (type: milestone)



3. **User skips 3 tasks**

1. Updates Task.status = 'skipped' for each
2. System detects Goal.failure_recovery.consecutiveFailures = 3
3. Behavioral Engine triggers recalibration
4. Updates Goal.plan_version++, adjusts Task.difficulty
5. Creates ChatMessage (type: encouragement)
6. Creates Notification (type: recovery)



4. **User archives goal**

1. Updates Goal.is_archived = true
2. Goal stays in database but filtered from main view
3. All Tasks remain queryable for analytics





---

## Data Access Patterns (for indexing)

**Hot paths:**

- User login → Query goals by user_id (indexed)
- Goal detail → Query tasks by goal_id (indexed)
- Dashboard → Query goals WHERE user_id = X AND is_archived = false
- Task list → Query tasks WHERE goal_id = X AND status = 'pending' ORDER BY due_date
- Notifications → Query WHERE user_id = X AND read_at IS NULL


**Write patterns:**

- Task completion: ~3-5 writes/day per active user
- Behavioral metrics: ~1 update per task completion
- Chat messages: ~2-5/day in conversational mode (V1.5+)


**No cross-user queries:** RLS enforces complete isolation. Users can never see others' goals/tasks unless explicitly shared in communities (V2).
