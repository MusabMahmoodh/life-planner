/**
 * Goal Controller
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Goals)
 * @see LLM INPUT CONTRACT Section 3 - System Architecture Rules
 * @see LLM INPUT CONTRACT Section 9 - API Contract
 *
 * Exposes:
 * - POST /goals/generate - Generate a new goal with AI
 * - GET /goals - List user's goals
 * - GET /goals/:id - Get goal details
 *
 * Rules:
 * - Controllers are thin
 * - DTO validation only
 * - No business logic
 * - No AI calls
 * - All endpoints require authenticated user
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { GoalService } from './goal.service';
import { GenerateGoalDto, ListGoalsQueryDto, GoalIdParamDto } from './dto';
import { UserId } from '../common/decorators';
import { RateLimitGuard, RateLimit, DEFAULT_AI_RATE_LIMIT } from '../common/guards';
import { GoalServiceErrorCode, GoalSummary, GoalDetails, CreateGoalResult } from './types';

/**
 * Response type for generate goal endpoint.
 */
interface GenerateGoalResponse {
  success: true;
  data: CreateGoalResult;
}

/**
 * Response type for list goals endpoint.
 */
interface ListGoalsResponse {
  success: true;
  data: GoalSummary[];
}

/**
 * Response type for get goal endpoint.
 */
interface GetGoalResponse {
  success: true;
  data: GoalDetails;
}

@Controller('goals')
export class GoalController {
  private readonly logger = new Logger(GoalController.name);

  constructor(private readonly goalService: GoalService) {}

  /**
   * Generate a new goal with AI-generated tasks.
   *
   * @route POST /goals/generate
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param dto - Goal generation input
   * @returns Created goal with tasks
   *
   * @throws BadRequestException if AI generation fails or validation fails
   * @throws TooManyRequestsException if rate limit exceeded (5 req/60s per user)
   *
   * @see BACKEND SPECIFICATION Section 9 - POST /goals/generate
   */
  @Post('generate')
  @UseGuards(RateLimitGuard)
  @RateLimit(DEFAULT_AI_RATE_LIMIT)
  @HttpCode(HttpStatus.CREATED)
  async generateGoal(
    @UserId() userId: string,
    @Body() dto: GenerateGoalDto,
  ): Promise<GenerateGoalResponse> {
    this.logger.log('Generate goal request', { userId });

    const result = await this.goalService.generateGoal({
      userId,
      goalDescription: dto.goalDescription,
      timezone: dto.timezone,
      communicationStyle: dto.communicationStyle,
      difficultyPreference: dto.difficultyPreference,
      scheduleContext: dto.scheduleContext,
    });

    if (!result.success) {
      this.logger.warn('Goal generation failed', {
        userId,
        error: result.error.code,
      });

      // Map service errors to HTTP errors
      throw this.mapServiceErrorToHttpError(result.error.code, result.error.message);
    }

    this.logger.log('Goal generated successfully', {
      userId,
      goalId: result.data.goalId,
    });

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * List all goals for the authenticated user.
   *
   * @route GET /goals
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param query - Query parameters for filtering and pagination
   * @returns List of goal summaries
   *
   * @see BACKEND SPECIFICATION Section 9 - GET /goals
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listGoals(
    @UserId() userId: string,
    @Query() query: ListGoalsQueryDto,
  ): Promise<ListGoalsResponse> {
    this.logger.log('List goals request', { userId, query });

    const goals = await this.goalService.listGoals(userId, {
      status: query.status,
      isArchived: query.isArchived,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      success: true,
      data: goals,
    };
  }

  /**
   * Get a single goal with full details.
   *
   * @route GET /goals/:id
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing goal ID
   * @returns Goal details with tasks
   *
   * @throws NotFoundException if goal not found or not owned by user
   *
   * @see BACKEND SPECIFICATION Section 9 - GET /goals/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGoal(
    @UserId() userId: string,
    @Param() params: GoalIdParamDto,
  ): Promise<GetGoalResponse> {
    this.logger.log('Get goal request', { userId, goalId: params.id });

    const result = await this.goalService.getGoal(userId, params.id);

    if (!result.success) {
      this.logger.warn('Goal not found', {
        userId,
        goalId: params.id,
        error: result.error.code,
      });

      throw this.mapServiceErrorToHttpError(result.error.code, result.error.message);
    }

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
    code: GoalServiceErrorCode,
    message: string,
  ): NotFoundException | BadRequestException {
    switch (code) {
      case GoalServiceErrorCode.GOAL_NOT_FOUND:
        return new NotFoundException(message);

      case GoalServiceErrorCode.AI_GENERATION_FAILED:
      case GoalServiceErrorCode.AI_VALIDATION_FAILED:
        return new BadRequestException(message);

      case GoalServiceErrorCode.GOAL_ARCHIVED:
      case GoalServiceErrorCode.INVALID_STATUS_TRANSITION:
        return new BadRequestException(message);

      default:
        return new BadRequestException(message);
    }
  }
}
