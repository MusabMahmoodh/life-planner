/**
 * AdaptationService handles the adaptation lifecycle.
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see LLM INPUT CONTRACT Section 8 - Adaptation Lifecycle
 *
 * Responsibilities:
 * - Store adaptation suggestions with state snapshots
 * - Accept adaptations and apply changes
 * - Reject adaptations with 7-day block
 * - Rollback accepted adaptations within rollback window
 *
 * All state changes are auditable via timestamps and snapshots.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Adaptation, AdaptationType, AdaptationStatus, Task, Prisma } from '@prisma/client';
import { AdaptationRepository } from './adaptation.repository';
import { GoalRepository } from '../goals/goal.repository';
import { TaskRepository } from '../tasks/task.repository';
import { ADAPTATION_BLOCK_DAYS, ROLLBACK_WINDOW_DAYS } from '../common/constants/domain.constants';
import {
  StoreSuggestionInput,
  StoreSuggestionResult,
  AcceptAdaptationInput,
  AcceptAdaptationResult,
  RejectAdaptationInput,
  RejectAdaptationResult,
  RollbackAdaptationInput,
  RollbackAdaptationResult,
  AdaptationDetails,
  AdaptationPreviousState,
  AdaptationNewState,
  AppliedChanges,
  AdaptationErrorCode,
  AdaptationError,
  ListAdaptationsOptions,
  AdaptationListResult,
} from './types/adaptation.types';

@Injectable()
export class AdaptationService {
  private readonly logger = new Logger(AdaptationService.name);

  constructor(
    private readonly adaptationRepository: AdaptationRepository,
    private readonly goalRepository: GoalRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  // ============================================
  // Store Suggestion
  // ============================================

  /**
   * Store an adaptation suggestion with state snapshot.
   *
   * @see LLM INPUT CONTRACT Section 8:
   * - Suggested → wait for user action
   * - Must snapshot previous state for potential rollback
   *
   * @param input - Suggestion input with goal, type, and proposed changes
   * @returns StoreSuggestionResult with created adaptation or error
   */
  async storeSuggestion(input: StoreSuggestionInput): Promise<StoreSuggestionResult> {
    const { userId, goalId, type, reason, newState, createdBy } = input;

    try {
      // 1. Verify goal exists and is owned by user
      const goal = await this.goalRepository.findById(userId, goalId);
      if (!goal) {
        return this.errorResult<StoreSuggestionResult>(
          AdaptationErrorCode.GOAL_NOT_FOUND,
          `Goal not found: ${goalId}`,
        );
      }

      // 2. Check if this adaptation type is blocked
      const isBlocked = await this.adaptationRepository.isAdaptationBlocked(userId, goalId, type);
      if (isBlocked) {
        return this.errorResult<StoreSuggestionResult>(
          AdaptationErrorCode.BLOCKED,
          `Adaptation type '${type}' is blocked for this goal. A similar adaptation was rejected within the last ${ADAPTATION_BLOCK_DAYS} days.`,
          { type, goalId, blockDays: ADAPTATION_BLOCK_DAYS },
        );
      }

      // 3. Create previous state snapshot
      const previousState = await this.createStateSnapshot(userId, goalId);

      // 4. Store the adaptation
      // Note: JSON.parse/stringify ensures deep clone for immutable snapshots
      const adaptation = await this.adaptationRepository.create(goalId, {
        type,
        reason,
        previousState: JSON.parse(JSON.stringify(previousState)) as Prisma.InputJsonValue,
        newState: JSON.parse(JSON.stringify(newState)) as Prisma.InputJsonValue,
        createdBy,
      });

      this.logger.log(
        `Stored adaptation suggestion: ${adaptation.id} (type=${type}, goal=${goalId})`,
      );

      return {
        success: true,
        adaptation,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to store suggestion: ${errorMessage}`, error);
      return this.errorResult<StoreSuggestionResult>(
        AdaptationErrorCode.INTERNAL_ERROR,
        'Failed to store adaptation suggestion',
        { error: errorMessage },
      );
    }
  }

  // ============================================
  // Accept Adaptation
  // ============================================

  /**
   * Accept an adaptation and apply the proposed changes.
   *
   * @see LLM INPUT CONTRACT Section 8:
   * - Accepted → apply newState
   * - Set processedAt timestamp for rollback window calculation
   *
   * @param input - Accept input with adaptation ID
   * @returns AcceptAdaptationResult with updated adaptation and applied changes
   */
  async acceptAdaptation(input: AcceptAdaptationInput): Promise<AcceptAdaptationResult> {
    const { userId, adaptationId } = input;

    try {
      // 1. Find adaptation with ownership check
      const adaptation = await this.adaptationRepository.findByIdWithGoal(userId, adaptationId);
      if (!adaptation) {
        return this.errorResult<AcceptAdaptationResult>(
          AdaptationErrorCode.NOT_FOUND,
          `Adaptation not found: ${adaptationId}`,
        );
      }

      // 2. Verify status is 'suggested'
      if (adaptation.status !== 'suggested') {
        return this.errorResult<AcceptAdaptationResult>(
          AdaptationErrorCode.INVALID_STATUS,
          `Cannot accept adaptation with status '${adaptation.status}'. Only 'suggested' adaptations can be accepted.`,
          { currentStatus: adaptation.status, requiredStatus: 'suggested' },
        );
      }

      // 3. Apply the new state changes
      const appliedChanges = await this.applyAdaptationChanges(
        userId,
        adaptation.goal.id,
        adaptation.type,
        adaptation.newState as AdaptationNewState,
      );

      // 4. Mark as accepted
      const updatedAdaptation = await this.adaptationRepository.markAccepted(userId, adaptationId);

      if (!updatedAdaptation) {
        return this.errorResult<AcceptAdaptationResult>(
          AdaptationErrorCode.APPLY_FAILED,
          'Failed to mark adaptation as accepted',
        );
      }

      this.logger.log(
        `Accepted adaptation: ${adaptationId} (tasksModified=${appliedChanges.tasksModified})`,
      );

      return {
        success: true,
        adaptation: updatedAdaptation,
        appliedChanges,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to accept adaptation: ${errorMessage}`, error);
      return this.errorResult<AcceptAdaptationResult>(
        AdaptationErrorCode.APPLY_FAILED,
        'Failed to accept adaptation',
        { error: errorMessage },
      );
    }
  }

  // ============================================
  // Reject Adaptation
  // ============================================

  /**
   * Reject an adaptation with 7-day block on re-application.
   *
   * @see LLM INPUT CONTRACT Section 8:
   * - Rejected → block re-apply for 7 days
   * - Set blockedUntil timestamp
   *
   * @param input - Reject input with adaptation ID
   * @returns RejectAdaptationResult with updated adaptation and block date
   */
  async rejectAdaptation(input: RejectAdaptationInput): Promise<RejectAdaptationResult> {
    const { userId, adaptationId } = input;

    try {
      // 1. Find adaptation with ownership check
      const adaptation = await this.adaptationRepository.findById(userId, adaptationId);
      if (!adaptation) {
        return this.errorResult<RejectAdaptationResult>(
          AdaptationErrorCode.NOT_FOUND,
          `Adaptation not found: ${adaptationId}`,
        );
      }

      // 2. Verify status is 'suggested'
      if (adaptation.status !== 'suggested') {
        return this.errorResult<RejectAdaptationResult>(
          AdaptationErrorCode.INVALID_STATUS,
          `Cannot reject adaptation with status '${adaptation.status}'. Only 'suggested' adaptations can be rejected.`,
          { currentStatus: adaptation.status, requiredStatus: 'suggested' },
        );
      }

      // 3. Mark as rejected (repository handles blockedUntil calculation)
      const updatedAdaptation = await this.adaptationRepository.markRejected(userId, adaptationId);

      if (!updatedAdaptation) {
        return this.errorResult<RejectAdaptationResult>(
          AdaptationErrorCode.INTERNAL_ERROR,
          'Failed to mark adaptation as rejected',
        );
      }

      this.logger.log(
        `Rejected adaptation: ${adaptationId} (blockedUntil=${updatedAdaptation.blockedUntil?.toISOString()})`,
      );

      return {
        success: true,
        adaptation: updatedAdaptation,
        blockedUntil: updatedAdaptation.blockedUntil ?? undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to reject adaptation: ${errorMessage}`, error);
      return this.errorResult<RejectAdaptationResult>(
        AdaptationErrorCode.INTERNAL_ERROR,
        'Failed to reject adaptation',
        { error: errorMessage },
      );
    }
  }

  // ============================================
  // Rollback Adaptation
  // ============================================

  /**
   * Rollback an accepted adaptation within the rollback window.
   *
   * @see LLM INPUT CONTRACT Section 8:
   * - Rolled_back → revert to previousState
   * - Must be within rollback window (7 days from processedAt)
   * - Block re-application for 7 days
   *
   * @param input - Rollback input with adaptation ID
   * @returns RollbackAdaptationResult with restored state
   */
  async rollbackAdaptation(input: RollbackAdaptationInput): Promise<RollbackAdaptationResult> {
    const { userId, adaptationId } = input;

    try {
      // 1. Find adaptation with ownership check
      const adaptation = await this.adaptationRepository.findByIdWithGoal(userId, adaptationId);
      if (!adaptation) {
        return this.errorResult<RollbackAdaptationResult>(
          AdaptationErrorCode.NOT_FOUND,
          `Adaptation not found: ${adaptationId}`,
        );
      }

      // 2. Verify status is 'accepted'
      if (adaptation.status !== 'accepted') {
        return this.errorResult<RollbackAdaptationResult>(
          AdaptationErrorCode.INVALID_STATUS,
          `Cannot rollback adaptation with status '${adaptation.status}'. Only 'accepted' adaptations can be rolled back.`,
          { currentStatus: adaptation.status, requiredStatus: 'accepted' },
        );
      }

      // 3. Verify within rollback window
      const isWithinWindow = this.isWithinRollbackWindow(adaptation);
      if (!isWithinWindow) {
        return this.errorResult<RollbackAdaptationResult>(
          AdaptationErrorCode.ROLLBACK_WINDOW_EXPIRED,
          `Rollback window has expired. Adaptations can only be rolled back within ${ROLLBACK_WINDOW_DAYS} days of acceptance.`,
          {
            processedAt: adaptation.processedAt?.toISOString(),
            rollbackWindowDays: ROLLBACK_WINDOW_DAYS,
          },
        );
      }

      // 4. Restore previous state
      const previousState = adaptation.previousState as AdaptationPreviousState;
      await this.restorePreviousState(userId, adaptation.goal.id, previousState);

      // 5. Mark as rolled back (repository handles blockedUntil calculation)
      const updatedAdaptation = await this.adaptationRepository.markRolledBack(
        userId,
        adaptationId,
      );

      if (!updatedAdaptation) {
        return this.errorResult<RollbackAdaptationResult>(
          AdaptationErrorCode.RESTORE_FAILED,
          'Failed to mark adaptation as rolled back',
        );
      }

      this.logger.log(
        `Rolled back adaptation: ${adaptationId} (restoredTasks=${previousState.tasks.length})`,
      );

      return {
        success: true,
        adaptation: updatedAdaptation,
        restoredState: previousState,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to rollback adaptation: ${errorMessage}`, error);
      return this.errorResult<RollbackAdaptationResult>(
        AdaptationErrorCode.RESTORE_FAILED,
        'Failed to rollback adaptation',
        { error: errorMessage },
      );
    }
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get adaptation details with rollback eligibility.
   */
  async getAdaptationDetails(
    userId: string,
    adaptationId: string,
  ): Promise<AdaptationDetails | null> {
    const adaptation = await this.adaptationRepository.findByIdWithGoal(userId, adaptationId);
    if (!adaptation) {
      return null;
    }

    const isWithinRollbackWindow = this.isWithinRollbackWindow(adaptation);
    const canBeRolledBack = adaptation.status === 'accepted' && isWithinRollbackWindow;

    return {
      adaptation,
      goal: adaptation.goal,
      isWithinRollbackWindow,
      canBeRolledBack,
    };
  }

  /**
   * List adaptations for a goal with filtering and pagination.
   */
  async listAdaptations(
    userId: string,
    goalId: string,
    options?: ListAdaptationsOptions,
  ): Promise<AdaptationListResult> {
    const [adaptations, total] = await Promise.all([
      this.adaptationRepository.findAllByGoal(userId, goalId, {
        status: options?.status as AdaptationStatus | undefined,
        limit: options?.limit,
        offset: options?.offset,
      }),
      this.adaptationRepository.countByGoal(userId, goalId, {
        status: options?.status as AdaptationStatus | undefined,
      }),
    ]);

    const offset = options?.offset ?? 0;
    const hasMore = offset + adaptations.length < total;

    return {
      adaptations,
      total,
      hasMore,
    };
  }

  /**
   * Get pending (suggested) adaptations for a goal.
   */
  async getPendingAdaptations(userId: string, goalId: string): Promise<Adaptation[]> {
    return this.adaptationRepository.findPendingByGoal(userId, goalId);
  }

  /**
   * Check if an adaptation type is blocked for a goal.
   */
  async isAdaptationBlocked(
    userId: string,
    goalId: string,
    type: AdaptationType,
  ): Promise<boolean> {
    return this.adaptationRepository.isAdaptationBlocked(userId, goalId, type);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Create a state snapshot for rollback purposes.
   * Captures task states for restoration on rollback.
   */
  private async createStateSnapshot(
    userId: string,
    goalId: string,
  ): Promise<AdaptationPreviousState> {
    // Get goal with its current state
    const goal = await this.goalRepository.findById(userId, goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // Get all tasks for the goal
    const tasks = await this.taskRepository.findAllByGoal(userId, goalId);

    return {
      snapshotAt: new Date().toISOString(),
      goal: {
        title: goal.title,
        status: goal.status,
        planVersion: goal.planVersion,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        difficulty: task.difficulty,
        frequency: task.frequency,
        estimatedDuration: task.estimatedDuration,
        orderIndex: task.orderIndex,
      })),
    };
  }

  /**
   * Apply adaptation changes to tasks.
   * All adaptations work at the task level (difficulty, frequency, etc.)
   */
  private async applyAdaptationChanges(
    userId: string,
    goalId: string,
    type: AdaptationType,
    newState: AdaptationNewState,
  ): Promise<AppliedChanges> {
    let tasksModified = 0;
    const goalChanges = {
      difficultyChanged: false,
      bufferAdded: false,
    };

    // Apply task changes if present
    if (newState.taskChanges && newState.taskChanges.length > 0) {
      for (const taskChange of newState.taskChanges) {
        const updated = await this.taskRepository.update(userId, taskChange.taskId, {
          difficulty: taskChange.changes.difficulty as Task['difficulty'] | undefined,
          frequency: taskChange.changes.frequency as Task['frequency'] | undefined,
          estimatedDuration: taskChange.changes.estimatedDuration,
        });
        if (updated) {
          tasksModified++;
        }
      }
    }

    // For difficulty_change type, update all tasks to new difficulty if not already specified per-task
    if (type === 'difficulty_change' && newState.newDifficulty && tasksModified === 0) {
      const tasks = await this.taskRepository.findAllByGoal(userId, goalId);
      for (const task of tasks) {
        const updated = await this.taskRepository.update(userId, task.id, {
          difficulty: newState.newDifficulty as Task['difficulty'],
        });
        if (updated) {
          tasksModified++;
        }
      }
      goalChanges.difficultyChanged = true;
    }

    // For buffer_add type, the effect is typically extending deadlines or reducing frequency
    // This is handled through taskChanges - we just mark that buffer was conceptually added
    if (type === 'buffer_add' && newState.bufferDays !== undefined) {
      goalChanges.bufferAdded = true;
    }

    // Increment goal plan version to track adaptation history
    await this.goalRepository.incrementPlanVersion(userId, goalId);

    return {
      tasksModified,
      goalChanges,
    };
  }

  /**
   * Restore previous state on rollback.
   * Restores task states to their pre-adaptation values.
   */
  private async restorePreviousState(
    userId: string,
    _goalId: string,
    previousState: AdaptationPreviousState,
  ): Promise<void> {
    // Restore task states from snapshot
    for (const taskSnapshot of previousState.tasks) {
      await this.taskRepository.update(userId, taskSnapshot.id, {
        status: taskSnapshot.status as Task['status'],
        difficulty: taskSnapshot.difficulty as Task['difficulty'],
        frequency: taskSnapshot.frequency as Task['frequency'],
        estimatedDuration: taskSnapshot.estimatedDuration,
        orderIndex: taskSnapshot.orderIndex,
      });
    }
  }

  /**
   * Check if adaptation is within rollback window.
   */
  private isWithinRollbackWindow(adaptation: Adaptation): boolean {
    if (!adaptation.processedAt) {
      // Not yet processed, cannot determine rollback window
      return false;
    }

    const rollbackDeadline = new Date(adaptation.processedAt);
    rollbackDeadline.setDate(rollbackDeadline.getDate() + ROLLBACK_WINDOW_DAYS);

    return new Date() <= rollbackDeadline;
  }

  /**
   * Create an error result object.
   */
  private errorResult<T extends { success: boolean; error?: AdaptationError }>(
    code: AdaptationErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): T {
    const error: AdaptationError = {
      code,
      message,
      details,
    };

    return {
      success: false,
      error,
    } as T;
  }
}
