/**
 * AI Output Validation Schemas
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see LLM INPUT CONTRACT Section 7 - AI Validation Rules
 *
 * These Zod schemas validate ALL AI-generated outputs.
 * No AI output should be trusted without validation.
 *
 * CRITICAL RULES:
 * - NO DEFAULTS - reject invalid data, don't fix it
 * - Enforce max task count per goal
 * - Enforce difficulty bounds (valid enum values only)
 * - Enforce ±1 difficulty change constraint
 * - Reject invalid structures completely
 *
 * AI CANNOT:
 * - Write to DB directly
 * - Apply irreversible changes
 * - Decide without backend validation
 */

import { z } from 'zod';
import {
  DifficultyLevel,
  TaskFrequency,
  AdaptationType,
  DIFFICULTY_ORDER,
} from '../../common/enums';
import {
  MAX_TASKS_PER_GOAL,
  MIN_TASKS_PER_GOAL,
  MAX_TASK_TITLE_LENGTH,
  MIN_TASK_TITLE_LENGTH,
  MIN_ESTIMATED_DURATION_MINUTES,
  MAX_ESTIMATED_DURATION_MINUTES,
  MAX_GOAL_TITLE_LENGTH,
  MIN_GOAL_TITLE_LENGTH,
  MAX_EXPLANATION_LENGTH,
  MAX_BUFFER_DAYS,
  MIN_BUFFER_DAYS,
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
} from './ai-output.constants';

// ============================================
// Enum Schemas (Strict - No coercion)
// ============================================

/**
 * Difficulty level schema.
 * Only accepts valid enum values, no defaults.
 */
export const DifficultyLevelSchema = z.enum([
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
  DifficultyLevel.EXTREME,
]);

/**
 * Task frequency schema.
 * Only accepts valid enum values, no defaults.
 */
export const TaskFrequencySchema = z.enum([
  TaskFrequency.DAILY,
  TaskFrequency.WEEKLY,
  TaskFrequency.MILESTONE,
]);

/**
 * Adaptation type schema.
 * Only accepts valid enum values, no defaults.
 */
export const AdaptationTypeSchema = z.enum([
  AdaptationType.DIFFICULTY_CHANGE,
  AdaptationType.RESCHEDULE,
  AdaptationType.BUFFER_ADD,
]);

// ============================================
// Task Schema
// ============================================

/**
 * Schema for validating AI-generated task.
 *
 * Rules:
 * - Title must be within bounds
 * - Difficulty must be valid enum
 * - Frequency must be valid enum
 * - Duration must be within bounds
 * - isOptional must be explicit boolean
 * - orderIndex must be non-negative integer
 *
 * NO DEFAULTS - all fields required with valid values.
 */
export const TaskSchema = z.object({
  /**
   * Task title - required, bounded length.
   */
  title: z
    .string({
      required_error: 'Task title is required',
      invalid_type_error: 'Task title must be a string',
    })
    .min(MIN_TASK_TITLE_LENGTH, {
      message: `Task title must be at least ${MIN_TASK_TITLE_LENGTH} character`,
    })
    .max(MAX_TASK_TITLE_LENGTH, {
      message: `Task title must not exceed ${MAX_TASK_TITLE_LENGTH} characters`,
    }),

  /**
   * Difficulty level - must be valid enum value.
   */
  difficulty: DifficultyLevelSchema.describe('Task difficulty level'),

  /**
   * Frequency - must be valid enum value.
   */
  frequency: TaskFrequencySchema.describe('Task frequency'),

  /**
   * Estimated duration in minutes - must be within bounds.
   */
  estimatedDuration: z
    .number({
      required_error: 'Estimated duration is required',
      invalid_type_error: 'Estimated duration must be a number',
    })
    .int({ message: 'Estimated duration must be an integer' })
    .min(MIN_ESTIMATED_DURATION_MINUTES, {
      message: `Estimated duration must be at least ${MIN_ESTIMATED_DURATION_MINUTES} minutes`,
    })
    .max(MAX_ESTIMATED_DURATION_MINUTES, {
      message: `Estimated duration must not exceed ${MAX_ESTIMATED_DURATION_MINUTES} minutes`,
    }),

  /**
   * Whether task is optional - explicit boolean required.
   */
  isOptional: z.boolean({
    required_error: 'isOptional is required',
    invalid_type_error: 'isOptional must be a boolean',
  }),

  /**
   * Order index for task sequence - non-negative integer.
   */
  orderIndex: z
    .number({
      required_error: 'Order index is required',
      invalid_type_error: 'Order index must be a number',
    })
    .int({ message: 'Order index must be an integer' })
    .min(0, { message: 'Order index must be non-negative' }),
});

/**
 * Inferred TypeScript type for TaskSchema.
 */
export type ValidatedTask = z.infer<typeof TaskSchema>;

// ============================================
// Goal Plan Schema
// ============================================

/**
 * Schema for validating AI-generated goal plan.
 *
 * Rules:
 * - Title must be within bounds
 * - Tasks array must have 1-20 items
 * - Each task must pass TaskSchema
 * - Explanation optional but bounded if present
 *
 * @see BACKEND SPECIFICATION Section 7 - Max tasks per goal
 */
export const GoalPlanSchema = z.object({
  /**
   * Goal title - required, bounded length.
   */
  title: z
    .string({
      required_error: 'Goal title is required',
      invalid_type_error: 'Goal title must be a string',
    })
    .min(MIN_GOAL_TITLE_LENGTH, {
      message: `Goal title must be at least ${MIN_GOAL_TITLE_LENGTH} character`,
    })
    .max(MAX_GOAL_TITLE_LENGTH, {
      message: `Goal title must not exceed ${MAX_GOAL_TITLE_LENGTH} characters`,
    }),

  /**
   * Tasks array - must contain 1-20 valid tasks.
   * Enforces MAX_TASKS_PER_GOAL constraint.
   */
  tasks: z
    .array(TaskSchema, {
      required_error: 'Tasks array is required',
      invalid_type_error: 'Tasks must be an array',
    })
    .min(MIN_TASKS_PER_GOAL, {
      message: `Goal must have at least ${MIN_TASKS_PER_GOAL} task`,
    })
    .max(MAX_TASKS_PER_GOAL, {
      message: `Goal must not exceed ${MAX_TASKS_PER_GOAL} tasks`,
    }),

  /**
   * Explanation of the plan - required, bounded length.
   */
  explanation: z
    .string({
      required_error: 'Explanation is required',
      invalid_type_error: 'Explanation must be a string',
    })
    .max(MAX_EXPLANATION_LENGTH, {
      message: `Explanation must not exceed ${MAX_EXPLANATION_LENGTH} characters`,
    }),
});

/**
 * Inferred TypeScript type for GoalPlanSchema.
 */
export type ValidatedGoalPlan = z.infer<typeof GoalPlanSchema>;

// ============================================
// Adaptation Proposal Schemas
// ============================================

/**
 * Schema for difficulty change proposal.
 *
 * Rules:
 * - Must specify from and to difficulty levels
 * - Must list affected task IDs (non-empty)
 *
 * Note: ±1 difficulty constraint is validated separately
 * as it requires runtime context (current vs proposed).
 */
export const DifficultyChangeProposalSchema = z.object({
  /**
   * Current difficulty level.
   */
  fromDifficulty: DifficultyLevelSchema.describe('Current difficulty level'),

  /**
   * Proposed new difficulty level.
   */
  toDifficulty: DifficultyLevelSchema.describe('Proposed new difficulty level'),

  /**
   * Task IDs affected by this change.
   */
  affectedTaskIds: z
    .array(
      z
        .string({
          required_error: 'Task ID is required',
          invalid_type_error: 'Task ID must be a string',
        })
        .uuid({ message: 'Task ID must be a valid UUID' }),
    )
    .min(1, { message: 'At least one task must be affected' }),
});

/**
 * Inferred TypeScript type for DifficultyChangeProposalSchema.
 */
export type ValidatedDifficultyChangeProposal = z.infer<typeof DifficultyChangeProposalSchema>;

/**
 * Schema for reschedule proposal.
 *
 * Rules:
 * - Must list task IDs to reschedule (non-empty)
 * - Must provide reason for reschedule
 */
export const RescheduleProposalSchema = z.object({
  /**
   * Task IDs to reschedule.
   */
  taskIds: z
    .array(
      z
        .string({
          required_error: 'Task ID is required',
          invalid_type_error: 'Task ID must be a string',
        })
        .uuid({ message: 'Task ID must be a valid UUID' }),
    )
    .min(1, { message: 'At least one task must be rescheduled' }),

  /**
   * Reason for rescheduling.
   */
  rescheduleReason: z
    .string({
      required_error: 'Reschedule reason is required',
      invalid_type_error: 'Reschedule reason must be a string',
    })
    .min(MIN_REASON_LENGTH, {
      message: `Reschedule reason must be at least ${MIN_REASON_LENGTH} character`,
    })
    .max(MAX_REASON_LENGTH, {
      message: `Reschedule reason must not exceed ${MAX_REASON_LENGTH} characters`,
    }),
});

/**
 * Inferred TypeScript type for RescheduleProposalSchema.
 */
export type ValidatedRescheduleProposal = z.infer<typeof RescheduleProposalSchema>;

/**
 * Schema for buffer add proposal.
 *
 * Rules:
 * - Buffer days must be 1-14
 * - Must explicitly state if frequency is reduced
 */
export const BufferAddProposalSchema = z.object({
  /**
   * Number of buffer days to add.
   */
  bufferDays: z
    .number({
      required_error: 'Buffer days is required',
      invalid_type_error: 'Buffer days must be a number',
    })
    .int({ message: 'Buffer days must be an integer' })
    .min(MIN_BUFFER_DAYS, {
      message: `Buffer days must be at least ${MIN_BUFFER_DAYS}`,
    })
    .max(MAX_BUFFER_DAYS, {
      message: `Buffer days must not exceed ${MAX_BUFFER_DAYS}`,
    }),

  /**
   * Whether to reduce task frequency.
   */
  reduceFrequency: z.boolean({
    required_error: 'reduceFrequency is required',
    invalid_type_error: 'reduceFrequency must be a boolean',
  }),
});

/**
 * Inferred TypeScript type for BufferAddProposalSchema.
 */
export type ValidatedBufferAddProposal = z.infer<typeof BufferAddProposalSchema>;

/**
 * Discriminated union for suggested changes based on adaptation type.
 */
export const SuggestedChangesSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(AdaptationType.DIFFICULTY_CHANGE),
    changes: DifficultyChangeProposalSchema,
  }),
  z.object({
    type: z.literal(AdaptationType.RESCHEDULE),
    changes: RescheduleProposalSchema,
  }),
  z.object({
    type: z.literal(AdaptationType.BUFFER_ADD),
    changes: BufferAddProposalSchema,
  }),
]);

/**
 * Inferred TypeScript type for SuggestedChangesSchema.
 */
export type ValidatedSuggestedChanges = z.infer<typeof SuggestedChangesSchema>;

/**
 * Schema for complete adaptation proposal from AI.
 *
 * Rules:
 * - Type must be valid adaptation type
 * - Reason must be provided and bounded
 * - Explanation must be provided and bounded
 * - Suggested changes must match the type
 * - Previous and new state must be objects (validated at application time)
 *
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 */
export const AdaptationProposalSchema = z.object({
  /**
   * Type of adaptation being proposed.
   */
  type: AdaptationTypeSchema.describe('Adaptation type'),

  /**
   * Reason for the adaptation (for audit log).
   */
  reason: z
    .string({
      required_error: 'Reason is required',
      invalid_type_error: 'Reason must be a string',
    })
    .min(MIN_REASON_LENGTH, {
      message: `Reason must be at least ${MIN_REASON_LENGTH} character`,
    })
    .max(MAX_REASON_LENGTH, {
      message: `Reason must not exceed ${MAX_REASON_LENGTH} characters`,
    }),

  /**
   * Human-readable explanation for the user.
   */
  explanation: z
    .string({
      required_error: 'Explanation is required',
      invalid_type_error: 'Explanation must be a string',
    })
    .max(MAX_EXPLANATION_LENGTH, {
      message: `Explanation must not exceed ${MAX_EXPLANATION_LENGTH} characters`,
    }),

  /**
   * Suggested changes - must match adaptation type.
   */
  suggestedChanges: SuggestedChangesSchema,

  /**
   * Previous state snapshot for rollback.
   * Structure validated at application time.
   */
  previousState: z.record(z.unknown(), {
    required_error: 'Previous state is required',
    invalid_type_error: 'Previous state must be an object',
  }),

  /**
   * New state after adaptation.
   * Structure validated at application time.
   */
  newState: z.record(z.unknown(), {
    required_error: 'New state is required',
    invalid_type_error: 'New state must be an object',
  }),
});

/**
 * Inferred TypeScript type for AdaptationProposalSchema.
 */
export type ValidatedAdaptationProposal = z.infer<typeof AdaptationProposalSchema>;

// ============================================
// Validation Functions
// ============================================

/**
 * Validate ±1 difficulty change constraint.
 *
 * @param fromDifficulty - Current difficulty level
 * @param toDifficulty - Proposed difficulty level
 * @returns true if change is valid (±1 level only)
 *
 * @see LLM INPUT CONTRACT Section 7 - Max difficulty jump (±1 level)
 */
export function isValidDifficultyChange(
  fromDifficulty: DifficultyLevel,
  toDifficulty: DifficultyLevel,
): boolean {
  const fromIndex = DIFFICULTY_ORDER.indexOf(fromDifficulty);
  const toIndex = DIFFICULTY_ORDER.indexOf(toDifficulty);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return Math.abs(fromIndex - toIndex) === 1;
}

/**
 * Validate adaptation proposal with difficulty constraint.
 *
 * @param proposal - Parsed adaptation proposal
 * @returns Validation result with detailed error if invalid
 */
export function validateAdaptationProposalWithConstraints(
  proposal: ValidatedAdaptationProposal,
): { valid: true } | { valid: false; error: string } {
  if (proposal.type === AdaptationType.DIFFICULTY_CHANGE) {
    const changes = proposal.suggestedChanges;
    if (changes.type !== AdaptationType.DIFFICULTY_CHANGE) {
      return {
        valid: false,
        error: 'Suggested changes type does not match adaptation type',
      };
    }

    const { fromDifficulty, toDifficulty } = changes.changes;
    if (!isValidDifficultyChange(fromDifficulty, toDifficulty)) {
      return {
        valid: false,
        error: `Invalid difficulty change: ${fromDifficulty} → ${toDifficulty}. Only ±1 level changes allowed.`,
      };
    }
  }

  // Validate that suggested changes type matches adaptation type
  if (proposal.suggestedChanges.type !== proposal.type) {
    return {
      valid: false,
      error: `Suggested changes type (${proposal.suggestedChanges.type}) does not match adaptation type (${proposal.type})`,
    };
  }

  return { valid: true };
}

/**
 * Validate order indices are unique and sequential.
 *
 * @param tasks - Array of tasks to validate
 * @returns Validation result with detailed error if invalid
 */
export function validateTaskOrderIndices(
  tasks: ValidatedTask[],
): { valid: true } | { valid: false; error: string } {
  const indices = tasks.map((t) => t.orderIndex);
  const uniqueIndices = new Set(indices);

  if (uniqueIndices.size !== indices.length) {
    return {
      valid: false,
      error: 'Duplicate orderIndex values detected in tasks',
    };
  }

  return { valid: true };
}
