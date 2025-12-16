/**
 * Goal Service
 *
 * @see BACKEND SPECIFICATION Section 3 - Core Domain Modules
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Goals)
 * @see LLM INPUT CONTRACT Section 3 - System Architecture Rules
 *
 * This service handles goal-related business logic.
 *
 * Flow for goal creation:
 * 1. Receive goal creation request
 * 2. Call AIGateway.generateGoalPlan (no AI logic here)
 * 3. Validate AI output with Zod schemas
 * 4. Persist Goal and Tasks via repositories
 * 5. Initialize behavioral metrics
 *
 * Rules:
 * - No controller logic
 * - No AI logic inside service (delegated to AIGateway)
 * - Use repositories only for database access
 * - All queries scoped by userId
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GoalRepository } from './goal.repository';
import { TaskRepository } from '../tasks/task.repository';
import {
  CreateGoalInput,
  CreateGoalResult,
  GoalSummary,
  GoalDetails,
  ListGoalsOptions,
  UpdateGoalInput,
  GoalOperationResult,
  GoalServiceError,
  GoalServiceErrorCode,
  createInitialConsistencyMetrics,
  createInitialFailureRecoveryState,
  createInitialProgressSignals,
  ConsistencyMetrics,
  FailureRecoveryState,
  ProgressSignals,
} from './types';
import { IAIGatewayService, AI_GATEWAY_SERVICE, AIGatewayErrorCode } from '../ai/types';
import { GoalPlanSchema, validateTaskOrderIndices } from '../ai/types/ai-output.schemas';
import { GoalStatus, TaskStatus, DifficultyLevel, TaskFrequency } from '../common/enums';

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly taskRepository: TaskRepository,
    @Inject(AI_GATEWAY_SERVICE)
    private readonly aiGateway: IAIGatewayService,
  ) {}

  // ============================================
  // Goal Creation
  // ============================================

  /**
   * Generate and create a new goal with AI-generated tasks.
   *
   * Flow:
   * 1. Call AIGateway.generateGoalPlan
   * 2. Validate AI output
   * 3. Persist Goal
   * 4. Persist Tasks
   * 5. Initialize behavioral metrics
   *
   * @param input - Goal creation input
   * @returns Result with created goal or error
   *
   * @see BACKEND SPECIFICATION Section 9 - POST /goals/generate
   */
  async generateGoal(input: CreateGoalInput): Promise<GoalOperationResult<CreateGoalResult>> {
    this.logger.log('Generating goal', { userId: input.userId });

    // Step 1: Call AI Gateway (no AI logic here)
    const aiResult = await this.aiGateway.generateGoalPlan({
      goalDescription: input.goalDescription,
      timezone: input.timezone,
      communicationStyle: input.communicationStyle,
      difficultyPreference: input.difficultyPreference,
      scheduleContext: input.scheduleContext,
    });

    if (!aiResult.success) {
      this.logger.warn('AI generation failed', { error: aiResult.error });
      return {
        success: false,
        error: this.mapAIErrorToGoalError(aiResult.error),
      };
    }

    // Step 2: Validate AI output with Zod schema
    const validationResult = GoalPlanSchema.safeParse(aiResult.data);
    if (!validationResult.success) {
      this.logger.warn('AI output validation failed', {
        errors: validationResult.error.issues,
      });
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.AI_VALIDATION_FAILED,
          message: 'AI-generated plan failed validation',
          details: { issues: validationResult.error.issues },
        },
      };
    }

    const validatedPlan = validationResult.data;

    // Step 2b: Validate task order indices
    const orderValidation = validateTaskOrderIndices(validatedPlan.tasks);
    if (!orderValidation.valid) {
      this.logger.warn('Task order validation failed', { error: orderValidation.error });
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.AI_VALIDATION_FAILED,
          message: orderValidation.error,
        },
      };
    }

    // Step 3: Initialize behavioral metrics
    const consistencyMetrics = createInitialConsistencyMetrics();
    const failureRecovery = createInitialFailureRecoveryState();
    const progressSignals = createInitialProgressSignals();

    // Step 4: Persist Goal
    const goal = await this.goalRepository.create(input.userId, {
      title: validatedPlan.title,
      originalPlan: validatedPlan.explanation,
      consistencyMetrics: consistencyMetrics as unknown as Prisma.InputJsonValue,
      failureRecovery: failureRecovery as unknown as Prisma.InputJsonValue,
      progressSignals: progressSignals as unknown as Prisma.InputJsonValue,
    });

    this.logger.log('Goal created', { goalId: goal.id });

    // Step 5: Persist Tasks
    await this.taskRepository.createMany(
      goal.id,
      validatedPlan.tasks.map((task) => ({
        title: task.title,
        difficulty: task.difficulty as DifficultyLevel,
        frequency: task.frequency as TaskFrequency,
        estimatedDuration: task.estimatedDuration,
        isOptional: task.isOptional,
        orderIndex: task.orderIndex,
      })),
    );

    // Fetch created tasks
    const tasks = await this.taskRepository.findAllByGoal(input.userId, goal.id);

    this.logger.log('Tasks created', { goalId: goal.id, taskCount: tasks.length });

    return {
      success: true,
      data: {
        goalId: goal.id,
        title: goal.title,
        status: GoalStatus.ACTIVE,
        planVersion: goal.planVersion,
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          difficulty: task.difficulty as DifficultyLevel,
          frequency: task.frequency as TaskFrequency,
          estimatedDuration: task.estimatedDuration,
          isOptional: task.isOptional,
          orderIndex: task.orderIndex,
        })),
        explanation: validatedPlan.explanation,
        createdAt: goal.createdAt,
      },
    };
  }

  // ============================================
  // Goal Queries
  // ============================================

  /**
   * Get all goals for a user.
   *
   * @param userId - User ID
   * @param options - List options
   * @returns Array of goal summaries
   *
   * @see BACKEND SPECIFICATION Section 9 - GET /goals
   */
  async listGoals(userId: string, options?: ListGoalsOptions): Promise<GoalSummary[]> {
    const goals = await this.goalRepository.findAllByUser(userId, {
      status: options?.status,
      isArchived: options?.isArchived,
      limit: options?.limit,
      offset: options?.offset,
    });

    // Get task counts for each goal
    const summaries: GoalSummary[] = [];

    for (const goal of goals) {
      const taskCount = await this.taskRepository.countByGoal(userId, goal.id);
      const completedTaskCount = await this.taskRepository.countByGoal(userId, goal.id, {
        status: TaskStatus.COMPLETED,
      });

      summaries.push({
        id: goal.id,
        title: goal.title,
        status: goal.status as GoalStatus,
        isArchived: goal.isArchived,
        planVersion: goal.planVersion,
        taskCount,
        completedTaskCount,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      });
    }

    return summaries;
  }

  /**
   * Get a single goal with full details.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @returns Goal details or error
   *
   * @see BACKEND SPECIFICATION Section 9 - GET /goals/:id
   */
  async getGoal(userId: string, goalId: string): Promise<GoalOperationResult<GoalDetails>> {
    const goal = await this.goalRepository.findByIdWithTasks(userId, goalId);

    if (!goal) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.GOAL_NOT_FOUND,
          message: 'Goal not found',
        },
      };
    }

    return {
      success: true,
      data: {
        id: goal.id,
        title: goal.title,
        status: goal.status as GoalStatus,
        isArchived: goal.isArchived,
        planVersion: goal.planVersion,
        originalPlan: goal.originalPlan,
        consistencyMetrics: goal.consistencyMetrics as unknown as ConsistencyMetrics,
        failureRecovery: goal.failureRecovery as unknown as FailureRecoveryState,
        progressSignals: goal.progressSignals as unknown as ProgressSignals,
        tasks: goal.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          difficulty: task.difficulty as DifficultyLevel,
          frequency: task.frequency as TaskFrequency,
          estimatedDuration: task.estimatedDuration,
          isOptional: task.isOptional,
          orderIndex: task.orderIndex,
        })),
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    };
  }

  // ============================================
  // Goal Updates
  // ============================================

  /**
   * Update a goal.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param input - Update input
   * @returns Updated goal details or error
   *
   * @see BACKEND SPECIFICATION Section 9 - PATCH /goals/:id
   */
  async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateGoalInput,
  ): Promise<GoalOperationResult<GoalDetails>> {
    // Verify goal exists and user owns it
    const existing = await this.goalRepository.findById(userId, goalId);

    if (!existing) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.GOAL_NOT_FOUND,
          message: 'Goal not found',
        },
      };
    }

    // Check if goal is archived (cannot modify archived goals except to unarchive)
    if (existing.isArchived && input.isArchived !== false) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.GOAL_ARCHIVED,
          message: 'Cannot modify archived goal',
        },
      };
    }

    // Validate status transition if status is being changed
    if (
      input.status != null &&
      !this.isValidStatusTransition(existing.status as GoalStatus, input.status)
    ) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.INVALID_STATUS_TRANSITION,
          message: `Invalid status transition from ${existing.status} to ${input.status}`,
        },
      };
    }

    // Update goal
    const updated = await this.goalRepository.update(userId, goalId, {
      title: input.title,
      status: input.status,
      isArchived: input.isArchived,
    });

    if (!updated) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.GOAL_NOT_FOUND,
          message: 'Goal not found after update',
        },
      };
    }

    // Fetch updated goal with tasks
    return this.getGoal(userId, goalId);
  }

  // ============================================
  // Goal Archive/Delete
  // ============================================

  /**
   * Archive a goal (soft delete).
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @returns Success or error
   */
  async archiveGoal(userId: string, goalId: string): Promise<GoalOperationResult<void>> {
    const result = await this.goalRepository.archive(userId, goalId);

    if (!result) {
      return {
        success: false,
        error: {
          code: GoalServiceErrorCode.GOAL_NOT_FOUND,
          message: 'Goal not found',
        },
      };
    }

    this.logger.log('Goal archived', { goalId });

    return { success: true, data: undefined };
  }

  // ============================================
  // Internal Methods
  // ============================================

  /**
   * Update behavioral metrics for a goal.
   * Called by TaskService when task status changes.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param metrics - Updated metrics
   */
  async updateConsistencyMetrics(
    userId: string,
    goalId: string,
    metrics: ConsistencyMetrics,
  ): Promise<void> {
    await this.goalRepository.update(userId, goalId, {
      consistencyMetrics: metrics as unknown as Prisma.InputJsonValue,
    });
  }

  /**
   * Update failure recovery state for a goal.
   * Called by BehavioralEngine when failure state changes.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param state - Updated state
   */
  async updateFailureRecoveryState(
    userId: string,
    goalId: string,
    state: FailureRecoveryState,
  ): Promise<void> {
    await this.goalRepository.update(userId, goalId, {
      failureRecovery: state as unknown as Prisma.InputJsonValue,
    });
  }

  /**
   * Update progress signals for a goal.
   * Called by TaskService when task activity occurs.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @param signals - Updated signals
   */
  async updateProgressSignals(
    userId: string,
    goalId: string,
    signals: ProgressSignals,
  ): Promise<void> {
    await this.goalRepository.update(userId, goalId, {
      progressSignals: signals as unknown as Prisma.InputJsonValue,
    });
  }

  /**
   * Increment plan version after adaptation is accepted.
   *
   * @param userId - User ID
   * @param goalId - Goal ID
   * @returns New plan version
   */
  async incrementPlanVersion(userId: string, goalId: string): Promise<number | null> {
    const updated = await this.goalRepository.incrementPlanVersion(userId, goalId);
    return updated?.planVersion ?? null;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Map AI Gateway error to Goal Service error.
   */
  private mapAIErrorToGoalError(error: {
    code: AIGatewayErrorCode;
    message: string;
    details?: Record<string, unknown>;
  }): GoalServiceError {
    switch (error.code) {
      case AIGatewayErrorCode.VALIDATION_FAILED:
      case AIGatewayErrorCode.CONSTRAINT_VIOLATION:
        return {
          code: GoalServiceErrorCode.AI_VALIDATION_FAILED,
          message: error.message,
          details: error.details,
        };
      default:
        return {
          code: GoalServiceErrorCode.AI_GENERATION_FAILED,
          message: error.message,
          details: error.details,
        };
    }
  }

  /**
   * Check if status transition is valid.
   *
   * Valid transitions:
   * - active → completed, paused, abandoned
   * - paused → active, abandoned
   * - completed → (none, final state)
   * - abandoned → (none, final state)
   */
  private isValidStatusTransition(from: GoalStatus, to: GoalStatus): boolean {
    if (from === to) {
      return true; // No change is always valid
    }

    const validTransitions: Record<GoalStatus, GoalStatus[]> = {
      [GoalStatus.ACTIVE]: [GoalStatus.COMPLETED, GoalStatus.PAUSED, GoalStatus.ABANDONED],
      [GoalStatus.PAUSED]: [GoalStatus.ACTIVE, GoalStatus.ABANDONED],
      [GoalStatus.COMPLETED]: [], // Final state
      [GoalStatus.ABANDONED]: [], // Final state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
