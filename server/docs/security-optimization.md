# 6. Are there performance, security, or scale expectations I should design for now rather than later?

## Design Now vs. Optimize Later

### **MUST Design For Now**

#### 1. Security (Non-Negotiable)
**Why:** Can't patch security holes retroactively without breaking trust

**V1 Requirements:**
- ✅ **Row Level Security (RLS)** - Already in schema
  ```sql
  -- Users can only access their own data
  CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);
  ```
  **Critical:** This MUST be in place before launch. No way to migrate without exposing data temporarily.

- ✅ **Input Validation** - All user inputs sanitized
  - Goal text: Max 500 chars, strip HTML
  - Task updates: Validate status enum values
  - SQL injection prevention: Use parameterized queries (Supabase handles this)
  
- ✅ **Rate Limiting on AI Endpoints**
  - `/api/goals/generate`: Max 5 requests/hour per user
  - Prevents cost abuse (GPT-5 is expensive)
  - Add to V1: Simple in-memory counter or Vercel rate limiting

- ⚠️ **Session Management**
  - Use Supabase Auth's built-in sessions (HTTP-only cookies)
  - Don't roll custom JWT handling

**Skip for now:**
- CAPTCHA (add if bot abuse detected)
- Advanced threat detection
- Penetration testing (do after product-market fit)

---

#### 2. Performance (Immediate Experience)
**Why:** Users bounce if AI takes >10 seconds or UI feels laggy

**V1 Requirements:**

**a) AI Response Time**
- ✅ **Streaming Required** - Already implemented
  ```typescript
  // In /api/chat/goal/route.ts
  return result.toUIMessageStreamResponse()
  ```
  **Why:** Goal generation takes 5-10 seconds. Must show progressive output or users think it's broken.
  
- ✅ **Loading States Everywhere**
  - Goal generation: Spinner + "Analyzing your goal..."
  - Task completion: Optimistic UI update (mark complete immediately, sync in background)
  
**b) Database Query Performance**
- ✅ **Indexes on Hot Paths** - Already in schema
  ```sql
  CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
  CREATE INDEX idx_goals_user_id ON goals(user_id);
  ```
  **Why:** Every page load queries goals by user_id. Every goal detail page queries tasks by goal_id.

- ⚠️ **Limit Result Sets**
  ```typescript
  // Add to V1
  const goals = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .limit(50) // Don't load 1000 goals
  ```

**c) Client-Side Caching**
- ✅ **SWR for Data Fetching** - Use throughout
  ```typescript
  const { data: goals } = useSWR('/api/goals', fetcher, {
    revalidateOnFocus: false, // Don't refetch every tab switch
    dedupingInterval: 5000 // Don't refetch same data within 5 secs
  })
  ```

**Skip for now:**
- Image optimization (no user-uploaded images yet)
- CDN for static assets (Vercel handles this)
- Redis caching (premature at <1000 users)
- Database connection pooling (Supabase handles this)

---

#### 3. Scale Expectations (Design for Real Usage)

**V1 Target: 100-1,000 active users**

**Design decisions for this scale:**

**a) AI Cost Management** 🚨 CRITICAL
- **Problem:** GPT-5 costs ~$0.015/1K input tokens, $0.060/1K output tokens
- **Risk:** If goal generation uses 2K input + 2K output = $0.15 per goal
- **Budget:** 1,000 users × 3 goals each × $0.15 = $450/month

**V1 Solution:**
```typescript
// Add to /api/goals/generate
const MAX_GOALS_PER_USER = 3; // Free tier limit
const MAX_TASKS_PER_GOAL = 20; // Limit output tokens

// Check before generating
const existingGoals = await getGoalCount(userId);
if (existingGoals >= MAX_GOALS_PER_USER) {
  return Response.json(
    { error: 'Goal limit reached' },
    { status: 429 }
  );
}
```

**Don't over-optimize:**
- Don't build cost analytics dashboard yet
- Don't implement token counting (monitor via Vercel logs)

---

**b) Database Design**
- ✅ **Use JSONB for Behavioral Data** - Already in schema
  ```sql
  consistency_metrics JSONB,
  failure_recovery JSONB,
  progress_signals JSONB
  ```
  **Why:** These fields change frequently. Don't need separate tables yet.
  
  **When to normalize:** If querying consistency_score directly (e.g., "top 10 most consistent users"). Not needed in V1.

- ✅ **Soft Deletes Over Hard Deletes**
  ```sql
  status VARCHAR CHECK (status IN ('active', 'completed', 'paused', 'abandoned'))
  ```
  **Why:** Users may want to "undelete" goals. Analytics need historical data.

---

**c) API Design**
- ⚠️ **Pagination Not Required Yet**
  - Average user will have 1-3 goals in first month
  - Add pagination when users report slow loading (>50 goals)

- ✅ **Idempotent Operations**
  ```typescript
  // Task completion must be idempotent
  // Clicking "complete" twice shouldn't create duplicate records
  await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: now })
    .eq('id', taskId)
    .eq('status', 'pending') // Only update if still pending
  ```

---

### **Explicitly DON'T Design For**

#### ❌ Massive Scale (10K+ concurrent users)
**Why:** Premature optimization kills velocity
- Don't architect for horizontal scaling
- Don't build custom caching layers
- Don't worry about multi-region deployment

**When to revisit:** If you hit 5K+ DAU

---

#### ❌ Real-Time Collaboration
**Why:** This is a single-player app
- No WebSocket infrastructure
- No conflict resolution
- No operational transforms

**When to add:** V3 if adding team goals

---

#### ❌ Complex Analytics
**Why:** Not needed to prove V1 hypothesis
- Don't build data warehouse
- Don't implement event tracking system
- Don't create admin dashboards

**What to do instead:** 
- Add simple Vercel Analytics
- Query database directly for insights

---

#### ❌ High Availability (99.99% uptime)
**Why:** Early users are forgiving
- Vercel handles 99.9% uptime by default
- Database downtime is rare with Supabase/Neon
- Don't build health checks, failovers, circuit breakers

**When to add:** If app becomes business-critical (V2)

---

## V1 Performance Targets

| Metric | Target | Why | How to Measure |
|--------|--------|-----|----------------|
| **Goal generation** | <10 sec | Users will abandon | Log API duration |
| **Page load (dashboard)** | <2 sec | First impression | Lighthouse score |
| **Task completion response** | <200ms | Must feel instant | Optimistic UI |
| **API rate limit** | 5 goals/hour | Prevent abuse | In-memory counter |
| **Max goals per user** | 3 free tier | Control AI costs | Database query |
| **Database queries** | <50ms (p95) | Avoid lag | Supabase logs |

---

## V1 Security Checklist

- [x] Row Level Security enabled on all tables
- [x] Supabase Auth with email/password
- [x] Input validation on all endpoints
- [x] Rate limiting on AI endpoints
- [x] HTTPS only (Vercel default)
- [x] HTTP-only cookies for sessions
- [ ] **Add:** Max goal text length (500 chars)
- [ ] **Add:** Max tasks per goal (20)
- [ ] **Test:** Can user A access user B's goals? (should fail)

---

## Technical Debt Acceptance

**What we're punting to V2:**
- Redis/caching layer
- Advanced rate limiting (DDoS protection)
- Event sourcing for behavioral data
- Separate analytics database
- A/B testing infrastructure
- Feature flags system
- Comprehensive logging/monitoring
- Error tracking (Sentry)

**Why this is okay:**
V1 needs to validate that users care about adaptive goal planning. If retention is <20%, fancy infrastructure won't save it. If retention is >30%, you'll have budget to build it right.

**One exception: Security can't be retrofitted. Everything else can.**
