/**
 * Task Service Types
 *
 * @see BACKEND SPECIFICATION Section 5 - Task Model
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Tasks)
 *
 * These types define inputs and outputs for TaskService operations.
 */

import { TaskStatus, DifficultyLevel, TaskFrequency } from '../../common/enums';
import { BehavioralEvaluationResult } from '../../behavior/types';

// ============================================
// Task Operation Types
// ============================================

/**
 * Input for completing a task.
 *
 * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/complete
 */
export interface CompleteTaskInput {
  /** User ID (from authenticated context) */
  userId: string;

  /** Task ID to complete */
  taskId: string;

  /** Optional actual duration in minutes */
  actualDuration?: number;
}

/**
 * Input for skipping a task.
 *
 * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/skip
 */
export interface SkipTaskInput {
  /** User ID (from authenticated context) */
  userId: string;

  /** Task ID to skip */
  taskId: string;
}

/**
 * Task details returned from service operations.
 */
export interface TaskDetails {
  id: string;
  goalId: string;
  title: string;
  status: TaskStatus;
  difficulty: DifficultyLevel;
  frequency: TaskFrequency;
  estimatedDuration: number;
  actualDuration: number | null;
  isOptional: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a task operation.
 */
export interface TaskOperationResult {
  /** The updated task */
  task: TaskDetails;

  /** Whether the task status actually changed (false if idempotent no-op) */
  statusChanged: boolean;

  /** Previous status before operation */
  previousStatus: TaskStatus;

  /**
   * Behavioral evaluation result after task state change.
   * Only present when statusChanged is true.
   *
   * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
   */
  behavioralEvaluation?: BehavioralEvaluationResult | null;
}

// ============================================
// Behavior Evaluation Trigger
// ============================================

/**
 * Event emitted when behavior evaluation should be triggered.
 * This is consumed by BehaviorModule to evaluate goal state.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 */
export interface BehaviorEvaluationTrigger {
  /** Goal ID to evaluate */
  goalId: string;

  /** User ID (for scoping) */
  userId: string;

  /** Task ID that triggered the evaluation */
  taskId: string;

  /** Type of task event */
  eventType: TaskEventType;

  /** Timestamp of the event */
  timestamp: Date;

  /**
   * Evaluation result from BehavioralEngine.
   * Included when explicit evaluation was performed.
   */
  evaluationResult?: BehavioralEvaluationResult;
}

/**
 * Types of task events that can trigger behavior evaluation.
 */
export enum TaskEventType {
  COMPLETED = 'task_completed',
  SKIPPED = 'task_skipped',
  MARKED_OVERDUE = 'task_marked_overdue',
}

// ============================================
// Error Types
// ============================================

/**
 * Task service error codes.
 */
export enum TaskServiceErrorCode {
  /** Task not found or not owned by user */
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',

  /** Task is already in the target status */
  TASK_ALREADY_IN_STATUS = 'TASK_ALREADY_IN_STATUS',

  /** Invalid status transition attempted */
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',

  /** Goal is archived, tasks cannot be modified */
  GOAL_ARCHIVED = 'GOAL_ARCHIVED',

  /** Goal is not active */
  GOAL_NOT_ACTIVE = 'GOAL_NOT_ACTIVE',
}

/**
 * Task service error.
 */
export interface TaskServiceError {
  code: TaskServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result type for task operations.
 */
export type TaskOperationResponse<T> =
  | { success: true; data: T }
  | { success: false; error: TaskServiceError };

// ============================================
// Status Transition Rules
// ============================================

/**
 * Valid status transitions for tasks.
 *
 * Rules:
 * - pending → completed, skipped, overdue
 * - completed → (none, final for now)
 * - skipped → pending (can retry), completed
 * - overdue → completed, skipped, pending (retry)
 */
export const VALID_TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.OVERDUE],
  [TaskStatus.COMPLETED]: [], // Final state (may allow reset in future)
  [TaskStatus.SKIPPED]: [TaskStatus.PENDING, TaskStatus.COMPLETED],
  [TaskStatus.OVERDUE]: [TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.PENDING],
};

/**
 * Check if a status transition is valid.
 */
export function isValidTaskStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) {
    return true; // Idempotent - same status is always valid
  }
  return VALID_TASK_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
