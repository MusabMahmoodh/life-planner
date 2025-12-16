/**
 * Task Service
 *
 * @see BACKEND SPECIFICATION Section 3 - Core Domain Modules
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Tasks)
 * @see LLM INPUT CONTRACT Section 11 - Validation & Error Handling
 *
 * This service handles task-related business logic.
 *
 * Responsibilities:
 * - Complete task (idempotent)
 * - Skip task
 * - Trigger behavioral evaluation explicitly after task state changes
 *
 * Rules:
 * - No adaptation logic (handled by AdaptationsService)
 * - No AI calls
 * - Enforce user ownership via repository
 * - Idempotent task completion
 * - BehavioralEngine is called explicitly (not via background jobs)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskRepository } from './task.repository';
import { BehavioralEngineService } from '../behavior/behavioral-engine.service';
import { GoalRepository } from '../goals/goal.repository';
import {
  CompleteTaskInput,
  SkipTaskInput,
  TaskDetails,
  TaskOperationResult,
  TaskOperationResponse,
  TaskServiceError,
  TaskServiceErrorCode,
  BehaviorEvaluationTrigger,
  TaskEventType,
  isValidTaskStatusTransition,
} from './types';
import { TaskStatus, DifficultyLevel, TaskFrequency, GoalStatus } from '../common/enums';
import { BehavioralEvaluationResult } from '../behavior/types';

/**
 * Event name for behavior evaluation triggers.
 * Consumed by BehaviorModule.
 */
export const BEHAVIOR_EVALUATION_EVENT = 'behavior.evaluation.trigger';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly goalRepository: GoalRepository,
    private readonly behavioralEngine: BehavioralEngineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // Task Completion (Idempotent)
  // ============================================

  /**
   * Complete a task.
   *
   * Idempotent: If task is already completed, returns success without changes.
   *
   * Flow:
   * 1. Verify task exists and user owns it
   * 2. Verify goal is active (not archived/paused/abandoned)
   * 3. Check if already completed (idempotent return)
   * 4. Validate status transition
   * 5. Update task status
   * 6. Emit behavior evaluation trigger
   *
   * @param input - Complete task input
   * @returns Task operation result or error
   *
   * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/complete
   * @see LLM INPUT CONTRACT Section 11 - Idempotent task completion
   */
  async completeTask(
    input: CompleteTaskInput,
  ): Promise<TaskOperationResponse<TaskOperationResult>> {
    const { userId, taskId, actualDuration } = input;
    this.logger.log('Completing task', { userId, taskId });

    // Step 1: Find task with goal (verifies ownership)
    const taskWithGoal = await this.taskRepository.findByIdWithGoal(userId, taskId);

    if (!taskWithGoal) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found or not owned by user',
        },
      };
    }

    // Step 2: Verify goal is active
    const goalValidation = this.validateGoalForTaskOperation(taskWithGoal.goal);
    if (!goalValidation.valid) {
      return {
        success: false,
        error: goalValidation.error,
      };
    }

    const previousStatus = taskWithGoal.status as TaskStatus;

    // Step 3: Idempotent check - already completed
    if (previousStatus === TaskStatus.COMPLETED) {
      this.logger.log('Task already completed (idempotent)', { taskId });
      return {
        success: true,
        data: {
          task: this.mapTaskToDetails(taskWithGoal),
          statusChanged: false,
          previousStatus,
        },
      };
    }

    // Step 4: Validate status transition
    if (!isValidTaskStatusTransition(previousStatus, TaskStatus.COMPLETED)) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.INVALID_STATUS_TRANSITION,
          message: `Cannot transition from ${previousStatus} to completed`,
          details: { currentStatus: previousStatus },
        },
      };
    }

    // Step 5: Update task status
    const updatedTask = await this.taskRepository.markCompleted(userId, taskId, actualDuration);

    if (!updatedTask) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found during update',
        },
      };
    }

    this.logger.log('Task completed', { taskId, previousStatus });

    // Step 6: Trigger behavioral evaluation explicitly
    // Per specification: BehavioralEngine is called explicitly after task state changes
    // No background jobs - evaluation happens synchronously
    const behavioralResult = await this.triggerBehavioralEvaluation(
      userId,
      taskWithGoal.goalId,
      taskId,
      TaskEventType.COMPLETED,
    );

    return {
      success: true,
      data: {
        task: this.mapTaskToDetails(updatedTask),
        statusChanged: true,
        previousStatus,
        behavioralEvaluation: behavioralResult,
      },
    };
  }

  // ============================================
  // Task Skip
  // ============================================

  /**
   * Skip a task.
   *
   * Flow:
   * 1. Verify task exists and user owns it
   * 2. Verify goal is active
   * 3. Validate status transition
   * 4. Update task status
   * 5. Emit behavior evaluation trigger
   *
   * @param input - Skip task input
   * @returns Task operation result or error
   *
   * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/skip
   */
  async skipTask(input: SkipTaskInput): Promise<TaskOperationResponse<TaskOperationResult>> {
    const { userId, taskId } = input;
    this.logger.log('Skipping task', { userId, taskId });

    // Step 1: Find task with goal (verifies ownership)
    const taskWithGoal = await this.taskRepository.findByIdWithGoal(userId, taskId);

    if (!taskWithGoal) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found or not owned by user',
        },
      };
    }

    // Step 2: Verify goal is active
    const goalValidation = this.validateGoalForTaskOperation(taskWithGoal.goal);
    if (!goalValidation.valid) {
      return {
        success: false,
        error: goalValidation.error,
      };
    }

    const previousStatus = taskWithGoal.status as TaskStatus;

    // Idempotent check - already skipped
    if (previousStatus === TaskStatus.SKIPPED) {
      this.logger.log('Task already skipped (idempotent)', { taskId });
      return {
        success: true,
        data: {
          task: this.mapTaskToDetails(taskWithGoal),
          statusChanged: false,
          previousStatus,
        },
      };
    }

    // Step 3: Validate status transition
    if (!isValidTaskStatusTransition(previousStatus, TaskStatus.SKIPPED)) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.INVALID_STATUS_TRANSITION,
          message: `Cannot transition from ${previousStatus} to skipped`,
          details: { currentStatus: previousStatus },
        },
      };
    }

    // Step 4: Update task status
    const updatedTask = await this.taskRepository.markSkipped(userId, taskId);

    if (!updatedTask) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found during update',
        },
      };
    }

    this.logger.log('Task skipped', { taskId, previousStatus });

    // Step 5: Trigger behavioral evaluation explicitly
    // Per specification: BehavioralEngine is called explicitly after task state changes
    // Skipping a task may indicate struggling behavior
    const behavioralResult = await this.triggerBehavioralEvaluation(
      userId,
      taskWithGoal.goalId,
      taskId,
      TaskEventType.SKIPPED,
    );

    return {
      success: true,
      data: {
        task: this.mapTaskToDetails(updatedTask),
        statusChanged: true,
        previousStatus,
        behavioralEvaluation: behavioralResult,
      },
    };
  }

  // ============================================
  // Task Queries
  // ============================================

  /**
   * Get a task by ID.
   *
   * @param userId - User ID
   * @param taskId - Task ID
   * @returns Task details or error
   */
  async getTask(userId: string, taskId: string): Promise<TaskOperationResponse<TaskDetails>> {
    const task = await this.taskRepository.findById(userId, taskId);

    if (!task) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found or not owned by user',
        },
      };
    }

    return {
      success: true,
      data: this.mapTaskToDetails(task),
    };
  }

  /**
   * Get all tasks for a goal.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param status - Optional status filter
   * @returns Array of task details
   */
  async getTasksByGoal(
    userId: string,
    goalId: string,
    status?: TaskStatus,
  ): Promise<TaskDetails[]> {
    const tasks = await this.taskRepository.findAllByGoal(userId, goalId, { status });
    return tasks.map((task) => this.mapTaskToDetails(task));
  }

  // ============================================
  // Internal: Mark Overdue (called by scheduler/cron)
  // ============================================

  /**
   * Mark a task as overdue.
   * This is called by a scheduler, not directly by users.
   *
   * @param userId - User ID
   * @param taskId - Task ID
   * @returns Task operation result or error
   */
  async markTaskOverdue(
    userId: string,
    taskId: string,
  ): Promise<TaskOperationResponse<TaskOperationResult>> {
    this.logger.log('Marking task overdue', { userId, taskId });

    const taskWithGoal = await this.taskRepository.findByIdWithGoal(userId, taskId);

    if (!taskWithGoal) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found',
        },
      };
    }

    const previousStatus = taskWithGoal.status as TaskStatus;

    // Only pending tasks can become overdue
    if (previousStatus !== TaskStatus.PENDING) {
      return {
        success: true,
        data: {
          task: this.mapTaskToDetails(taskWithGoal),
          statusChanged: false,
          previousStatus,
        },
      };
    }

    const updatedTask = await this.taskRepository.markOverdue(userId, taskId);

    if (!updatedTask) {
      return {
        success: false,
        error: {
          code: TaskServiceErrorCode.TASK_NOT_FOUND,
          message: 'Task not found during update',
        },
      };
    }

    this.logger.log('Task marked overdue', { taskId });

    // Trigger behavioral evaluation explicitly
    // Overdue tasks are a signal of potential struggling behavior
    const behavioralResult = await this.triggerBehavioralEvaluation(
      userId,
      taskWithGoal.goalId,
      taskId,
      TaskEventType.MARKED_OVERDUE,
    );

    return {
      success: true,
      data: {
        task: this.mapTaskToDetails(updatedTask),
        statusChanged: true,
        previousStatus,
        behavioralEvaluation: behavioralResult,
      },
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Trigger behavioral evaluation for a goal after task state change.
   *
   * Per specification:
   * - BehavioralEngine is called explicitly (not via background jobs)
   * - Evaluation is deterministic and testable
   * - No AI calls
   * - No adaptation application (that's handled by AdaptationsService)
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param taskId - Task ID that triggered evaluation
   * @param eventType - Type of event that triggered evaluation
   * @returns Behavioral evaluation result
   */
  private async triggerBehavioralEvaluation(
    userId: string,
    goalId: string,
    taskId: string,
    eventType: TaskEventType,
  ): Promise<BehavioralEvaluationResult | null> {
    try {
      this.logger.debug('Triggering behavioral evaluation', { userId, goalId, taskId, eventType });

      // Get all tasks for the goal to evaluate behavioral state
      const tasks = await this.taskRepository.findAllByGoal(userId, goalId, {});

      // Get goal to determine last activity date
      const goal = await this.goalRepository.findById(userId, goalId);
      const lastActivityDate = goal?.updatedAt ?? null;

      // Run deterministic behavioral evaluation
      const result = this.behavioralEngine.evaluate(tasks, lastActivityDate);

      this.logger.debug('Behavioral evaluation completed', {
        goalId,
        signals: result.signals.map((s) => s.type),
        shouldTriggerAdaptation: result.shouldTriggerAdaptation,
      });

      // Emit event for any listeners (e.g., adaptation proposal service)
      // This is in addition to the explicit evaluation result
      this.emitBehaviorTrigger({
        goalId,
        userId,
        taskId,
        eventType,
        timestamp: new Date(),
        evaluationResult: result,
      });

      return result;
    } catch (error) {
      // Log error but don't fail the task operation
      // Behavioral evaluation is secondary to the task state change
      this.logger.error('Failed to trigger behavioral evaluation', {
        userId,
        goalId,
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Validate that goal allows task operations.
   */
  private validateGoalForTaskOperation(goal: {
    status: string;
    isArchived: boolean;
  }): { valid: true } | { valid: false; error: TaskServiceError } {
    if (goal.isArchived) {
      return {
        valid: false,
        error: {
          code: TaskServiceErrorCode.GOAL_ARCHIVED,
          message: 'Cannot modify tasks for archived goal',
        },
      };
    }

    const goalStatus = goal.status as GoalStatus;

    if (goalStatus !== GoalStatus.ACTIVE) {
      return {
        valid: false,
        error: {
          code: TaskServiceErrorCode.GOAL_NOT_ACTIVE,
          message: `Cannot modify tasks for goal with status: ${goalStatus}`,
          details: { goalStatus },
        },
      };
    }

    return { valid: true };
  }

  /**
   * Emit behavior evaluation trigger event.
   * This is consumed by BehaviorModule to evaluate goal state.
   */
  private emitBehaviorTrigger(trigger: BehaviorEvaluationTrigger): void {
    this.eventEmitter.emit(BEHAVIOR_EVALUATION_EVENT, trigger);
    this.logger.debug('Behavior evaluation trigger emitted', {
      goalId: trigger.goalId,
      eventType: trigger.eventType,
    });
  }

  /**
   * Map database task to TaskDetails.
   */
  private mapTaskToDetails(task: {
    id: string;
    goalId: string;
    title: string;
    status: string;
    difficulty: string;
    frequency: string;
    estimatedDuration: number;
    actualDuration: number | null;
    isOptional: boolean;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }): TaskDetails {
    return {
      id: task.id,
      goalId: task.goalId,
      title: task.title,
      status: task.status as TaskStatus,
      difficulty: task.difficulty as DifficultyLevel,
      frequency: task.frequency as TaskFrequency,
      estimatedDuration: task.estimatedDuration,
      actualDuration: task.actualDuration,
      isOptional: task.isOptional,
      orderIndex: task.orderIndex,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
