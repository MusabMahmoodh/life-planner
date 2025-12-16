/**
 * Goal DTOs for request validation.
 *
 * @see BACKEND SPECIFICATION Section 9 - API Endpoints (Goals)
 * @see LLM INPUT CONTRACT Section 11 - Validation & Error Handling
 *
 * DTOs define and validate incoming request data.
 * No business logic - validation only.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GoalStatus, DifficultyLevel } from '../../common/enums';

// ============================================
// Generate Goal DTO
// ============================================

/**
 * DTO for POST /goals/generate
 *
 * @see BACKEND SPECIFICATION Section 9 - POST /goals/generate
 */
export class GenerateGoalDto {
  /**
   * User's goal description (free text for AI).
   * Must be between 10 and 2000 characters.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Goal description must be at least 10 characters' })
  @MaxLength(2000, { message: 'Goal description must not exceed 2000 characters' })
  goalDescription!: string;

  /**
   * User's timezone for scheduling.
   * Example: "America/New_York", "Europe/London"
   */
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  /**
   * User's preferred communication style.
   * Optional - defaults to system preference.
   */
  @IsOptional()
  @IsEnum(['friendly', 'direct', 'encouraging'], {
    message: 'communicationStyle must be one of: friendly, direct, encouraging',
  })
  communicationStyle?: 'friendly' | 'direct' | 'encouraging';

  /**
   * User's preferred difficulty level.
   * Optional - AI will determine based on goal if not provided.
   */
  @IsOptional()
  @IsEnum(DifficultyLevel, {
    message: 'difficultyPreference must be one of: easy, medium, hard, extreme',
  })
  difficultyPreference?: DifficultyLevel;

  /**
   * Optional schedule context for the AI.
   * Example: "I work 9-5, prefer mornings"
   */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Schedule context must not exceed 500 characters' })
  scheduleContext?: string;
}

// ============================================
// List Goals Query DTO
// ============================================

/**
 * DTO for GET /goals query parameters.
 *
 * @see BACKEND SPECIFICATION Section 9 - GET /goals
 */
export class ListGoalsQueryDto {
  /**
   * Filter by goal status.
   */
  @IsOptional()
  @IsEnum(GoalStatus, {
    message: 'status must be one of: active, completed, paused, abandoned',
  })
  status?: GoalStatus;

  /**
   * Filter by archived state.
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): boolean | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  isArchived?: boolean;

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
// Goal ID Param DTO
// ============================================

/**
 * DTO for validating goal ID parameter.
 */
export class GoalIdParamDto {
  /**
   * Goal UUID.
   */
  @IsString()
  @IsNotEmpty()
  id!: string;
}
