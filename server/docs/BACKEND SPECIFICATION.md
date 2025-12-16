# **BACKEND SPECIFICATION**

## Smart Life Planner — NestJS Backend

---

## 1. Backend Responsibilities (non-negotiable)

The backend is responsible for **behavioral correctness**, not UI convenience.

Your backend must guarantee:

1. **Behavioral state is accurate**
2. **AI never violates guardrails**
3. **All adaptations are auditable**
4. **User control is enforceable**
5. **Data isolation is absolute**

If frontend lies → backend rejects.
If AI hallucinates → backend validates.

---

## 2. Architecture Overview

### Stack

* **Framework:** NestJS (Node 20+)
* **Language:** TypeScript (strict)
* **Database:** PostgreSQL (Supabase / Neon)
* **Auth:** Supabase Auth (JWT via cookies)
* **AI:** OpenAI via Vercel AI Gateway / OpenAI SDK
* **ORM:** Prisma or Supabase SQL (choose ONE, don’t mix)
* **Queue (optional V1.1):** BullMQ / Redis (not required V1)

### Layering (enforced)

```
Controller → Service → Domain Logic → Persistence
                     → AI Gateway
                     → Behavioral Engine
```

No AI calls in controllers.
No DB logic in controllers.
No “smart” frontend assumptions.

---

## 3. Core Domain Modules (NestJS)

You MUST structure the backend by **domain**, not by tech.

```
src/
├── auth/
├── users/
├── goals/
├── tasks/
├── behavior/
├── adaptations/
├── ai/
├── notifications/
├── audit/
├── common/
```

---

## 4. Authentication & Security

### Auth Model

* Use **Supabase Auth**
* Backend trusts `auth.uid()` only
* No custom JWT logic

### Enforcement

* Every request must resolve `userId`
* All queries scoped by `userId`
* RLS is mandatory at DB level
* Backend **must not bypass RLS**

---

## 5. Data Models (Backend Truth)

### User

```ts
User {
  id: UUID
  email: string
  timezone: string
  preferences: {
    communicationStyle
    difficultyPreference
    reminderTimes[]
  }
}
```

---

### Goal

```ts
Goal {
  id: UUID
  userId: UUID
  title: string
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  isArchived: boolean

  planVersion: number
  originalPlan: text

  consistencyMetrics: JSONB
  failureRecovery: JSONB
  progressSignals: JSONB

  createdAt
  updatedAt
}
```

---

### Task

```ts
Task {
  id: UUID
  goalId: UUID
  title: string
  status: 'pending' | 'completed' | 'skipped' | 'overdue'
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  frequency: 'daily' | 'weekly' | 'milestone'
  estimatedDuration
  actualDuration
  isOptional
  orderIndex
}
```

---

### Adaptation (CRITICAL)

```ts
Adaptation {
  id: UUID
  goalId: UUID
  type: 'difficulty_change' | 'reschedule' | 'buffer_add'
  reason: string
  previousState: JSONB
  newState: JSONB
  status: 'suggested' | 'accepted' | 'rejected' | 'rolled_back'
  createdBy: 'system' | 'user'
  createdAt
}
```

This table is **mandatory**.
No silent AI changes allowed.

---

## 6. Behavioral Engine (Core Intelligence)

### Inputs

* Task completion events
* Skip events
* Overdue events
* Time gaps
* Engagement frequency

### Outputs

* Failure detection
* Adaptation proposals
* Recovery mode signals

### Failure Detection Rules (V1)

```ts
if (consecutiveFailures >= 3) → struggling
if (completionRate < 10% for 5 days) → critical
if (user inactive 7 days) → abandonment risk
```

### Behavioral Engine MUST:

* Be deterministic
* Be testable
* Never call AI directly

---

## 7. AI Integration Rules (STRICT)

### AI CAN:

* Generate plans
* Suggest adaptations
* Generate explanations

### AI CANNOT:

* Write to DB directly
* Apply irreversible changes
* Decide without backend validation

### Flow

```
Backend → AI → validate → store as suggestion → wait for user
```

### Validation Rules

* Max tasks per goal
* Max difficulty jump (±1 level)
* No destructive changes
* Schema validation (Zod)

---

## 8. Adaptation Lifecycle (Very Important)

### 1. Detect

Behavioral engine triggers adaptation.

### 2. Propose

AI generates proposal → stored as `Adaptation (suggested)`.

### 3. Decide

User:

* Accepts → apply + log
* Rejects → mark rejected
* Ignores → expire

### 4. Apply

* Increment `planVersion`
* Snapshot previous state
* Apply new state

### 5. Rollback

* Restore snapshot
* Mark adaptation as `rolled_back`
* Block reapplication for 7 days

---

## 9. API Endpoints (Backend Contract)

### Goals

```
POST   /goals/generate
GET    /goals
GET    /goals/:id
PATCH  /goals/:id
```

### Tasks

```
PATCH  /tasks/:id/complete
PATCH  /tasks/:id/skip
```

### Adaptations

```
GET    /adaptations/:goalId
POST   /adaptations/:id/accept
POST   /adaptations/:id/reject
POST   /adaptations/:id/rollback
```

### Behavior

```
POST   /behavior/evaluate
```

### AI

```
POST   /ai/generate-goal
POST   /ai/propose-adaptation
```

AI endpoints are **internal only**.

---

## 10. Notifications (V1)

* In-app only
* Created by backend
* Never sent directly by AI

Notification triggers:

* Adaptation proposed
* Adaptation accepted
* Recovery mode entered

---

## 11. Failure Handling (Product Safety)

### Harm Signals

* User marks ≥5 tasks “unrealistic”
* Consistency drops ≥30% post-adaptation
* User messages “overwhelmed / quitting”

### Backend MUST:

* Force difficulty reduction
* Disable auto-adaptation
* Log incident
* Require user confirmation to proceed

This is **not optional**.

---

## 12. Testing Requirements (Backend)

You must write tests for:

* Failure detection
* Adaptation proposal validation
* Rejection & rollback logic
* RLS enforcement (user isolation)
* Idempotent task completion

No tests → no production.

---

## 13. Non-Functional Requirements

### Performance

* Goal generation < 10s
* Task update < 200ms
* DB queries indexed on `userId`, `goalId`

### Security

* No cross-user queries
* No raw SQL without parameterization
* All AI outputs validated

---

## 14. Backend Success Criteria

Backend is considered **done** when:

* AI cannot mutate state without user consent
* Every adaptation is auditable
* Rollback always works
* Failure recovery is deterministic
* User isolation is provable

---

## 15. Backend Philosophy (Read This)

You are **not** building endpoints.

You are building a **behaviorally safe system** where:

* AI assists
* Backend governs
* User remains in control

If frontend breaks rules → backend refuses.

That’s your job.

---



