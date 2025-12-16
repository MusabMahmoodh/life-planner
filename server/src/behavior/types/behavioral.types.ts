/**
 * Behavioral Engine Types
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see LLM INPUT CONTRACT Section 6 - Behavioral Engine Rules
 *
 * These types define the inputs and outputs for the behavioral engine.
 * All behavioral logic must be deterministic and testable.
 */

import { TaskStatus } from '../../common/enums';

// ============================================
// Input Types
// ============================================

/**
 * Minimal task data required for behavioral analysis.
 * Extracted from Task model to avoid database coupling.
 */
export interface BehavioralTaskInput {
  id: string;
  status: TaskStatus;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Input data for behavioral evaluation.
 * Aggregated from goal and task data.
 */
export interface BehavioralEvaluationInput {
  /** All tasks for the goal */
  tasks: BehavioralTaskInput[];

  /** Date of the last user activity (task completion, skip, etc.) */
  lastActivityDate: Date | null;

  /** Current evaluation date (for deterministic testing) */
  evaluationDate: Date;

  /** Number of days to analyze for completion rate */
  analysisWindowDays: number;
}

// ============================================
// Output Types
// ============================================

/**
 * Behavioral signal types.
 * @see BACKEND SPECIFICATION Section 6 - Failure Detection Rules
 */
export enum BehavioralSignalType {
  /** User has ≥3 consecutive failures */
  STRUGGLING = 'struggling',

  /** Completion rate < 10% for 5 days */
  CRITICAL = 'critical',

  /** User inactive for ≥7 days */
  ABANDONMENT_RISK = 'abandonment_risk',

  /** User is performing well */
  HEALTHY = 'healthy',
}

/**
 * Severity levels for behavioral signals.
 */
export enum BehavioralSeverity {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * A single behavioral signal with metadata.
 */
export interface BehavioralSignal {
  type: BehavioralSignalType;
  severity: BehavioralSeverity;
  message: string;
  triggeredAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Complete behavioral evaluation result.
 */
export interface BehavioralEvaluationResult {
  /** Primary behavioral signals detected */
  signals: BehavioralSignal[];

  /** Whether adaptation should be triggered */
  shouldTriggerAdaptation: boolean;

  /** Computed metrics */
  metrics: BehavioralMetrics;

  /** Timestamp of evaluation */
  evaluatedAt: Date;
}

/**
 * Computed behavioral metrics.
 */
export interface BehavioralMetrics {
  /** Completion rate as percentage (0-100) */
  completionRate: number;

  /** Number of consecutive failures (skipped + overdue) */
  consecutiveFailures: number;

  /** Number of days since last activity */
  inactiveDays: number;

  /** Total tasks analyzed */
  totalTasks: number;

  /** Completed tasks in analysis window */
  completedTasks: number;

  /** Failed tasks (skipped + overdue) in analysis window */
  failedTasks: number;
}
