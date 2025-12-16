/**
 * AI Gateway Types
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see LLM INPUT CONTRACT Section 7 - AI Usage Constraints
 *
 * These types define the interface for AIGatewayService.
 * The actual implementation will use OpenAI SDK.
 *
 * AI CAN: Generate plans, suggest adaptations, generate explanations
 * AI CANNOT: Write to DB, apply changes, decide irreversible actions
 */

import { DifficultyLevel, TaskFrequency } from '../../common/enums';

// ============================================
// Goal Plan Generation
// ============================================

/**
 * Input for AI goal plan generation.
 */
export interface GenerateGoalPlanInput {
  /** User's goal description (free text) */
  goalDescription: string;

  /** User's timezone */
  timezone: string;

  /** Communication style preference */
  communicationStyle?: 'friendly' | 'direct' | 'encouraging';

  /** Difficulty preference */
  difficultyPreference?: DifficultyLevel;

  /** Optional schedule context */
  scheduleContext?: string;
}

/**
 * AI-generated task within a plan.
 */
export interface AIGeneratedTask {
  title: string;
  difficulty: DifficultyLevel;
  frequency: TaskFrequency;
  estimatedDuration: number;
  isOptional: boolean;
  orderIndex: number;
}

/**
 * AI-generated goal plan output.
 */
export interface AIGeneratedGoalPlan {
  title: string;
  tasks: AIGeneratedTask[];
  explanation: string;
}

// ============================================
// Error Types
// ============================================

/**
 * AI Gateway error codes.
 */
export enum AIGatewayErrorCode {
  /** OpenAI API error */
  API_ERROR = 'AI_API_ERROR',

  /** Request timeout */
  TIMEOUT = 'AI_TIMEOUT',

  /** Rate limit exceeded */
  RATE_LIMITED = 'AI_RATE_LIMITED',

  /** Invalid AI response */
  INVALID_RESPONSE = 'AI_INVALID_RESPONSE',

  /** Validation failed on AI output */
  VALIDATION_FAILED = 'AI_VALIDATION_FAILED',

  /** AI output violates constraints */
  CONSTRAINT_VIOLATION = 'AI_CONSTRAINT_VIOLATION',
}

/**
 * AI Gateway error.
 */
export interface AIGatewayError {
  code: AIGatewayErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/**
 * Result type for AI operations.
 */
export type AIGatewayResult<T> =
  | { success: true; data: T }
  | { success: false; error: AIGatewayError };

// ============================================
// Service Interface
// ============================================

/**
 * AI Gateway Service interface.
 * Implemented by AIGatewayService.
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 */
export interface IAIGatewayService {
  /**
   * Generate a goal plan from user description.
   *
   * @param input - Goal generation input
   * @returns Result with generated plan or error
   */
  generateGoalPlan(input: GenerateGoalPlanInput): Promise<AIGatewayResult<AIGeneratedGoalPlan>>;
}

/**
 * Injection token for AIGatewayService.
 */
export const AI_GATEWAY_SERVICE = 'AI_GATEWAY_SERVICE';
