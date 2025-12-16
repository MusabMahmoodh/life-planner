# Product Guardrails

## What AI Can Decide Alone

**Detection & Measurement**
- Calculate consistency scores (0-100)
- Track completion velocity and patterns
- Detect consecutive failures (3+)
- Measure time-of-day performance patterns
- Identify struggle signals (low velocity + high failure rate)

**Non-Destructive Suggestions**
- Generate candidate task breakdowns
- Propose milestone timelines
- Estimate task difficulty ratings
- Suggest time allocations

**Logging & Analytics**
- Record all user actions and outcomes
- Generate progress reports
- Create behavioral pattern summaries

## What Requires User Confirmation

**Plan Modifications**
- Difficulty adjustments (easier or harder)
- Task redistribution across days
- Adding/removing recovery buffers
- Changing milestone order or deadlines

**Goal Changes**
- Breaking down new high-level goals into tasks
- Marking goals as completed or abandoned
- Merging or splitting existing goals

**Schedule Alterations**
- Moving tasks to different time blocks
- Changing daily task limits
- Adjusting work/rest ratios

**User Must See & Accept:**
- Clear preview of what will change
- Reason for the suggestion (data-driven explanation)
- Option to reject, modify, or accept

## What Can Be Rolled Back

**Within 24 Hours of Change:**
- Difficulty adjustments (restore previous levels)
- Task redistributions (restore previous schedule)
- AI-generated task breakdowns (restore manual state)
- Milestone timeline changes

**What Gets Saved for Rollback:**
- Previous task list state (JSON snapshot)
- Previous difficulty assignments
- Previous schedule/time blocks
- Timestamp of change
- Type of change (user-initiated vs AI-suggested)

**Rollback Limitations:**
- Cannot undo task completions (data integrity)
- Cannot restore deleted goals (permanent action)
- Cannot rollback beyond 24 hours (prevents state confusion)

## What Is Never Automatic

**User Identity & Goals**
- Creating or deleting user accounts
- Setting high-level life goals
- Defining what "success" means personally

**Permanent Destructive Actions**
- Deleting goals entirely
- Clearing all task history
- Removing user data

**External Actions**
- Sending notifications without permission
- Sharing data with third parties
- Charging money or subscriptions

**Overriding Explicit User Choices**
- If user manually sets task difficulty, AI cannot auto-adjust it
- If user schedules a task for specific time, AI cannot move it
- If user marks adaptation as "rejected", AI cannot re-apply same change within 7 days

## What Defines Product Failure

**Retention Failures (User Abandons Product)**

*Critical Threshold: 7 consecutive days inactive*

**Warning Signs:**
- User has not opened app in 3+ days
- Completion rate drops below 10% for 5+ consecutive days
- User rejects 3+ consecutive AI adaptations
- User deletes all goals or creates goals but never adds tasks

**Recovery Actions:**
- Send gentle re-engagement prompt (not nagging)
- Offer "reset plan" with simpler starting point
- Ask explicit question: "Is this app helping or adding stress?"

**System Failures (AI Creates Harm)**

*Critical Threshold: User explicitly reports negative impact*

**Failure Indicators:**
- User marks 5+ tasks as "unrealistic" in single session
- Consistency score decreases by 30+ points after AI adaptation
- User sends message containing: "too much", "overwhelmed", "giving up", "not working"
- User creates goal, immediately abandons it, pattern repeats 3+ times

**Mandatory Response:**
- Immediately reduce all difficulty by one level
- Clear any pending automatic adaptations
- Show explicit message: "Let's simplify. What's one small thing you can do today?"
- Log as product failure event for review

**Success Metrics (Inverse of Failure)**
- 70%+ of adaptations accepted by users
- Consistency scores trend upward over 30 days
- Users return 4+ times per week
- Completion rate stabilizes at 60%+ after first 14 days
- Users mark <10% of AI suggestions as "wrong"

---

**Last Updated:** 2025-01-15  
**Owner:** Product Team  
**Review Cadence:** After every 100 new users

