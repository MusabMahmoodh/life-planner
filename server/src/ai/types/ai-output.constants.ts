/**
 * AI Output Validation Constants
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see LLM INPUT CONTRACT Section 7 - AI Validation Rules
 *
 * These constants define hard limits for AI-generated content.
 * All AI outputs MUST be validated against these constraints.
 *
 * NO DEFAULTS - validation must reject invalid data, not fix it.
 */

// ============================================
// Task Constraints
// ============================================

/**
 * Maximum tasks per goal.
 * AI cannot generate more than this.
 */
export const MAX_TASKS_PER_GOAL = 20;

/**
 * Minimum tasks per goal.
 * A goal must have at least 1 task.
 */
export const MIN_TASKS_PER_GOAL = 1;

/**
 * Maximum task title length.
 */
export const MAX_TASK_TITLE_LENGTH = 200;

/**
 * Minimum task title length.
 */
export const MIN_TASK_TITLE_LENGTH = 1;

/**
 * Minimum estimated duration in minutes.
 */
export const MIN_ESTIMATED_DURATION_MINUTES = 5;

/**
 * Maximum estimated duration in minutes (8 hours).
 */
export const MAX_ESTIMATED_DURATION_MINUTES = 480;

// ============================================
// Goal Constraints
// ============================================

/**
 * Maximum goal title length.
 */
export const MAX_GOAL_TITLE_LENGTH = 200;

/**
 * Minimum goal title length.
 */
export const MIN_GOAL_TITLE_LENGTH = 1;

/**
 * Maximum explanation length.
 */
export const MAX_EXPLANATION_LENGTH = 1000;

// ============================================
// Adaptation Constraints
// ============================================

/**
 * Maximum buffer days that can be added.
 */
export const MAX_BUFFER_DAYS = 14;

/**
 * Minimum buffer days.
 */
export const MIN_BUFFER_DAYS = 1;

/**
 * Maximum reason text length.
 */
export const MAX_REASON_LENGTH = 500;

/**
 * Minimum reason text length.
 */
export const MIN_REASON_LENGTH = 1;
