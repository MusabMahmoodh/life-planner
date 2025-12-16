/**
 * Task Controller
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Tasks)
 * @see LLM INPUT CONTRACT Section 3 - System Architecture Rules
 * @see LLM INPUT CONTRACT Section 9 - API Contract
 *
 * Exposes:
 * - PATCH /tasks/:id/complete - Complete a task (idempotent)
 * - PATCH /tasks/:id/skip - Skip a task
 *
 * Rules:
 * - Controllers are thin
 * - No logic beyond delegation
 * - No AI calls
 * - All endpoints require authenticated user
 */

import {
  Controller,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskIdParamDto, CompleteTaskDto, SkipTaskDto } from './dto';
import { UserId } from '../common/decorators';
import { TaskServiceErrorCode, TaskOperationResult } from './types';

/**
 * Response type for task operations.
 */
interface TaskOperationResponse {
  success: true;
  data: TaskOperationResult;
}

@Controller('tasks')
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private readonly taskService: TaskService) {}

  /**
   * Complete a task.
   *
   * Idempotent: If task is already completed, returns success.
   *
   * @route PATCH /tasks/:id/complete
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing task ID
   * @param dto - Optional body with actual duration
   * @returns Updated task with operation result
   *
   * @throws NotFoundException if task not found or not owned by user
   * @throws BadRequestException if invalid status transition
   * @throws ForbiddenException if goal is archived or not active
   *
   * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/complete
   * @see LLM INPUT CONTRACT Section 11 - Idempotent task completion
   */
  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeTask(
    @UserId() userId: string,
    @Param() params: TaskIdParamDto,
    @Body() dto: CompleteTaskDto,
  ): Promise<TaskOperationResponse> {
    this.logger.log('Complete task request', { userId, taskId: params.id });

    const result = await this.taskService.completeTask({
      userId,
      taskId: params.id,
      actualDuration: dto.actualDuration,
    });

    if (!result.success) {
      this.logger.warn('Task completion failed', {
        userId,
        taskId: params.id,
        error: result.error.code,
      });

      throw this.mapServiceErrorToHttpError(result.error.code, result.error.message);
    }

    this.logger.log('Task completed successfully', {
      userId,
      taskId: params.id,
      statusChanged: result.data.statusChanged,
    });

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Skip a task.
   *
   * Idempotent: If task is already skipped, returns success.
   *
   * @route PATCH /tasks/:id/skip
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing task ID
   * @param _dto - Empty body (for future extensibility)
   * @returns Updated task with operation result
   *
   * @throws NotFoundException if task not found or not owned by user
   * @throws BadRequestException if invalid status transition
   * @throws ForbiddenException if goal is archived or not active
   *
   * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/skip
   */
  @Patch(':id/skip')
  @HttpCode(HttpStatus.OK)
  async skipTask(
    @UserId() userId: string,
    @Param() params: TaskIdParamDto,
    @Body() _dto: SkipTaskDto,
  ): Promise<TaskOperationResponse> {
    this.logger.log('Skip task request', { userId, taskId: params.id });

    const result = await this.taskService.skipTask({
      userId,
      taskId: params.id,
    });

    if (!result.success) {
      this.logger.warn('Task skip failed', {
        userId,
        taskId: params.id,
        error: result.error.code,
      });

      throw this.mapServiceErrorToHttpError(result.error.code, result.error.message);
    }

    this.logger.log('Task skipped successfully', {
      userId,
      taskId: params.id,
      statusChanged: result.data.statusChanged,
    });

    return {
      success: true,
      data: result.data,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Map service error codes to appropriate HTTP exceptions.
   */
  private mapServiceErrorToHttpError(
    code: TaskServiceErrorCode,
    message: string,
  ): NotFoundException | BadRequestException | ForbiddenException {
    switch (code) {
      case TaskServiceErrorCode.TASK_NOT_FOUND:
        return new NotFoundException(message);

      case TaskServiceErrorCode.INVALID_STATUS_TRANSITION:
      case TaskServiceErrorCode.TASK_ALREADY_IN_STATUS:
        return new BadRequestException(message);

      case TaskServiceErrorCode.GOAL_ARCHIVED:
      case TaskServiceErrorCode.GOAL_NOT_ACTIVE:
        return new ForbiddenException(message);

      default:
        return new BadRequestException(message);
    }
  }
}
