/**
 * Adaptation Service Types
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see LLM INPUT CONTRACT Section 8 - Adaptation Lifecycle
 *
 * Type definitions for AdaptationService operations.
 */

import { Adaptation, Goal, AdaptationType, AdaptationCreator } from '@prisma/client';

// ============================================
// Input Types
// ============================================

/**
 * Input for storing a new adaptation suggestion.
 * The service will create the previousState snapshot automatically.
 */
export interface StoreSuggestionInput {
  /** User ID (for ownership verification) */
  userId: string;

  /** Goal ID to adapt */
  goalId: string;

  /** Type of adaptation */
  type: AdaptationType;

  /** Human-readable reason for the adaptation */
  reason: string;

  /** The proposed new state (task modifications, etc.) */
  newState: AdaptationNewState;

  /** Who created this adaptation */
  createdBy: AdaptationCreator;
}

/**
 * Input for accepting an adaptation.
 */
export interface AcceptAdaptationInput {
  /** User ID (for ownership verification) */
  userId: string;

  /** Adaptation ID to accept */
  adaptationId: string;
}

/**
 * Input for rejecting an adaptation.
 */
export interface RejectAdaptationInput {
  /** User ID (for ownership verification) */
  userId: string;

  /** Adaptation ID to reject */
  adaptationId: string;
}

/**
 * Input for rolling back an accepted adaptation.
 */
export interface RollbackAdaptationInput {
  /** User ID (for ownership verification) */
  userId: string;

  /** Adaptation ID to rollback */
  adaptationId: string;
}

// ============================================
// Output Types
// ============================================

/**
 * Result of storing a suggestion.
 */
export interface StoreSuggestionResult {
  success: boolean;
  adaptation?: Adaptation;
  error?: AdaptationError;
}

/**
 * Result of accepting an adaptation.
 */
export interface AcceptAdaptationResult {
  success: boolean;
  adaptation?: Adaptation;
  appliedChanges?: AppliedChanges;
  error?: AdaptationError;
}

/**
 * Result of rejecting an adaptation.
 */
export interface RejectAdaptationResult {
  success: boolean;
  adaptation?: Adaptation;
  blockedUntil?: Date;
  error?: AdaptationError;
}

/**
 * Result of rolling back an adaptation.
 */
export interface RollbackAdaptationResult {
  success: boolean;
  adaptation?: Adaptation;
  restoredState?: AdaptationPreviousState;
  error?: AdaptationError;
}

/**
 * Adaptation details with goal context.
 */
export interface AdaptationDetails {
  adaptation: Adaptation;
  goal: Goal;
  isWithinRollbackWindow: boolean;
  canBeRolledBack: boolean;
}

// ============================================
// State Snapshot Types
// ============================================

/**
 * Previous state snapshot structure.
 * Captures the state before adaptation for rollback purposes.
 * Note: Adaptations apply to tasks, not goals directly.
 */
export interface AdaptationPreviousState {
  /** Snapshot timestamp */
  snapshotAt: string;

  /** Goal metadata at snapshot time (for context) */
  goal: {
    title: string;
    status: string;
    planVersion: number;
  };

  /** Tasks state at snapshot time (for rollback) */
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    difficulty: string;
    frequency: string;
    estimatedDuration: number;
    orderIndex: number;
  }>;

  /** Allow additional fields for Prisma JSON compatibility */
  [key: string]: unknown;
}

/**
 * New state structure for adaptations.
 * Describes the proposed changes.
 */
export interface AdaptationNewState {
  /** Description of the change */
  description: string;

  /** For difficulty_change: new difficulty level */
  newDifficulty?: string;

  /** For buffer_add: number of buffer days to add */
  bufferDays?: number;

  /** Task modifications */
  taskChanges?: Array<{
    taskId: string;
    changes: {
      difficulty?: string;
      frequency?: string;
      estimatedDuration?: number;
    };
  }>;

  /** Allow additional fields for Prisma JSON compatibility */
  [key: string]: unknown;
}

/**
 * Applied changes after acceptance.
 */
export interface AppliedChanges {
  /** Number of tasks modified */
  tasksModified: number;

  /** Goal-level changes applied */
  goalChanges: {
    difficultyChanged: boolean;
    bufferAdded: boolean;
  };

  /** Allow additional fields */
  [key: string]: unknown;
}

// ============================================
// Error Types
// ============================================

/**
 * Adaptation error codes.
 */
export enum AdaptationErrorCode {
  /** Adaptation not found or not owned by user */
  NOT_FOUND = 'ADAPTATION_NOT_FOUND',

  /** Goal not found or not owned by user */
  GOAL_NOT_FOUND = 'GOAL_NOT_FOUND',

  /** Adaptation type is blocked (rejected within 7 days) */
  BLOCKED = 'ADAPTATION_BLOCKED',

  /** Adaptation is not in correct status for operation */
  INVALID_STATUS = 'INVALID_STATUS',

  /** Rollback window has expired */
  ROLLBACK_WINDOW_EXPIRED = 'ROLLBACK_WINDOW_EXPIRED',

  /** Failed to apply changes */
  APPLY_FAILED = 'APPLY_FAILED',

  /** Failed to restore previous state */
  RESTORE_FAILED = 'RESTORE_FAILED',

  /** Unexpected error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Adaptation error structure.
 */
export interface AdaptationError {
  code: AdaptationErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Query Types
// ============================================

/**
 * Options for listing adaptations.
 */
export interface ListAdaptationsOptions {
  /** Filter by status */
  status?: 'suggested' | 'accepted' | 'rejected' | 'rolled_back';

  /** Maximum number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Adaptation list result.
 */
export interface AdaptationListResult {
  adaptations: Adaptation[];
  total: number;
  hasMore: boolean;
}
