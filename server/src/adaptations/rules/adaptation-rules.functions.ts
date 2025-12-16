/**
 * Adaptation Rules - Pure Functions
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 *
 * These functions convert behavioral signals into adaptation intents.
 * All functions are:
 * - Deterministic (same input → same output)
 * - Pure (no side effects)
 * - No AI calls
 * - No database access
 *
 * Key constraint from spec Section 7:
 * - Max difficulty jump is ±1 level
 */

import {
  AdaptationType,
  AdaptationCreator,
  DifficultyLevel,
  DIFFICULTY_ORDER,
} from '../../common/enums';
import { MAX_DIFFICULTY_JUMP } from '../../common/constants';
import {
  BehavioralSignal,
  BehavioralSignalType,
  BehavioralSeverity,
  BehavioralMetrics,
} from '../../behavior/types';
import {
  AdaptationIntent,
  AdaptationPriority,
  AdaptationRulesContext,
  AdaptationRulesResult,
  AdaptationSuggestedChanges,
} from '../types';

// ============================================
// Difficulty Level Helpers
// ============================================

/**
 * Get the index of a difficulty level in the ordered list.
 */
function getDifficultyIndex(difficulty: DifficultyLevel): number {
  return DIFFICULTY_ORDER.indexOf(difficulty);
}

/**
 * Calculate the lower difficulty level (respecting ±1 constraint).
 *
 * @see BACKEND SPECIFICATION Section 7 - Max difficulty jump (±1 level)
 */
export function getLowerDifficulty(current: DifficultyLevel): DifficultyLevel | null {
  const currentIndex = getDifficultyIndex(current);

  if (currentIndex <= 0) {
    return null; // Already at easiest level
  }

  return DIFFICULTY_ORDER[currentIndex - 1];
}

/**
 * Calculate the higher difficulty level (respecting ±1 constraint).
 */
export function getHigherDifficulty(current: DifficultyLevel): DifficultyLevel | null {
  const currentIndex = getDifficultyIndex(current);

  if (currentIndex >= DIFFICULTY_ORDER.length - 1) {
    return null; // Already at hardest level
  }

  return DIFFICULTY_ORDER[currentIndex + 1];
}

/**
 * Validate that a difficulty change respects the ±1 constraint.
 */
export function isValidDifficultyChange(from: DifficultyLevel, to: DifficultyLevel): boolean {
  const fromIndex = getDifficultyIndex(from);
  const toIndex = getDifficultyIndex(to);
  const diff = Math.abs(toIndex - fromIndex);

  return diff <= MAX_DIFFICULTY_JUMP;
}

// ============================================
// Priority Calculation
// ============================================

/**
 * Calculate adaptation priority based on signal severity.
 */
export function calculatePriority(signal: BehavioralSignal): AdaptationPriority {
  switch (signal.severity) {
    case BehavioralSeverity.CRITICAL:
      return AdaptationPriority.CRITICAL;
    case BehavioralSeverity.HIGH:
      return AdaptationPriority.HIGH;
    case BehavioralSeverity.MEDIUM:
      return AdaptationPriority.MEDIUM;
    default:
      return AdaptationPriority.LOW;
  }
}

// ============================================
// Signal-to-Intent Mapping Functions
// ============================================

/**
 * Generate adaptation intent for STRUGGLING signal.
 *
 * When user has ≥3 consecutive failures, suggest difficulty reduction.
 *
 * @see BACKEND SPECIFICATION Section 6: consecutiveFailures >= 3 → struggling
 */
export function createStrugglingIntent(
  signal: BehavioralSignal,
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
): AdaptationIntent | null {
  const lowerDifficulty = getLowerDifficulty(context.currentDifficulty);

  if (lowerDifficulty == null) {
    // Already at easiest level, cannot reduce further
    // Could suggest buffer_add instead
    return createBufferAddIntent(signal, metrics, context, 2);
  }

  const suggestedChanges: AdaptationSuggestedChanges = {
    type: 'difficulty_change',
    changes: {
      fromDifficulty: context.currentDifficulty,
      toDifficulty: lowerDifficulty,
      affectedTaskIds: context.taskIds,
    },
  };

  return {
    type: AdaptationType.DIFFICULTY_CHANGE,
    target: {
      goalId: context.goalId,
      taskIds: context.taskIds,
    },
    reason: `User has ${metrics.consecutiveFailures} consecutive task failures. Reducing difficulty from ${context.currentDifficulty} to ${lowerDifficulty} to help build momentum.`,
    triggeringSignal: signal,
    metrics,
    suggestedChanges,
    createdBy: AdaptationCreator.SYSTEM,
    priority: calculatePriority(signal),
    generatedAt: context.evaluationDate,
  };
}

/**
 * Generate adaptation intent for CRITICAL signal.
 *
 * When completion rate < 10% for 5 days, suggest significant changes.
 *
 * @see BACKEND SPECIFICATION Section 6: completionRate < 10% for 5 days → critical
 */
export function createCriticalIntent(
  signal: BehavioralSignal,
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
): AdaptationIntent | null {
  const lowerDifficulty = getLowerDifficulty(context.currentDifficulty);

  if (lowerDifficulty != null) {
    // First priority: reduce difficulty
    const suggestedChanges: AdaptationSuggestedChanges = {
      type: 'difficulty_change',
      changes: {
        fromDifficulty: context.currentDifficulty,
        toDifficulty: lowerDifficulty,
        affectedTaskIds: context.taskIds,
      },
    };

    return {
      type: AdaptationType.DIFFICULTY_CHANGE,
      target: {
        goalId: context.goalId,
        taskIds: context.taskIds,
      },
      reason: `Critical: Completion rate is only ${metrics.completionRate}%. Reducing difficulty to make tasks more achievable.`,
      triggeringSignal: signal,
      metrics,
      suggestedChanges,
      createdBy: AdaptationCreator.SYSTEM,
      priority: AdaptationPriority.CRITICAL,
      generatedAt: context.evaluationDate,
    };
  }

  // Already at easiest level, suggest buffer days
  return createBufferAddIntent(signal, metrics, context, 3);
}

/**
 * Generate adaptation intent for ABANDONMENT_RISK signal.
 *
 * When user is inactive for ≥7 days, suggest re-engagement strategy.
 *
 * @see BACKEND SPECIFICATION Section 6: inactiveDays >= 7 → abandonment risk
 */
export function createAbandonmentRiskIntent(
  signal: BehavioralSignal,
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
): AdaptationIntent {
  const suggestedChanges: AdaptationSuggestedChanges = {
    type: 'reschedule',
    changes: {
      taskIds: context.taskIds,
      rescheduleReason: `User has been inactive for ${metrics.inactiveDays} days. Rescheduling tasks to provide a fresh start.`,
    },
  };

  return {
    type: AdaptationType.RESCHEDULE,
    target: {
      goalId: context.goalId,
      taskIds: context.taskIds,
    },
    reason: `User has been inactive for ${metrics.inactiveDays} days. Suggesting a schedule reset to re-engage.`,
    triggeringSignal: signal,
    metrics,
    suggestedChanges,
    createdBy: AdaptationCreator.SYSTEM,
    priority: calculatePriority(signal),
    generatedAt: context.evaluationDate,
  };
}

/**
 * Generate a buffer_add intent as fallback.
 */
function createBufferAddIntent(
  signal: BehavioralSignal,
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
  bufferDays: number,
): AdaptationIntent {
  const suggestedChanges: AdaptationSuggestedChanges = {
    type: 'buffer_add',
    changes: {
      bufferDays,
      reduceFrequency: true,
    },
  };

  return {
    type: AdaptationType.BUFFER_ADD,
    target: {
      goalId: context.goalId,
    },
    reason: `Adding ${bufferDays} buffer days and reducing task frequency to allow recovery.`,
    triggeringSignal: signal,
    metrics,
    suggestedChanges,
    createdBy: AdaptationCreator.SYSTEM,
    priority: calculatePriority(signal),
    generatedAt: context.evaluationDate,
  };
}

// ============================================
// Main Conversion Function
// ============================================

/**
 * Convert a behavioral signal to an adaptation intent.
 *
 * Returns null if no adaptation is needed for this signal type.
 */
export function signalToIntent(
  signal: BehavioralSignal,
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
): AdaptationIntent | null {
  switch (signal.type) {
    case BehavioralSignalType.STRUGGLING:
      return createStrugglingIntent(signal, metrics, context);

    case BehavioralSignalType.CRITICAL:
      return createCriticalIntent(signal, metrics, context);

    case BehavioralSignalType.ABANDONMENT_RISK:
      return createAbandonmentRiskIntent(signal, metrics, context);

    case BehavioralSignalType.HEALTHY:
      // No adaptation needed for healthy users
      return null;

    default:
      return null;
  }
}

/**
 * Convert multiple behavioral signals to adaptation intents.
 *
 * This is the main entry point for the adaptation rules engine.
 */
export function evaluateAdaptationRules(
  signals: BehavioralSignal[],
  metrics: BehavioralMetrics,
  context: AdaptationRulesContext,
): AdaptationRulesResult {
  const intents: AdaptationIntent[] = [];

  for (const signal of signals) {
    const intent = signalToIntent(signal, metrics, context);
    if (intent) {
      intents.push(intent);
    }
  }

  // Sort by priority (highest first)
  intents.sort((a, b) => b.priority - a.priority);

  const shouldAdapt = intents.length > 0;

  let summary: string;
  if (!shouldAdapt) {
    summary = 'No adaptations needed. User is performing well.';
  } else if (intents.length === 1) {
    summary = `1 adaptation recommended: ${intents[0].type}`;
  } else {
    summary = `${intents.length} adaptations recommended. Highest priority: ${intents[0].type}`;
  }

  return {
    intents,
    shouldAdapt,
    summary,
    evaluatedAt: context.evaluationDate,
  };
}
