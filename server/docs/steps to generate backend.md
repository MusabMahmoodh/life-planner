Perfect. Below is the **exact prompt text** you should paste into the LLM **for each step**, in the **only safe order**.

These prompts are written to:

* Prevent hallucination
* Enforce boundaries
* Force the model to stop instead of guessing
* Keep regeneration safe and local

⚠️ **Rule:**
**Run ONE prompt at a time. Never merge steps. Never “continue”.**

---

# 🔒 GLOBAL PREFIX (PASTE BEFORE EVERY STEP)

> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

---

# PHASE 0 — FOUNDATION

## STEP 0.1 — NestJS Project Skeleton

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate a NestJS project skeleton using Node.js 20 and TypeScript strict mode.

Include:
- main.ts
- app.module.ts
- global ValidationPipe
- global ExceptionFilter
- ConfigModule with env validation

Do NOT include:
- business logic
- controllers
- services
- database code

Explain the file structure briefly, then output the code.
```

---

## STEP 0.2 — Shared Enums & Constants

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate shared domain enums and constants for the backend.

Include:
- TaskStatus
- DifficultyLevel
- AdaptationStatus
- GoalStatus
- DomainErrorCodes

Place them under src/common/.

Do NOT add logic or services.
Do NOT invent new enums.
```

---

# PHASE 1 — DATA CONTRACT

## STEP 1.1 — Prisma Schema

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate a Prisma schema for PostgreSQL with the following models:

- User
- Goal
- Task
- Adaptation

Rules:
- Follow the domain models exactly
- Include relations and indexes
- Use JSONB where specified
- Enforce user ownership via foreign keys
- No AI-specific fields yet

Output only schema.prisma.
```

---

## STEP 1.2 — Repository Layer

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate repository classes for:

- GoalRepository
- TaskRepository
- AdaptationRepository

Rules:
- Each repository must scope queries by userId
- No business logic
- No AI calls
- No behavioral logic
- CRUD only

Use Prisma Client.
```

---

# PHASE 2 — DOMAIN LOGIC (NO AI)

## STEP 2.1 — Behavioral Engine

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate a BehavioralEngine service.

Responsibilities:
- Calculate completion rate
- Track consecutive failures
- Detect inactivity
- Return structured behavioral signals

Rules:
- Deterministic logic only
- No database access
- No AI calls
- No side effects
- Fully testable

Export pure functions where possible.
```

---

## STEP 2.2 — Adaptation Rules Engine

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate an AdaptationRules service.

Responsibilities:
- Convert behavioral signals into AdaptationIntent objects

Rules:
- No database access
- No AI calls
- No side effects
- Output intents only (suggest, not apply)

Define AdaptationIntent type explicitly.
```

---

# PHASE 3 — AI (QUARANTINED)

## STEP 3.1 — AI Gateway

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate an AIGateway service.

Responsibilities:
- generateGoalPlan()
- proposeAdaptation()

Rules:
- No database access
- No business logic
- No state mutation
- All outputs must be validated
- Use OpenAI client abstraction
- Handle timeouts and errors gracefully

Do NOT apply changes.
```

---

## STEP 3.2 — AI Output Validators

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate Zod schemas for validating AI outputs.

Include:
- GoalPlanSchema
- TaskSchema
- AdaptationProposalSchema

Rules:
- Enforce max task count
- Enforce difficulty bounds
- Reject invalid structures
- No defaults
```

---

# PHASE 4 — APPLICATION SERVICES

## STEP 4.1 — Goal Service

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate GoalService.

Flow:
1. Receive goal creation request
2. Call AIGateway.generateGoalPlan
3. Validate output
4. Persist Goal and Tasks
5. Initialize behavioral metrics

Rules:
- No controller logic
- No AI logic inside service
- Use repositories only
```

---

## STEP 4.2 — Task Service

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate TaskService.

Responsibilities:
- Complete task (idempotent)
- Skip task
- Emit behavior evaluation trigger

Rules:
- No adaptation logic
- No AI calls
- Enforce user ownership
```

---

## STEP 4.3 — Adaptation Service

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate AdaptationService.

Responsibilities:
- Store adaptation suggestions
- Accept adaptation
- Reject adaptation
- Rollback adaptation

Rules:
- Snapshot previous state
- Enforce rollback window
- Block re-application for 7 days
- All state changes must be auditable
```

---

# PHASE 5 — CONTROLLERS (THIN)

## STEP 5.1 — Goal Controller

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate GoalController.

Expose:
- POST /goals/generate
- GET /goals
- GET /goals/:id

Rules:
- DTO validation only
- No business logic
- No AI calls
```

---

## STEP 5.2 — Task Controller

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate TaskController.

Expose:
- PATCH /tasks/:id/complete
- PATCH /tasks/:id/skip

Rules:
- No logic beyond delegation
```

---

## STEP 5.3 — Adaptation Controller

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate AdaptationController.

Expose:
- GET /adaptations/:goalId
- POST /adaptations/:id/accept
- POST /adaptations/:id/reject
- POST /adaptations/:id/rollback

Rules:
- Enforce user ownership
- No business logic
```

---

# PHASE 6 — SAFETY & AUDIT

## STEP 6.1 — Audit Service

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate AuditService.

Responsibilities:
- Log adaptation lifecycle events
- Log harm incidents
- Store immutable audit records

Rules:
- Append-only
- No business logic
```

---

## STEP 6.2 — Harm Detection Service

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate HarmDetectionService.

Responsibilities:
- Detect stress or harm signals
- Force plan simplification
- Disable auto-adaptation temporarily
- Log incident

Rules:
- Deterministic triggers
- No AI calls
```

---

# PHASE 7 — TESTS

## STEP 7.1 — Behavioral Engine Tests

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate unit tests for BehavioralEngine.

Cover:
- Failure detection
- Inactivity detection
- Completion rate calculation

Use Jest.
```

---

## STEP 7.2 — Adaptation Lifecycle Tests

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Generate tests for AdaptationService.

Cover:
- Accept
- Reject
- Rollback
- Re-application blocking
```

---

# PHASE 8 — FINAL VERIFICATION

## STEP 8.1 — Guardrail Checklist

**Prompt:**

```
> You are a senior backend engineer generating **production-grade NestJS code**.
>
> You must strictly follow the provided Backend Specification and LLM Input Contract.
>
> Rules:
>
> * Do NOT invent features, fields, or APIs
> * Do NOT simplify business rules
> * Do NOT generate frontend code
> * Do NOT bypass guardrails
> * If information is missing, STOP and ask
>
> Output only what is explicitly requested in this step.

Produce a checklist verifying:

- AI never mutates DB
- All adaptations are auditable
- Rollback works
- User isolation enforced
- Guardrails respected

Do not generate code.
```

---

# 🚨 FINAL WARNING (READ THIS)

If you:

* skip steps
* merge prompts
* allow the model to “continue”
* regenerate without re-feeding constraints

You **will** get silent hallucinations.

This sequence prevents that.

---

## If you want next (high value)

I can:

1. Generate a **single copy-paste mega-prompt template** you reuse forever
2. Create a **diff-based regen strategy** when code diverges
3. Design a **CI rule set** to enforce guardrails automatically

Say the number.
