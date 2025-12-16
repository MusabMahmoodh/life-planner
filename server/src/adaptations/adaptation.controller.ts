/**
 * Adaptation Controller
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Adaptations)
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see LLM INPUT CONTRACT Section 9 - API Contract
 *
 * Exposes:
 * - GET /adaptations/:goalId - List adaptations for a goal
 * - POST /adaptations/:id/accept - Accept a suggested adaptation
 * - POST /adaptations/:id/reject - Reject a suggested adaptation
 * - POST /adaptations/:id/rollback - Rollback an accepted adaptation
 *
 * Rules:
 * - Controllers are thin
 * - Enforce user ownership
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
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AdaptationService } from './adaptation.service';
import {
  GoalIdParamDto,
  AdaptationIdParamDto,
  ListAdaptationsQueryDto,
  AcceptAdaptationDto,
  RejectAdaptationDto,
  RollbackAdaptationDto,
} from './dto';
import { UserId } from '../common/decorators';
import { AdaptationErrorCode, AdaptationListResult } from './types';

/**
 * Response type for list adaptations endpoint.
 */
interface ListAdaptationsResponse {
  success: true;
  data: AdaptationListResult;
}

/**
 * Response type for accept adaptation endpoint.
 */
interface AcceptAdaptationResponse {
  success: true;
  data: {
    adaptationId: string;
    status: string;
    appliedChanges: {
      tasksModified: number;
      goalChanges: {
        difficultyChanged: boolean;
        bufferAdded: boolean;
      };
    };
  };
}

/**
 * Response type for reject adaptation endpoint.
 */
interface RejectAdaptationResponse {
  success: true;
  data: {
    adaptationId: string;
    status: string;
    blockedUntil: string | null;
  };
}

/**
 * Response type for rollback adaptation endpoint.
 */
interface RollbackAdaptationResponse {
  success: true;
  data: {
    adaptationId: string;
    status: string;
    restoredTaskCount: number;
  };
}

@Controller('adaptations')
export class AdaptationController {
  private readonly logger = new Logger(AdaptationController.name);

  constructor(private readonly adaptationService: AdaptationService) {}

  /**
   * List adaptations for a goal.
   *
   * @route GET /adaptations/:goalId
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing goal ID
   * @param query - Query parameters for filtering and pagination
   * @returns List of adaptations with pagination info
   *
   * @see BACKEND SPECIFICATION Section 9 - GET /adaptations/:goalId
   */
  @Get(':goalId')
  @HttpCode(HttpStatus.OK)
  async listAdaptations(
    @UserId() userId: string,
    @Param() params: GoalIdParamDto,
    @Query() query: ListAdaptationsQueryDto,
  ): Promise<ListAdaptationsResponse> {
    this.logger.log('List adaptations request', {
      userId,
      goalId: params.goalId,
      query,
    });

    const result = await this.adaptationService.listAdaptations(userId, params.goalId, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Accept a suggested adaptation.
   *
   * @route POST /adaptations/:id/accept
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing adaptation ID
   * @param _dto - Empty body (for future extensibility)
   * @returns Accepted adaptation with applied changes
   *
   * @throws NotFoundException if adaptation not found or not owned by user
   * @throws BadRequestException if adaptation is not in 'suggested' status
   *
   * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle (Accept)
   * @see BACKEND SPECIFICATION Section 9 - POST /adaptations/:id/accept
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptAdaptation(
    @UserId() userId: string,
    @Param() params: AdaptationIdParamDto,
    @Body() _dto: AcceptAdaptationDto,
  ): Promise<AcceptAdaptationResponse> {
    this.logger.log('Accept adaptation request', {
      userId,
      adaptationId: params.id,
    });

    const result = await this.adaptationService.acceptAdaptation({
      userId,
      adaptationId: params.id,
    });

    if (!result.success) {
      this.logger.warn('Adaptation acceptance failed', {
        userId,
        adaptationId: params.id,
        error: result.error?.code,
      });

      throw this.mapServiceErrorToHttpError(result.error!.code, result.error!.message);
    }

    this.logger.log('Adaptation accepted successfully', {
      userId,
      adaptationId: params.id,
      tasksModified: result.appliedChanges?.tasksModified,
    });

    return {
      success: true,
      data: {
        adaptationId: result.adaptation!.id,
        status: result.adaptation!.status,
        appliedChanges: {
          tasksModified: result.appliedChanges?.tasksModified ?? 0,
          goalChanges: {
            difficultyChanged: result.appliedChanges?.goalChanges.difficultyChanged ?? false,
            bufferAdded: result.appliedChanges?.goalChanges.bufferAdded ?? false,
          },
        },
      },
    };
  }

  /**
   * Reject a suggested adaptation.
   *
   * Rejection blocks re-application of similar adaptations for 7 days.
   *
   * @route POST /adaptations/:id/reject
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing adaptation ID
   * @param _dto - Empty body (for future extensibility)
   * @returns Rejected adaptation with block expiry date
   *
   * @throws NotFoundException if adaptation not found or not owned by user
   * @throws BadRequestException if adaptation is not in 'suggested' status
   *
   * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle (Reject)
   * @see LLM INPUT CONTRACT Section 8 - Rejected → block re-apply for 7 days
   * @see BACKEND SPECIFICATION Section 9 - POST /adaptations/:id/reject
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectAdaptation(
    @UserId() userId: string,
    @Param() params: AdaptationIdParamDto,
    @Body() _dto: RejectAdaptationDto,
  ): Promise<RejectAdaptationResponse> {
    this.logger.log('Reject adaptation request', {
      userId,
      adaptationId: params.id,
    });

    const result = await this.adaptationService.rejectAdaptation({
      userId,
      adaptationId: params.id,
    });

    if (!result.success) {
      this.logger.warn('Adaptation rejection failed', {
        userId,
        adaptationId: params.id,
        error: result.error?.code,
      });

      throw this.mapServiceErrorToHttpError(result.error!.code, result.error!.message);
    }

    this.logger.log('Adaptation rejected successfully', {
      userId,
      adaptationId: params.id,
      blockedUntil: result.blockedUntil?.toISOString(),
    });

    return {
      success: true,
      data: {
        adaptationId: result.adaptation!.id,
        status: result.adaptation!.status,
        blockedUntil: result.blockedUntil?.toISOString() ?? null,
      },
    };
  }

  /**
   * Rollback an accepted adaptation.
   *
   * Rollback is only allowed within the rollback window (7 days from acceptance).
   * Restores the previous state snapshot.
   *
   * @route POST /adaptations/:id/rollback
   *
   * @param userId - Authenticated user ID (from auth context)
   * @param params - URL parameters containing adaptation ID
   * @param _dto - Empty body (for future extensibility)
   * @returns Rolled back adaptation with restored state info
   *
   * @throws NotFoundException if adaptation not found or not owned by user
   * @throws BadRequestException if adaptation is not in 'accepted' status
   * @throws ConflictException if rollback window has expired
   *
   * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle (Rollback)
   * @see LLM INPUT CONTRACT Section 8 - Rollback allowed within time window
   * @see BACKEND SPECIFICATION Section 9 - POST /adaptations/:id/rollback
   */
  @Post(':id/rollback')
  @HttpCode(HttpStatus.OK)
  async rollbackAdaptation(
    @UserId() userId: string,
    @Param() params: AdaptationIdParamDto,
    @Body() _dto: RollbackAdaptationDto,
  ): Promise<RollbackAdaptationResponse> {
    this.logger.log('Rollback adaptation request', {
      userId,
      adaptationId: params.id,
    });

    const result = await this.adaptationService.rollbackAdaptation({
      userId,
      adaptationId: params.id,
    });

    if (!result.success) {
      this.logger.warn('Adaptation rollback failed', {
        userId,
        adaptationId: params.id,
        error: result.error?.code,
      });

      throw this.mapServiceErrorToHttpError(result.error!.code, result.error!.message);
    }

    this.logger.log('Adaptation rolled back successfully', {
      userId,
      adaptationId: params.id,
      restoredTaskCount: result.restoredState?.tasks.length,
    });

    return {
      success: true,
      data: {
        adaptationId: result.adaptation!.id,
        status: result.adaptation!.status,
        restoredTaskCount: result.restoredState?.tasks.length ?? 0,
      },
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Map service error codes to appropriate HTTP exceptions.
   */
  private mapServiceErrorToHttpError(
    code: AdaptationErrorCode,
    message: string,
  ): NotFoundException | BadRequestException | ForbiddenException | ConflictException {
    switch (code) {
      case AdaptationErrorCode.NOT_FOUND:
      case AdaptationErrorCode.GOAL_NOT_FOUND:
        return new NotFoundException(message);

      case AdaptationErrorCode.INVALID_STATUS:
        return new BadRequestException(message);

      case AdaptationErrorCode.BLOCKED:
        return new ForbiddenException(message);

      case AdaptationErrorCode.ROLLBACK_WINDOW_EXPIRED:
        return new ConflictException(message);

      case AdaptationErrorCode.APPLY_FAILED:
      case AdaptationErrorCode.RESTORE_FAILED:
      case AdaptationErrorCode.INTERNAL_ERROR:
        return new BadRequestException(message);

      default:
        return new BadRequestException(message);
    }
  }
}
