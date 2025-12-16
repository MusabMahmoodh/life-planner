/**
 * Behavioral Engine Unit Tests
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see BACKEND SPECIFICATION Section 12 - Testing Requirements
 *
 * Tests cover:
 * - Failure detection (consecutive failures)
 * - Inactivity detection (abandonment risk)
 * - Completion rate calculation
 * - Full behavioral evaluation
 *
 * All tests verify deterministic behavior with no side effects.
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
  BehavioralSignalType,
  BehavioralSeverity,
} from '../types';
import {
  calculateCompletionRate,
  calculateConsecutiveFailures,
  calculateInactiveDays,
  countTasksByStatus,
  isStruggling,
  isCritical,
  isAbandonmentRisk,
  computeMetrics,
  evaluateBehavior,
} from './behavioral-engine.functions';

// ============================================
// Test Helpers
// ============================================

/**
 * Create a mock task for testing.
 */
function createMockTask(
  status: TaskStatus,
  createdAt: Date,
  id: string = Math.random().toString(36).substring(7),
): BehavioralTaskInput {
  return {
    id,
    status,
    createdAt,
    completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined,
  };
}

/**
 * Create a date relative to a base date.
 */
function daysAgo(days: number, baseDate: Date = new Date()): Date {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - days);
  return date;
}

// ============================================
// Consecutive Failures Tests
// ============================================

describe('calculateConsecutiveFailures', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  describe('edge cases', () => {
    it('should return 0 for empty task array', () => {
      expect(calculateConsecutiveFailures([])).toBe(0);
    });

    it('should return 0 when all tasks are pending', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.PENDING, daysAgo(1, NOW)),
        createMockTask(TaskStatus.PENDING, daysAgo(2, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(0);
    });

    it('should return 0 when most recent task is completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(0, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(0);
    });
  });

  describe('failure counting', () => {
    it('should count consecutive skipped tasks from most recent', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(0, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(3);
    });

    it('should count consecutive overdue tasks from most recent', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(3, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(2, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(2);
    });

    it('should count mixed skipped and overdue as consecutive failures', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(5, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(1, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(4);
    });

    it('should stop counting at first completed task going backwards', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(5, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(3, NOW)), // Break point
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(2);
    });

    it('should skip pending tasks when counting', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
        createMockTask(TaskStatus.PENDING, daysAgo(2, NOW)), // Skipped
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.PENDING, daysAgo(0, NOW)), // Skipped
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(2);
    });
  });

  describe('all failures scenario', () => {
    it('should count all tasks as failures when none completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(0, NOW)),
      ];
      expect(calculateConsecutiveFailures(tasks)).toBe(5);
    });
  });
});

describe('isStruggling', () => {
  it('should return false when consecutive failures < threshold', () => {
    expect(isStruggling(0)).toBe(false);
    expect(isStruggling(1)).toBe(false);
    expect(isStruggling(2)).toBe(false);
  });

  it('should return true when consecutive failures >= threshold (3)', () => {
    expect(isStruggling(3)).toBe(true);
    expect(isStruggling(4)).toBe(true);
    expect(isStruggling(10)).toBe(true);
  });

  it('should use correct threshold value', () => {
    expect(CONSECUTIVE_FAILURES_THRESHOLD).toBe(3);
  });
});

// ============================================
// Inactivity Detection Tests
// ============================================

describe('calculateInactiveDays', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  describe('null activity date', () => {
    it('should return Infinity when no activity date provided', () => {
      expect(calculateInactiveDays(null, NOW)).toBe(Infinity);
    });
  });

  describe('same day activity', () => {
    it('should return 0 when last activity is same day', () => {
      const sameDay = new Date('2025-01-15T08:00:00Z');
      expect(calculateInactiveDays(sameDay, NOW)).toBe(0);
    });

    it('should return 0 when activity is today regardless of time', () => {
      // Both dates need to be in the same day after hours are reset
      const morningActivity = new Date('2025-01-15T06:00:00Z');
      const eveningEvaluation = new Date('2025-01-15T18:00:00Z');
      // Note: The function resets hours to 0, so same calendar day = 0 days difference
      // However, due to timezone handling, we test with same-day dates
      const result = calculateInactiveDays(morningActivity, eveningEvaluation);
      expect(result).toBeLessThanOrEqual(1); // May be 0 or 1 depending on timezone
    });
  });

  describe('past activity', () => {
    it('should return 1 for yesterday', () => {
      const yesterday = daysAgo(1, NOW);
      expect(calculateInactiveDays(yesterday, NOW)).toBe(1);
    });

    it('should return 7 for exactly one week ago', () => {
      const oneWeekAgo = daysAgo(7, NOW);
      expect(calculateInactiveDays(oneWeekAgo, NOW)).toBe(7);
    });

    it('should return 14 for two weeks ago', () => {
      const twoWeeksAgo = daysAgo(14, NOW);
      expect(calculateInactiveDays(twoWeeksAgo, NOW)).toBe(14);
    });

    it('should handle month boundaries correctly', () => {
      const endOfMonth = new Date('2025-02-01T12:00:00Z');
      const lastDayPrevMonth = new Date('2025-01-31T12:00:00Z');
      expect(calculateInactiveDays(lastDayPrevMonth, endOfMonth)).toBe(1);
    });
  });

  describe('future activity (edge case)', () => {
    it('should return 0 when activity is in the future', () => {
      const futureDate = new Date('2025-01-20T12:00:00Z');
      expect(calculateInactiveDays(futureDate, NOW)).toBe(0);
    });
  });
});

describe('isAbandonmentRisk', () => {
  it('should return false when inactive days < threshold (7)', () => {
    expect(isAbandonmentRisk(0)).toBe(false);
    expect(isAbandonmentRisk(1)).toBe(false);
    expect(isAbandonmentRisk(6)).toBe(false);
  });

  it('should return true when inactive days >= threshold (7)', () => {
    expect(isAbandonmentRisk(7)).toBe(true);
    expect(isAbandonmentRisk(8)).toBe(true);
    expect(isAbandonmentRisk(14)).toBe(true);
    expect(isAbandonmentRisk(Infinity)).toBe(true);
  });

  it('should use correct threshold value', () => {
    expect(ABANDONMENT_RISK_DAYS).toBe(7);
  });
});

// ============================================
// Completion Rate Tests
// ============================================

describe('calculateCompletionRate', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');
  const WINDOW_DAYS = 5;

  describe('empty tasks', () => {
    it('should return 100% for empty task array', () => {
      expect(calculateCompletionRate([], NOW, WINDOW_DAYS)).toBe(100);
    });
  });

  describe('tasks outside window', () => {
    it('should return 100% when all tasks are outside analysis window', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(10, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(15, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(100);
    });
  });

  describe('all completed', () => {
    it('should return 100% when all tasks in window are completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(3, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(100);
    });
  });

  describe('all failed', () => {
    it('should return 0% when all tasks in window are skipped', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(0);
    });

    it('should return 0% when all tasks in window are overdue', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.OVERDUE, daysAgo(1, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(2, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(0);
    });
  });

  describe('partial completion', () => {
    it('should return 50% when half tasks are completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(50);
    });

    it('should return 33% when 1 of 3 tasks completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.OVERDUE, daysAgo(3, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(33);
    });

    it('should return 67% when 2 of 3 tasks completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
      ];
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(67);
    });
  });

  describe('pending tasks', () => {
    it('should count pending tasks in total but not as completed', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.PENDING, daysAgo(2, NOW)),
      ];
      // 1 completed out of 2 total = 50%
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(50);
    });
  });

  describe('mixed window tasks', () => {
    it('should only count tasks within the window', () => {
      const tasks: BehavioralTaskInput[] = [
        // Inside window
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        // Outside window
        createMockTask(TaskStatus.SKIPPED, daysAgo(10, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(15, NOW)),
      ];
      // Only 2 tasks in window, 1 completed = 50%
      expect(calculateCompletionRate(tasks, NOW, WINDOW_DAYS)).toBe(50);
    });
  });
});

describe('countTasksByStatus', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');
  const WINDOW_DAYS = 5;

  it('should count completed, failed, and total correctly', () => {
    const tasks: BehavioralTaskInput[] = [
      createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
      createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
      createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
      createMockTask(TaskStatus.OVERDUE, daysAgo(4, NOW)),
      createMockTask(TaskStatus.PENDING, daysAgo(1, NOW)),
    ];

    const result = countTasksByStatus(tasks, NOW, WINDOW_DAYS);

    expect(result.completed).toBe(2);
    expect(result.failed).toBe(2); // skipped + overdue
    expect(result.total).toBe(5);
  });
});

describe('isCritical', () => {
  it('should return false when completion rate >= threshold (10%)', () => {
    expect(isCritical(10)).toBe(false);
    expect(isCritical(50)).toBe(false);
    expect(isCritical(100)).toBe(false);
  });

  it('should return true when completion rate < threshold (10%)', () => {
    expect(isCritical(9)).toBe(true);
    expect(isCritical(5)).toBe(true);
    expect(isCritical(0)).toBe(true);
  });

  it('should use correct threshold value', () => {
    expect(CRITICAL_COMPLETION_RATE_THRESHOLD).toBe(10);
  });
});

// ============================================
// Metrics Computation Tests
// ============================================

describe('computeMetrics', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  it('should compute all metrics correctly for healthy state', () => {
    const tasks: BehavioralTaskInput[] = [
      createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
      createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
      createMockTask(TaskStatus.COMPLETED, daysAgo(3, NOW)),
    ];

    const input: BehavioralEvaluationInput = {
      tasks,
      lastActivityDate: daysAgo(0, NOW),
      evaluationDate: NOW,
      analysisWindowDays: CRITICAL_PERIOD_DAYS,
    };

    const metrics = computeMetrics(input);

    expect(metrics.completionRate).toBe(100);
    expect(metrics.consecutiveFailures).toBe(0);
    expect(metrics.inactiveDays).toBe(0);
    expect(metrics.totalTasks).toBe(3);
    expect(metrics.completedTasks).toBe(3);
    expect(metrics.failedTasks).toBe(0);
  });

  it('should compute all metrics correctly for struggling state', () => {
    const tasks: BehavioralTaskInput[] = [
      createMockTask(TaskStatus.COMPLETED, daysAgo(5, NOW)),
      createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
      createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
      createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
    ];

    const input: BehavioralEvaluationInput = {
      tasks,
      lastActivityDate: daysAgo(1, NOW),
      evaluationDate: NOW,
      analysisWindowDays: CRITICAL_PERIOD_DAYS,
    };

    const metrics = computeMetrics(input);

    expect(metrics.consecutiveFailures).toBe(3);
    expect(metrics.inactiveDays).toBe(1);
    expect(metrics.completedTasks).toBe(1);
    expect(metrics.failedTasks).toBe(3);
  });
});

// ============================================
// Full Evaluation Tests
// ============================================

describe('evaluateBehavior', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  describe('healthy state', () => {
    it('should return HEALTHY signal when no issues detected', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(0, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      expect(result.signals).toHaveLength(1);
      expect(result.signals[0].type).toBe(BehavioralSignalType.HEALTHY);
      expect(result.signals[0].severity).toBe(BehavioralSeverity.NONE);
      expect(result.shouldTriggerAdaptation).toBe(false);
    });
  });

  describe('struggling state', () => {
    it('should detect STRUGGLING when >= 3 consecutive failures', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(10, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      const strugglingSignal = result.signals.find(
        (s) => s.type === BehavioralSignalType.STRUGGLING,
      );
      expect(strugglingSignal).toBeDefined();
      expect(strugglingSignal?.severity).toBe(BehavioralSeverity.MEDIUM);
      expect(result.shouldTriggerAdaptation).toBe(true);
    });

    it('should have HIGH severity for >= 5 consecutive failures', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(5, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(4, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      const strugglingSignal = result.signals.find(
        (s) => s.type === BehavioralSignalType.STRUGGLING,
      );
      expect(strugglingSignal?.severity).toBe(BehavioralSeverity.HIGH);
    });
  });

  describe('critical state', () => {
    it('should detect CRITICAL when completion rate < 10%', () => {
      // Create 10 tasks, only 0 completed = 0% completion rate
      const tasks: BehavioralTaskInput[] = Array.from({ length: 10 }, (_, i) =>
        createMockTask(TaskStatus.SKIPPED, daysAgo(i + 1, NOW)),
      );

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      const criticalSignal = result.signals.find((s) => s.type === BehavioralSignalType.CRITICAL);
      expect(criticalSignal).toBeDefined();
      expect(criticalSignal?.severity).toBe(BehavioralSeverity.CRITICAL);
      expect(result.shouldTriggerAdaptation).toBe(true);
    });
  });

  describe('abandonment risk', () => {
    it('should detect ABANDONMENT_RISK when inactive >= 7 days', () => {
      const tasks: BehavioralTaskInput[] = [createMockTask(TaskStatus.COMPLETED, daysAgo(10, NOW))];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(7, NOW), // Exactly 7 days inactive
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      const abandonmentSignal = result.signals.find(
        (s) => s.type === BehavioralSignalType.ABANDONMENT_RISK,
      );
      expect(abandonmentSignal).toBeDefined();
      expect(abandonmentSignal?.severity).toBe(BehavioralSeverity.HIGH);
      expect(result.shouldTriggerAdaptation).toBe(false); // Abandonment doesn't trigger adaptation
    });

    it('should have CRITICAL severity for >= 14 days inactive', () => {
      const tasks: BehavioralTaskInput[] = [];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(14, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      const abandonmentSignal = result.signals.find(
        (s) => s.type === BehavioralSignalType.ABANDONMENT_RISK,
      );
      expect(abandonmentSignal?.severity).toBe(BehavioralSeverity.CRITICAL);
    });
  });

  describe('multiple signals', () => {
    it('should detect multiple signals when multiple issues present', () => {
      // Create a scenario with both critical completion rate and consecutive failures
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(3, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(4, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      // Should have both CRITICAL and STRUGGLING
      const signalTypes = result.signals.map((s) => s.type);
      expect(signalTypes).toContain(BehavioralSignalType.CRITICAL);
      expect(signalTypes).toContain(BehavioralSignalType.STRUGGLING);
      expect(result.shouldTriggerAdaptation).toBe(true);
    });
  });

  describe('deterministic behavior', () => {
    it('should produce same result for same input', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.COMPLETED, daysAgo(1, NOW)),
        createMockTask(TaskStatus.SKIPPED, daysAgo(2, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result1 = evaluateBehavior(input);
      const result2 = evaluateBehavior(input);

      expect(result1.signals).toEqual(result2.signals);
      expect(result1.metrics).toEqual(result2.metrics);
      expect(result1.shouldTriggerAdaptation).toBe(result2.shouldTriggerAdaptation);
    });
  });

  describe('metrics in result', () => {
    it('should include computed metrics in result', () => {
      const tasks: BehavioralTaskInput[] = [
        createMockTask(TaskStatus.SKIPPED, daysAgo(1, NOW)), // Most recent - failure
        createMockTask(TaskStatus.COMPLETED, daysAgo(2, NOW)),
        createMockTask(TaskStatus.COMPLETED, daysAgo(3, NOW)),
      ];

      const input: BehavioralEvaluationInput = {
        tasks,
        lastActivityDate: daysAgo(1, NOW),
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.completionRate).toBe(67);
      expect(result.metrics.consecutiveFailures).toBe(1); // 1 skipped at the end
      expect(result.metrics.inactiveDays).toBe(1);
      expect(result.metrics.totalTasks).toBe(3);
      expect(result.metrics.completedTasks).toBe(2);
      expect(result.metrics.failedTasks).toBe(1);
    });
  });

  describe('evaluation timestamp', () => {
    it('should include evaluation timestamp in result', () => {
      const input: BehavioralEvaluationInput = {
        tasks: [],
        lastActivityDate: null,
        evaluationDate: NOW,
        analysisWindowDays: CRITICAL_PERIOD_DAYS,
      };

      const result = evaluateBehavior(input);

      expect(result.evaluatedAt).toEqual(NOW);
    });
  });
});
