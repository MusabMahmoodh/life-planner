import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { CRITICAL_PERIOD_DAYS } from '../common/constants';
import { TaskStatus } from '../common/enums';
import {
  BehavioralEvaluationInput,
  BehavioralEvaluationResult,
  BehavioralTaskInput,
  BehavioralMetrics,
} from './types';
import {
  evaluateBehavior,
  computeMetrics,
  calculateCompletionRate,
  calculateConsecutiveFailures,
  calculateInactiveDays,
  isStruggling,
  isCritical,
  isAbandonmentRisk,
} from './engine';

/**
 * BehavioralEngineService provides behavioral analysis for goals.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see LLM INPUT CONTRACT Section 6 - Behavioral Engine Rules
 *
 * This service:
 * - Wraps pure functions for NestJS dependency injection
 * - Transforms Prisma Task entities to behavioral inputs
 * - Does NOT access database directly
 * - Does NOT call AI
 * - Is fully deterministic and testable
 */
@Injectable()
export class BehavioralEngineService {
  /**
   * Evaluate behavioral state for a set of tasks.
   *
   * @param tasks - Tasks from the database (Prisma Task entities)
   * @param lastActivityDate - Date of last user activity
   * @param evaluationDate - Current date (defaults to now)
   * @returns Behavioral evaluation result with signals and metrics
   */
  evaluate(
    tasks: Task[],
    lastActivityDate: Date | null,
    evaluationDate: Date = new Date(),
  ): BehavioralEvaluationResult {
    const input = this.createEvaluationInput(tasks, lastActivityDate, evaluationDate);
    return evaluateBehavior(input);
  }

  /**
   * Get behavioral metrics without generating signals.
   */
  getMetrics(
    tasks: Task[],
    lastActivityDate: Date | null,
    evaluationDate: Date = new Date(),
  ): BehavioralMetrics {
    const input = this.createEvaluationInput(tasks, lastActivityDate, evaluationDate);
    return computeMetrics(input);
  }

  /**
   * Calculate completion rate for tasks.
   */
  getCompletionRate(tasks: Task[], evaluationDate: Date = new Date()): number {
    const behavioralTasks = this.transformTasks(tasks);
    return calculateCompletionRate(behavioralTasks, evaluationDate, CRITICAL_PERIOD_DAYS);
  }

  /**
   * Get consecutive failures count.
   */
  getConsecutiveFailures(tasks: Task[]): number {
    const behavioralTasks = this.transformTasks(tasks);
    return calculateConsecutiveFailures(behavioralTasks);
  }

  /**
   * Get inactive days count.
   */
  getInactiveDays(lastActivityDate: Date | null, evaluationDate: Date = new Date()): number {
    return calculateInactiveDays(lastActivityDate, evaluationDate);
  }

  /**
   * Check if user is struggling (≥3 consecutive failures).
   */
  checkIsStruggling(tasks: Task[]): boolean {
    const consecutiveFailures = this.getConsecutiveFailures(tasks);
    return isStruggling(consecutiveFailures);
  }

  /**
   * Check if user is in critical state (completion rate < 10%).
   */
  checkIsCritical(tasks: Task[], evaluationDate: Date = new Date()): boolean {
    const completionRate = this.getCompletionRate(tasks, evaluationDate);
    return isCritical(completionRate);
  }

  /**
   * Check if user is at abandonment risk (≥7 days inactive).
   */
  checkIsAbandonmentRisk(
    lastActivityDate: Date | null,
    evaluationDate: Date = new Date(),
  ): boolean {
    const inactiveDays = this.getInactiveDays(lastActivityDate, evaluationDate);
    return isAbandonmentRisk(inactiveDays);
  }

  /**
   * Check if any behavioral issue warrants an adaptation.
   */
  shouldTriggerAdaptation(
    tasks: Task[],
    lastActivityDate: Date | null,
    evaluationDate: Date = new Date(),
  ): boolean {
    const result = this.evaluate(tasks, lastActivityDate, evaluationDate);
    return result.shouldTriggerAdaptation;
  }

  /**
   * Transform Prisma Task entities to behavioral input format.
   */
  private transformTasks(tasks: Task[]): BehavioralTaskInput[] {
    return tasks.map((task) => ({
      id: task.id,
      status: task.status as TaskStatus,
      createdAt: task.createdAt,
      completedAt: task.status === 'completed' ? task.updatedAt : undefined,
    }));
  }

  /**
   * Create evaluation input from raw data.
   */
  private createEvaluationInput(
    tasks: Task[],
    lastActivityDate: Date | null,
    evaluationDate: Date,
  ): BehavioralEvaluationInput {
    return {
      tasks: this.transformTasks(tasks),
      lastActivityDate,
      evaluationDate,
      analysisWindowDays: CRITICAL_PERIOD_DAYS,
    };
  }
}
