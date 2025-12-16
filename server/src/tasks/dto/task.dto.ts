/**
 * Task DTOs for request validation.
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Tasks)
 * @see LLM INPUT CONTRACT Section 11 - Validation & Error Handling
 *
 * DTOs define and validate incoming request data.
 * No business logic - validation only.
 */

import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Task ID Param DTO
// ============================================

/**
 * DTO for validating task ID parameter.
 */
export class TaskIdParamDto {
  /**
   * Task UUID.
   */
  @IsString()
  @IsNotEmpty()
  id!: string;
}

// ============================================
// Complete Task DTO
// ============================================

/**
 * DTO for PATCH /tasks/:id/complete body.
 *
 * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/complete
 */
export class CompleteTaskDto {
  /**
   * Optional actual duration in minutes.
   * Must be between 1 and 1440 (24 hours).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'actualDuration must be an integer' })
  @Min(1, { message: 'actualDuration must be at least 1 minute' })
  @Max(1440, { message: 'actualDuration must not exceed 1440 minutes (24 hours)' })
  actualDuration?: number;
}

// ============================================
// Skip Task DTO
// ============================================

/**
 * DTO for PATCH /tasks/:id/skip body.
 * Currently empty - no body required for skip.
 *
 * @see BACKEND SPECIFICATION Section 9 - PATCH /tasks/:id/skip
 */
export class SkipTaskDto {
  // No body required for skip operation
  // This empty DTO is kept for consistency and future extensibility
}
