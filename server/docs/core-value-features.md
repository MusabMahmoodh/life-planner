# 5. List the features that must exist for this app to be considered ‘working’, and what can be skipped in v1.


## Must-Have for V1 (Core Value Proof)

### **Critical Path: Create → Complete → Fail → Adapt → Succeed**

#### 1. AI Goal Generation ✅ ESSENTIAL
**Why:** Without this, it's just another todo app
- Natural language input
- Structured plan output (milestones, tasks, difficulty, frequency)
- Basic validation (goal must be achievable, timebound)

#### 2. Task Completion System ✅ ESSENTIAL
**Why:** Users need to generate behavioral data
- View task list
- Mark task complete/skip
- See completion status update in real-time

#### 3. Basic Progress Tracking ✅ ESSENTIAL
**Why:** Immediate feedback loop (dopamine hit on day 1)
- Current streak counter
- Completion percentage
- Task count (X/Y completed)
- Simple progress bar

#### 4. Failure Detection ✅ ESSENTIAL
**Why:** This is the core differentiator
- Track consecutive skips/failures
- Detect when user is struggling (3+ consecutive failures)
- Store failure state in database

#### 5. Automatic Plan Adaptation ✅ ESSENTIAL
**Why:** Proves the intelligence works - this IS the product
- Behavioral engine runs on failure detection
- Auto-reduce task difficulty
- Add buffer/rest days
- Update tasks in database

#### 6. Basic Notification System ✅ ESSENTIAL
**Why:** Brings users back after failure
- In-app notification when plan adapts
- Simple message: "We've adjusted your plan"
- No email/push needed yet

#### 7. Goal Dashboard ✅ ESSENTIAL
**Why:** Users need to see their goals
- List of active goals
- Basic goal card (title, coach name, progress)
- Tap to view details

#### 8. Authentication ✅ ESSENTIAL
**Why:** Can't track behavior without persistent users
- Email/password signup
- Supabase Auth
- Basic user session management

---

## Nice-to-Have but NOT Critical for V1

### Can Be Faked/Simplified

#### 9. AI Chat Interface ⚠️ DEFER to V1.5
**Why skip:** Users can experience value without chatting
**Alternative:** Just show system-generated messages as notifications
- "Your plan has been adjusted based on recent struggles"
- Pre-written responses, not real-time AI chat
**Add later:** Once core loop proves retention

#### 10. Consistency Score Calculation ⚠️ SIMPLIFY
**Why skip complex formula:** Simple % is enough
**V1 version:** `completedTasks / totalTasks × 100`
**Skip for now:** 
- Weighted formulas
- Streak bonuses
- Recency penalties
**Add later:** After seeing what actually correlates with retention

#### 11. Progress Analytics Dashboard ❌ SKIP
**Why skip:** Users don't need charts on day 1
**V1 version:** Just show streak + completion %
**Skip for now:**
- Line charts
- Time-of-day heatmaps
- Difficulty distribution pie charts
**Add later:** Week 3-4 when users have data worth visualizing

#### 12. Communities ❌ SKIP ENTIRELY
**Why skip:** Social features are distractions from core loop
**Doesn't validate:** Whether adaptive intelligence works
**Add later:** V2 after proving retention

#### 13. Coach Personas/Customization ⚠️ SIMPLIFY
**Why skip:** Doesn't affect adaptation quality
**V1 version:** All goals use "Coach Alex", no customization
**Skip for now:**
- Custom coach names
- Communication style preferences
- Avatar selection
**Add later:** Once we know if users care

#### 14. Voice Mode ❌ SKIP
**Why skip:** Complex, not needed for value proof
**Add later:** V3+

#### 15. Scheduled Calls ❌ SKIP
**Why skip:** Operational complexity, not core to product
**Add later:** V3+ if product succeeds

#### 16. Archive System ⚠️ DEFER
**Why skip:** Users won't have old goals in week 1-4
**V1 version:** Just show all goals, no archive
**Add later:** V1.5 when users complain about clutter

#### 17. Multiple Goal Categories ⚠️ SIMPLIFY
**Why skip:** Doesn't affect core mechanics
**V1 version:** Everything is just "Personal Goals"
**Add later:** V2 when analyzing what categories users create

#### 18. Time-of-Day Optimization ❌ SKIP
**Why skip:** Requires weeks of data collection
**Add later:** V2 after behavioral patterns emerge

#### 19. Search & Filters ⚠️ DEFER
**Why skip:** Users won't have enough goals to search in V1
**Add later:** When users have 5+ goals

---

## V1 Feature Matrix

| Feature | Status | Reason |
|---------|--------|--------|
| **AI Goal Generation** | ✅ MUST HAVE | Core value prop |
| **Task List & Completion** | ✅ MUST HAVE | Generates data |
| **Failure Detection** | ✅ MUST HAVE | Core algorithm |
| **Auto Plan Adaptation** | ✅ MUST HAVE | The differentiator |
| **Basic Progress (streak, %)** | ✅ MUST HAVE | Day 1 dopamine |
| **Goal Dashboard** | ✅ MUST HAVE | View goals |
| **Authentication** | ✅ MUST HAVE | Persistent users |
| **Simple Notifications** | ✅ MUST HAVE | Re-engagement |
| | | |
| **AI Chat Interface** | ⚠️ V1.5 | Use static messages |
| **Consistency Score** | ⚠️ SIMPLIFY | Just use % |
| **Analytics Charts** | ❌ V2 | Not needed early |
| **Communities** | ❌ V2 | Distraction |
| **Coach Customization** | ❌ V1.5 | Nice-to-have |
| **Archive System** | ❌ V1.5 | No clutter yet |
| **Voice Mode** | ❌ V3 | Complex |
| **Search/Filters** | ❌ V1.5 | Not enough goals |
| **Time-of-Day Learning** | ❌ V2 | Need data first |

---

## V1 Success Criteria

**The app is "working" when:**

1. ✅ User can create goal from natural language in <15 seconds
2. ✅ User sees task list and can mark tasks complete
3. ✅ Progress updates immediately (streak, %)
4. ✅ After 3 consecutive failures, system detects it
5. ✅ Plan automatically adjusts difficulty within 24 hours
6. ✅ User receives notification about adjustment
7. ✅ Adjusted tasks appear easier than original
8. ✅ User can complete 30-day cycle without app breaking

**Validation test:**
- 10 users try the app
- 5+ still using after 30 days
- 80%+ of those who failed 3+ times received auto-adjustments
- Users report: "The app adapted when I struggled"

**If these work, the core hypothesis is validated. Everything else is optimization.**
