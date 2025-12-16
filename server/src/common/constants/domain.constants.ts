/**
 * Domain constants derived from Backend Specification.
 * These values are used for behavioral engine rules and validation.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling
 */

// ============================================
// Behavioral Engine Thresholds
// @see BACKEND SPECIFICATION Section 6
// ============================================

/**
 * Number of consecutive task failures before flagging as "struggling".
 */
export const CONSECUTIVE_FAILURES_THRESHOLD = 3;

/**
 * Completion rate threshold (as percentage) for "critical" status.
 * If completion rate < 10% for CRITICAL_PERIOD_DAYS, user is critical.
 */
export const CRITICAL_COMPLETION_RATE_THRESHOLD = 10;

/**
 * Number of days to evaluate for critical completion rate.
 */
export const CRITICAL_PERIOD_DAYS = 5;

/**
 * Number of inactive days before flagging as "abandonment risk".
 */
export const ABANDONMENT_RISK_DAYS = 7;

// ============================================
// Adaptation Constraints
// @see BACKEND SPECIFICATION Section 7 & 8
// ============================================

/**
 * Maximum difficulty level change per adaptation (±1 level).
 */
export const MAX_DIFFICULTY_JUMP = 1;

/**
 * Days to block re-application of rejected adaptation.
 */
export const ADAPTATION_BLOCK_DAYS = 7;

/**
 * Default rollback window in days (if not specified elsewhere).
 */
export const ROLLBACK_WINDOW_DAYS = 7;

// ============================================
// Harm Detection Thresholds
// @see BACKEND SPECIFICATION Section 11
// ============================================

/**
 * Number of tasks marked "unrealistic" before triggering harm signal.
 */
export const UNREALISTIC_TASK_THRESHOLD = 5;

/**
 * Consistency drop percentage that triggers harm signal.
 */
export const CONSISTENCY_DROP_THRESHOLD = 30;

// ============================================
// Performance Constraints
// @see BACKEND SPECIFICATION Section 13
// ============================================

/**
 * Maximum time allowed for goal generation (milliseconds).
 */
export const GOAL_GENERATION_TIMEOUT_MS = 10000;

/**
 * Maximum time allowed for task update (milliseconds).
 */
export const TASK_UPDATE_TIMEOUT_MS = 200;
