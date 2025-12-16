/**
 * Goal Service Types
 *
 * @see BACKEND SPECIFICATION Section 5 - Goal Model
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Goals)
 *
 * These types define inputs and outputs for GoalService operations.
 * No database types - these are service-level contracts.
 */

import { GoalStatus, DifficultyLevel, TaskFrequency } from '../../common/enums';

// ============================================
// Goal Creation Types
// ============================================

/**
 * Input for goal creation via AI generation.
 *
 * @see BACKEND SPECIFICATION Section 9 - POST /goals/generate
 */
export interface CreateGoalInput {
  /** User ID (from authenticated context) */
  userId: string;

  /** User's goal description (free text for AI) */
  goalDescription: string;

  /** User's timezone for scheduling */
  timezone: string;

  /** User's communication style preference */
  communicationStyle?: 'friendly' | 'direct' | 'encouraging';

  /** User's preferred difficulty level */
  difficultyPreference?: DifficultyLevel;

  /** Optional schedule context */
  scheduleContext?: string;
}

/**
 * Task data within a created goal.
 */
export interface CreatedTask {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  frequency: TaskFrequency;
  estimatedDuration: number;
  isOptional: boolean;
  orderIndex: number;
}

/**
 * Result of successful goal creation.
 */
export interface CreateGoalResult {
  /** Created goal ID */
  goalId: string;

  /** Goal title (may be refined by AI) */
  title: string;

  /** Goal status (always 'active' on creation) */
  status: GoalStatus;

  /** Plan version (always 1 on creation) */
  planVersion: number;

  /** Created tasks */
  tasks: CreatedTask[];

  /** AI-generated explanation of the plan */
  explanation: string;

  /** Timestamp of creation */
  createdAt: Date;
}

// ============================================
// Goal Query Types
// ============================================

/**
 * Options for listing goals.
 */
export interface ListGoalsOptions {
  /** Filter by status */
  status?: GoalStatus;

  /** Filter by archived state */
  isArchived?: boolean;

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;
}

/**
 * Goal summary for list responses.
 */
export interface GoalSummary {
  id: string;
  title: string;
  status: GoalStatus;
  isArchived: boolean;
  planVersion: number;
  taskCount: number;
  completedTaskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full goal details with tasks.
 */
export interface GoalDetails {
  id: string;
  title: string;
  status: GoalStatus;
  isArchived: boolean;
  planVersion: number;
  originalPlan: string | null;
  consistencyMetrics: ConsistencyMetrics;
  failureRecovery: FailureRecoveryState;
  progressSignals: ProgressSignals;
  tasks: CreatedTask[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Behavioral Metrics Types (JSONB structures)
// ============================================

/**
 * Consistency metrics stored in Goal.consistencyMetrics.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 */
export interface ConsistencyMetrics {
  /** Total task completions */
  totalCompletions: number;

  /** Total task failures (skipped + overdue) */
  totalFailures: number;

  /** Current streak of consecutive completions */
  currentStreak: number;

  /** Best streak achieved */
  bestStreak: number;

  /** Completion rate as percentage (0-100) */
  completionRate: number;

  /** Last computed at */
  lastComputedAt: string | null;

  /** Index signature for Prisma JSON compatibility */
  [key: string]: unknown;
}

/**
 * Failure recovery state stored in Goal.failureRecovery.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 */
export interface FailureRecoveryState {
  /** Current consecutive failures count */
  consecutiveFailures: number;

  /** Whether goal is in struggling state */
  isStruggling: boolean;

  /** Whether goal is in critical state */
  isCritical: boolean;

  /** Whether goal is at abandonment risk */
  isAbandonmentRisk: boolean;

  /** Date when last failure occurred */
  lastFailureAt: string | null;

  /** Date when recovery mode started (if applicable) */
  recoveryStartedAt: string | null;

  /** Index signature for Prisma JSON compatibility */
  [key: string]: unknown;
}

/**
 * Progress signals stored in Goal.progressSignals.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 */
export interface ProgressSignals {
  /** Last activity date (completion or skip) */
  lastActivityAt: string | null;

  /** Number of days since last activity */
  inactiveDays: number;

  /** First task completed date */
  firstCompletionAt: string | null;

  /** Most recent completion date */
  lastCompletionAt: string | null;

  /** Index signature for Prisma JSON compatibility */
  [key: string]: unknown;
}

// ============================================
// Initial Metrics (for new goals)
// ============================================

/**
 * Create initial consistency metrics for a new goal.
 */
export function createInitialConsistencyMetrics(): ConsistencyMetrics {
  return {
    totalCompletions: 0,
    totalFailures: 0,
    currentStreak: 0,
    bestStreak: 0,
    completionRate: 0,
    lastComputedAt: null,
  };
}

/**
 * Create initial failure recovery state for a new goal.
 */
export function createInitialFailureRecoveryState(): FailureRecoveryState {
  return {
    consecutiveFailures: 0,
    isStruggling: false,
    isCritical: false,
    isAbandonmentRisk: false,
    lastFailureAt: null,
    recoveryStartedAt: null,
  };
}

/**
 * Create initial progress signals for a new goal.
 */
export function createInitialProgressSignals(): ProgressSignals {
  return {
    lastActivityAt: null,
    inactiveDays: 0,
    firstCompletionAt: null,
    lastCompletionAt: null,
  };
}

// ============================================
// Update Types
// ============================================

/**
 * Input for updating a goal.
 *
 * @see BACKEND SPECIFICATION Section 9 - PATCH /goals/:id
 */
export interface UpdateGoalInput {
  /** New title (optional) */
  title?: string;

  /** New status (optional) */
  status?: GoalStatus;

  /** Archive/unarchive (optional) */
  isArchived?: boolean;
}

// ============================================
// Error Types
// ============================================

/**
 * Goal service error codes.
 */
export enum GoalServiceErrorCode {
  /** Goal not found or not owned by user */
  GOAL_NOT_FOUND = 'GOAL_NOT_FOUND',

  /** Goal is archived and cannot be modified */
  GOAL_ARCHIVED = 'GOAL_ARCHIVED',

  /** AI generation failed */
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',

  /** AI output validation failed */
  AI_VALIDATION_FAILED = 'AI_VALIDATION_FAILED',

  /** Invalid status transition */
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
}

/**
 * Goal service error.
 */
export interface GoalServiceError {
  code: GoalServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result type for goal operations.
 */
export type GoalOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: GoalServiceError };
