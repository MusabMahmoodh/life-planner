/**
 * Adaptation DTOs for request validation.
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Adaptations)
 * @see LLM INPUT CONTRACT Section 9 - API Contract
 *
 * DTOs define and validate incoming request data.
 * No business logic - validation only.
 */

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Goal ID Param DTO (for listing adaptations)
// ============================================

/**
 * DTO for validating goal ID parameter.
 * Used by GET /adaptations/:goalId
 */
export class GoalIdParamDto {
  /**
   * Goal UUID to list adaptations for.
   */
  @IsString()
  @IsNotEmpty()
  goalId!: string;
}

// ============================================
// Adaptation ID Param DTO
// ============================================

/**
 * DTO for validating adaptation ID parameter.
 * Used by accept/reject/rollback endpoints.
 */
export class AdaptationIdParamDto {
  /**
   * Adaptation UUID.
   */
  @IsString()
  @IsNotEmpty()
  id!: string;
}

// ============================================
// List Adaptations Query DTO
// ============================================

/**
 * DTO for GET /adaptations/:goalId query parameters.
 */
export class ListAdaptationsQueryDto {
  /**
   * Filter by adaptation status.
   */
  @IsOptional()
  @IsEnum(['suggested', 'accepted', 'rejected', 'rolled_back'], {
    message: 'status must be one of: suggested, accepted, rejected, rolled_back',
  })
  status?: 'suggested' | 'accepted' | 'rejected' | 'rolled_back';

  /**
   * Pagination limit (max 100).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number;

  /**
   * Pagination offset.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'offset must be at least 0' })
  offset?: number;
}

// ============================================
// Accept/Reject/Rollback DTOs
// ============================================

/**
 * DTO for POST /adaptations/:id/accept body.
 * Currently empty - no body required.
 */
export class AcceptAdaptationDto {
  // No body required for accept operation
}

/**
 * DTO for POST /adaptations/:id/reject body.
 * Currently empty - no body required.
 */
export class RejectAdaptationDto {
  // No body required for reject operation
}

/**
 * DTO for POST /adaptations/:id/rollback body.
 * Currently empty - no body required.
 */
export class RollbackAdaptationDto {
  // No body required for rollback operation
}
