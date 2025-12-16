/**
 * Behavioral Engine - Pure Functions
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see LLM INPUT CONTRACT Section 6 - Behavioral Engine Rules
 *
 * All functions in this module are:
 * - Deterministic (same input → same output)
 * - Pure (no side effects)
 * - Testable (no external dependencies)
 * - No AI calls
 * - No database access
 */

import { TaskStatus } from '../../common/enums';
import {
  CONSECUTIVE_FAILURES_THRESHOLD,
  CRITICAL_COMPLETION_RATE_THRESHOLD,
  CRITICAL_PERIOD_DAYS,
  ABANDONMENT_RISK_DAYS,
} from '../../common/constants';
import {
  BehavioralTaskInput,
  BehavioralEvaluationInput,
  BehavioralEvaluationResult,
  BehavioralSignal,
  BehavioralSignalType,
  BehavioralSeverity,
  BehavioralMetrics,
} from '../types';

// ============================================
// Completion Rate Calculator
// ============================================

/**
 * Calculate completion rate for tasks within a time window.
 *
 * @param tasks - Array of tasks to analyze
 * @param evaluationDate - Current date for analysis
 * @param windowDays - Number of days to look back
 * @returns Completion rate as percentage (0-100)
 */
export function calculateCompletionRate(
  tasks: BehavioralTaskInput[],
  evaluationDate: Date,
  windowDays: number,
): number {
  if (tasks.length === 0) {
    return 100; // No tasks = no failures
  }

  const windowStart = new Date(evaluationDate);
  windowStart.setDate(windowStart.getDate() - windowDays);
  windowStart.setHours(0, 0, 0, 0);

  // Filter tasks within the window
  const tasksInWindow = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= windowStart && taskDate <= evaluationDate;
  });

  if (tasksInWindow.length === 0) {
    return 100; // No tasks in window = no failures
  }

  const completedCount = tasksInWindow.filter(
    (task) => task.status === TaskStatus.COMPLETED,
  ).length;

  return Math.round((completedCount / tasksInWindow.length) * 100);
}

/**
 * Count completed and failed tasks in a window.
 */
export function countTasksByStatus(
  tasks: BehavioralTaskInput[],
  evaluationDate: Date,
  windowDays: number,
): { completed: number; failed: number; total: number } {
  const windowStart = new Date(evaluationDate);
  windowStart.setDate(windowStart.getDate() - windowDays);
  windowStart.setHours(0, 0, 0, 0);

  const tasksInWindow = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= windowStart && taskDate <= evaluationDate;
  });

  const completed = tasksInWindow.filter((task) => task.status === TaskStatus.COMPLETED).length;

  const failed = tasksInWindow.filter(
    (task) => task.status === TaskStatus.SKIPPED || task.status === TaskStatus.OVERDUE,
  ).length;

  return {
    completed,
    failed,
    total: tasksInWindow.length,
  };
}

// ============================================
// Consecutive Failure Tracker
// ============================================

/**
 * Count consecutive failures (skipped or overdue) from most recent tasks.
 *
 * Failures are counted from the most recent task backwards until
 * a completed task is encountered.
 *
 * @param tasks - Array of tasks sorted by creation date (oldest first)
 * @returns Number of consecutive failures
 */
export function calculateConsecutiveFailures(tasks: BehavioralTaskInput[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  // Sort by createdAt descending (most recent first)
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let consecutiveFailures = 0;

  for (const task of sortedTasks) {
    // Skip pending tasks - they haven't been attempted yet
    if (task.status === TaskStatus.PENDING) {
      continue;
    }

    // If completed, break the streak
    if (task.status === TaskStatus.COMPLETED) {
      break;
    }

    // Skipped or Overdue counts as failure
    if (task.status === TaskStatus.SKIPPED || task.status === TaskStatus.OVERDUE) {
      consecutiveFailures++;
    }
  }

  return consecutiveFailures;
}

/**
 * Check if user is struggling based on consecutive failures.
 *
 * @see BACKEND SPECIFICATION Section 6:
 * if (consecutiveFailures >= 3) → struggling
 */
export function isStruggling(consecutiveFailures: number): boolean {
  return consecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD;
}

// ============================================
// Inactivity Detector
// ============================================

/**
 * Calculate number of inactive days.
 *
 * @param lastActivityDate - Date of last user activity
 * @param evaluationDate - Current date for analysis
 * @returns Number of days since last activity
 */
export function calculateInactiveDays(lastActivityDate: Date | null, evaluationDate: Date): number {
  if (!lastActivityDate) {
    return Infinity; // No activity ever recorded
  }

  const lastActivity = new Date(lastActivityDate);
  const evaluation = new Date(evaluationDate);

  // Reset times to compare dates only
  lastActivity.setHours(0, 0, 0, 0);
  evaluation.setHours(0, 0, 0, 0);

  const diffTime = evaluation.getTime() - lastActivity.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if user is at abandonment risk based on inactivity.
 *
 * @see BACKEND SPECIFICATION Section 6:
 * if (inactiveDays >= 7) → abandonment risk
 */
export function isAbandonmentRisk(inactiveDays: number): boolean {
  return inactiveDays >= ABANDONMENT_RISK_DAYS;
}

// ============================================
// Critical State Detector
// ============================================

/**
 * Check if user is in critical state based on completion rate.
 *
 * @see BACKEND SPECIFICATION Section 6:
 * if (completionRate < 10% for 5 days) → critical
 */
export function isCritical(completionRate: number): boolean {
  return completionRate < CRITICAL_COMPLETION_RATE_THRESHOLD;
}

// ============================================
// Signal Generation
// ============================================

/**
 * Generate a behavioral signal.
 */
function createSignal(
  type: BehavioralSignalType,
  severity: BehavioralSeverity,
  message: string,
  evaluationDate: Date,
  metadata: Record<string, unknown> = {},
): BehavioralSignal {
  return {
    type,
    severity,
    message,
    triggeredAt: evaluationDate,
    metadata,
  };
}

/**
 * Determine severity based on signal type and metrics.
 */
function determineSeverity(
  signalType: BehavioralSignalType,
  metrics: BehavioralMetrics,
): BehavioralSeverity {
  switch (signalType) {
    case BehavioralSignalType.CRITICAL:
      return BehavioralSeverity.CRITICAL;

    case BehavioralSignalType.ABANDONMENT_RISK:
      if (metrics.inactiveDays >= 14) {
        return BehavioralSeverity.CRITICAL;
      }
      return BehavioralSeverity.HIGH;

    case BehavioralSignalType.STRUGGLING:
      if (metrics.consecutiveFailures >= 5) {
        return BehavioralSeverity.HIGH;
      }
      return BehavioralSeverity.MEDIUM;

    case BehavioralSignalType.HEALTHY:
      return BehavioralSeverity.NONE;

    default:
      return BehavioralSeverity.LOW;
  }
}

// ============================================
// Main Evaluation Function
// ============================================

/**
 * Compute all behavioral metrics from input data.
 */
export function computeMetrics(input: BehavioralEvaluationInput): BehavioralMetrics {
  const { tasks, lastActivityDate, evaluationDate, analysisWindowDays } = input;

  const completionRate = calculateCompletionRate(tasks, evaluationDate, analysisWindowDays);
  const consecutiveFailures = calculateConsecutiveFailures(tasks);
  const inactiveDays = calculateInactiveDays(lastActivityDate, evaluationDate);
  const taskCounts = countTasksByStatus(tasks, evaluationDate, analysisWindowDays);

  return {
    completionRate,
    consecutiveFailures,
    inactiveDays,
    totalTasks: taskCounts.total,
    completedTasks: taskCounts.completed,
    failedTasks: taskCounts.failed,
  };
}

/**
 * Evaluate behavioral state and generate signals.
 *
 * This is the main entry point for behavioral analysis.
 * It is deterministic, pure, and has no side effects.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 */
export function evaluateBehavior(input: BehavioralEvaluationInput): BehavioralEvaluationResult {
  const metrics = computeMetrics(input);
  const signals: BehavioralSignal[] = [];

  // Check for critical state (completion rate < 10% for 5 days)
  if (isCritical(metrics.completionRate)) {
    signals.push(
      createSignal(
        BehavioralSignalType.CRITICAL,
        determineSeverity(BehavioralSignalType.CRITICAL, metrics),
        `Completion rate is critically low at ${metrics.completionRate}%`,
        input.evaluationDate,
        {
          completionRate: metrics.completionRate,
          threshold: CRITICAL_COMPLETION_RATE_THRESHOLD,
          windowDays: CRITICAL_PERIOD_DAYS,
        },
      ),
    );
  }

  // Check for struggling state (≥3 consecutive failures)
  if (isStruggling(metrics.consecutiveFailures)) {
    signals.push(
      createSignal(
        BehavioralSignalType.STRUGGLING,
        determineSeverity(BehavioralSignalType.STRUGGLING, metrics),
        `User has ${metrics.consecutiveFailures} consecutive task failures`,
        input.evaluationDate,
        {
          consecutiveFailures: metrics.consecutiveFailures,
          threshold: CONSECUTIVE_FAILURES_THRESHOLD,
        },
      ),
    );
  }

  // Check for abandonment risk (≥7 days inactive)
  if (isAbandonmentRisk(metrics.inactiveDays)) {
    signals.push(
      createSignal(
        BehavioralSignalType.ABANDONMENT_RISK,
        determineSeverity(BehavioralSignalType.ABANDONMENT_RISK, metrics),
        `User has been inactive for ${metrics.inactiveDays} days`,
        input.evaluationDate,
        {
          inactiveDays: metrics.inactiveDays,
          threshold: ABANDONMENT_RISK_DAYS,
        },
      ),
    );
  }

  // If no issues, mark as healthy
  if (signals.length === 0) {
    signals.push(
      createSignal(
        BehavioralSignalType.HEALTHY,
        BehavioralSeverity.NONE,
        'User is performing well',
        input.evaluationDate,
        {
          completionRate: metrics.completionRate,
          consecutiveFailures: metrics.consecutiveFailures,
          inactiveDays: metrics.inactiveDays,
        },
      ),
    );
  }

  // Determine if adaptation should be triggered
  const shouldTriggerAdaptation = signals.some(
    (signal) =>
      signal.type === BehavioralSignalType.CRITICAL ||
      signal.type === BehavioralSignalType.STRUGGLING,
  );

  return {
    signals,
    shouldTriggerAdaptation,
    metrics,
    evaluatedAt: input.evaluationDate,
  };
}
