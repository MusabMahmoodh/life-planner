# **LLM BACKEND GENERATION INPUT**

## Smart Life Planner — NestJS Backend

> **Purpose:**
> This document defines all constraints, rules, and expectations the LLM must follow when generating backend code.
> Any output that violates these rules is considered incorrect.

---

## 1. Role & Output Expectations (MANDATORY)

**You are generating code as:**

* A **senior backend engineer**
* Working in **NestJS**
* Focused on **correctness, safety, and domain logic**
* NOT inventing features or APIs

**You must:**

* Follow the domain strictly
* Avoid assumptions
* Ask for missing info only if explicitly allowed
* Generate production-ready TypeScript
* Use deterministic logic for behavioral rules

**You must NOT:**

* Add frontend code
* Invent new features
* Bypass guardrails
* Simplify business rules
* Change data models

---

## 2. Tech Stack (LOCKED)

```yaml
Language: TypeScript (strict)
Runtime: Node.js 20+
Framework: NestJS
Database: PostgreSQL
Auth: Supabase Auth (auth.uid())
ORM: Prisma (if generating schema) OR raw SQL (choose one)
AI: OpenAI (via backend service abstraction)
```

> ❗ Do NOT mix ORMs.
> ❗ Do NOT implement custom auth.

---

## 3. System Architecture Rules

### Layering (ENFORCED)

```
Controller
 → Service
   → Domain Logic
     → Behavioral Engine
     → AI Gateway
   → Repository (DB)
```

**Rules:**

* Controllers are thin
* AI calls only in AI Gateway
* DB access only via repositories
* Behavioral logic must be isolated and testable

---

## 4. Domain Modules (FIXED)

```text
auth
users
goals
tasks
behavior
adaptations
ai
notifications
audit
common
```

Each module must include:

* controller
* service
* repository
* DTOs
* validation schemas

---

## 5. Core Domain Models (DO NOT MODIFY)

### Goal

```ts
Goal {
  id: UUID
  userId: UUID
  title: string
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  isArchived: boolean
  planVersion: number
  consistencyMetrics: JSONB
  failureRecovery: JSONB
  progressSignals: JSONB
}
```

### Task

```ts
Task {
  id: UUID
  goalId: UUID
  title: string
  status: 'pending' | 'completed' | 'skipped' | 'overdue'
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  frequency: 'daily' | 'weekly' | 'milestone'
  estimatedDuration: number
  actualDuration?: number
  isOptional: boolean
}
```

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
  createdAt: Date
}
```

---

## 6. Behavioral Engine Rules (NON-NEGOTIABLE)

### Failure Detection Logic

```ts
if (consecutiveFailures >= 3) → struggling
if (completionRate < 10% for 5 days) → critical
if (inactiveDays >= 7) → abandonment_risk
```

* Must be deterministic
* Must NOT call AI
* Must return structured signals

---

## 7. AI Usage Constraints (STRICT)

### AI MAY:

* Generate goal plans
* Propose adaptations
* Generate explanations

### AI MAY NOT:

* Write to database
* Apply changes automatically
* Decide irreversible actions

### AI Output MUST:

* Be validated with schema (Zod)
* Respect max limits (tasks, difficulty)
* Be stored as `suggested`, not applied

---

## 8. Adaptation Lifecycle (MUST IMPLEMENT)

1. Behavioral Engine triggers adaptation
2. AI proposes change
3. Backend validates proposal
4. Proposal stored as `Adaptation (suggested)`
5. User accepts / rejects / ignores
6. Accepted → apply + snapshot
7. Rollback allowed within time window
8. Rejected → block re-apply for 7 days

No shortcuts allowed.

---

## 9. API Contract (DO NOT INVENT)

```http
POST   /goals/generate
GET    /goals
GET    /goals/:id

PATCH  /tasks/:id/complete
PATCH  /tasks/:id/skip

GET    /adaptations/:goalId
POST   /adaptations/:id/accept
POST   /adaptations/:id/reject
POST   /adaptations/:id/rollback
```

---

## 10. Security Rules (ABSOLUTE)

* All queries scoped by `userId`
* No cross-user access
* RLS assumed at DB level
* Backend must still enforce ownership
* Reject any request without valid user context

---

## 11. Validation & Error Handling

* All inputs validated with DTOs
* All AI outputs validated before use
* Idempotent task completion
* Clear error codes (400 / 403 / 409)

---

## 12. Testing Expectations

Generated code should include:

* Unit tests for behavioral engine
* Tests for adaptation lifecycle
* Tests for rollback logic
* Tests for user isolation

---

## 13. Output Format EXPECTED FROM LLM

When generating code, the LLM must:

* Generate one module at a time
* Explain file structure briefly
* NOT summarize business logic
* NOT skip critical parts
* NOT refactor without instruction

---

## 14. Golden Rule (READ THIS)

> **If something is ambiguous, do NOT guess.
> Either follow this document or stop.**

---

## How to Use This (IMPORTANT)

When prompting the LLM, do this:

1. Paste **this entire document**
2. Then say **ONE** command, for example:

   * “Generate Prisma schema”
   * “Generate Goals module”
   * “Generate Behavioral Engine”
3. Never ask for multiple things at once

---

## Final Reality Check

If you don’t give the LLM **this level of constraint**:

* It will hallucinate
* It will collapse domain boundaries
* It will leak AI into controllers
* It will silently break your guardrails

This document prevents that.

---

### If you want next:

I can:

1. Create **LLM prompt templates** for each module
2. Create a **step-by-step generation order** (safe sequence)
3. Generate a **“hallucination detection checklist”** for reviewing LLM output

Say the number.

