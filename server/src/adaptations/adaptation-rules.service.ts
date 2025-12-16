import { Injectable } from '@nestjs/common';
import { Task, DifficultyLevel as PrismaDifficultyLevel } from '@prisma/client';
import { DifficultyLevel } from '../common/enums';
import { BehavioralSignal, BehavioralMetrics, BehavioralEvaluationResult } from '../behavior/types';
import { AdaptationIntent, AdaptationRulesContext, AdaptationRulesResult } from './types';
import {
  evaluateAdaptationRules,
  signalToIntent,
  getLowerDifficulty,
  getHigherDifficulty,
  isValidDifficultyChange,
  calculatePriority,
} from './rules';

/**
 * AdaptationRulesService converts behavioral signals into adaptation intents.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 *
 * This service:
 * - Wraps pure functions for NestJS dependency injection
 * - Converts behavioral signals to adaptation intents
 * - Does NOT access database
 * - Does NOT call AI
 * - Does NOT apply changes (outputs intents only)
 * - Is fully deterministic and testable
 */
@Injectable()
export class AdaptationRulesService {
  /**
   * Evaluate adaptation rules for a behavioral evaluation result.
   *
   * @param evaluationResult - Result from BehavioralEngineService
   * @param goalId - Goal ID being evaluated
   * @param tasks - Tasks for the goal (used to determine current difficulty)
   * @param evaluationDate - Current date (defaults to now)
   * @returns Adaptation rules result with intents
   */
  evaluate(
    evaluationResult: BehavioralEvaluationResult,
    goalId: string,
    tasks: Task[],
    evaluationDate: Date = new Date(),
  ): AdaptationRulesResult {
    const context = this.createContext(goalId, tasks, evaluationDate);

    return evaluateAdaptationRules(evaluationResult.signals, evaluationResult.metrics, context);
  }

  /**
   * Convert a single behavioral signal to an adaptation intent.
   *
   * @param signal - Behavioral signal
   * @param metrics - Behavioral metrics
   * @param goalId - Goal ID
   * @param tasks - Tasks for the goal
   * @param evaluationDate - Current date
   * @returns AdaptationIntent or null if no adaptation needed
   */
  signalToIntent(
    signal: BehavioralSignal,
    metrics: BehavioralMetrics,
    goalId: string,
    tasks: Task[],
    evaluationDate: Date = new Date(),
  ): AdaptationIntent | null {
    const context = this.createContext(goalId, tasks, evaluationDate);
    return signalToIntent(signal, metrics, context);
  }

  /**
   * Get the next lower difficulty level.
   * Returns null if already at easiest level.
   */
  getLowerDifficulty(current: DifficultyLevel): DifficultyLevel | null {
    return getLowerDifficulty(current);
  }

  /**
   * Get the next higher difficulty level.
   * Returns null if already at hardest level.
   */
  getHigherDifficulty(current: DifficultyLevel): DifficultyLevel | null {
    return getHigherDifficulty(current);
  }

  /**
   * Validate that a difficulty change respects the ±1 constraint.
   *
   * @see BACKEND SPECIFICATION Section 7 - Max difficulty jump (±1 level)
   */
  isValidDifficultyChange(from: DifficultyLevel, to: DifficultyLevel): boolean {
    return isValidDifficultyChange(from, to);
  }

  /**
   * Calculate priority for a behavioral signal.
   */
  calculatePriority(signal: BehavioralSignal): number {
    return calculatePriority(signal);
  }

  /**
   * Determine the predominant difficulty level from tasks.
   * Uses the most common difficulty level, defaulting to MEDIUM.
   */
  private determinePredominantDifficulty(tasks: Task[]): DifficultyLevel {
    if (tasks.length === 0) {
      return DifficultyLevel.MEDIUM;
    }

    // Count occurrences of each difficulty
    const counts = new Map<PrismaDifficultyLevel, number>();
    for (const task of tasks) {
      const current = counts.get(task.difficulty) || 0;
      counts.set(task.difficulty, current + 1);
    }

    // Find the most common
    let maxCount = 0;
    let predominant: PrismaDifficultyLevel = 'medium';

    for (const [difficulty, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        predominant = difficulty;
      }
    }

    // Convert Prisma enum to our enum
    return this.prismaDifficultyToEnum(predominant);
  }

  /**
   * Convert Prisma DifficultyLevel to our enum.
   */
  private prismaDifficultyToEnum(prisma: PrismaDifficultyLevel): DifficultyLevel {
    switch (prisma) {
      case 'easy':
        return DifficultyLevel.EASY;
      case 'medium':
        return DifficultyLevel.MEDIUM;
      case 'hard':
        return DifficultyLevel.HARD;
      case 'extreme':
        return DifficultyLevel.EXTREME;
      default:
        return DifficultyLevel.MEDIUM;
    }
  }

  /**
   * Create adaptation rules context from goal and tasks.
   */
  private createContext(
    goalId: string,
    tasks: Task[],
    evaluationDate: Date,
  ): AdaptationRulesContext {
    return {
      goalId,
      currentDifficulty: this.determinePredominantDifficulty(tasks),
      taskIds: tasks.map((t) => t.id),
      evaluationDate,
    };
  }
}
