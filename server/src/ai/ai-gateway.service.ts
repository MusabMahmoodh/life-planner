/**
 * AI Gateway Service
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 * @see LLM INPUT CONTRACT Section 7 - AI Usage Constraints
 * @see Product Guardrails - What AI Can Decide Alone
 *
 * This is the ONLY place where OpenAI API is called.
 *
 * STRICT RULES:
 * - NO database access
 * - NO repositories
 * - NO business logic
 * - NO state mutation
 * - NO plan application
 * - NO side effects
 *
 * AI CAN:
 * - Generate goal plans
 * - Propose adaptations
 * - Generate explanations
 *
 * AI CANNOT:
 * - Write to DB directly
 * - Apply changes automatically
 * - Decide irreversible actions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ZodError } from 'zod';

import { AdaptationType, DifficultyLevel, TaskFrequency } from '../common/enums';
import {
  type GenerateGoalPlanInput,
  type AIGeneratedGoalPlan,
  type AIGatewayResult,
  type AIGatewayError,
  AIGatewayErrorCode,
  type IAIGatewayService,
} from './types/ai-gateway.types';
import {
  GoalPlanSchema,
  AdaptationProposalSchema,
  validateAdaptationProposalWithConstraints,
  validateTaskOrderIndices,
  type ValidatedGoalPlan,
  type ValidatedAdaptationProposal,
} from './types/ai-output.schemas';
import { MAX_TASKS_PER_GOAL, MAX_EXPLANATION_LENGTH } from './types/ai-output.constants';
import type { BehavioralMetrics, BehavioralSignal } from '../behavior/types';

// ============================================
// Adaptation Proposal Context
// ============================================

/**
 * Context for AI adaptation proposal.
 * Contains all information needed to generate an adaptation.
 */
export interface ProposeAdaptationContext {
  /** Goal ID (for reference only, NOT for DB access) */
  goalId: string;

  /** Goal title */
  goalTitle: string;

  /** User's timezone */
  timezone: string;

  /** Behavioral signals that triggered adaptation */
  signals: BehavioralSignal[];

  /** Current behavioral metrics */
  metrics: BehavioralMetrics;

  /** Current task states (snapshot) */
  currentTasks: AdaptationTaskSnapshot[];

  /** User's difficulty preference */
  difficultyPreference?: DifficultyLevel;

  /** Communication style preference */
  communicationStyle?: 'friendly' | 'direct' | 'encouraging';
}

/**
 * Task snapshot for adaptation context.
 * Contains only what AI needs to know.
 */
export interface AdaptationTaskSnapshot {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  frequency: TaskFrequency;
  status: 'pending' | 'completed' | 'skipped' | 'overdue';
}

// ============================================
// AI Gateway Service
// ============================================

/**
 * AI Gateway Service implementation.
 *
 * RESPONSIBILITIES:
 * - Call OpenAI API
 * - Validate AI outputs using Zod schemas
 * - Return structured proposal objects only
 * - Handle timeouts and API errors gracefully
 *
 * NON-RESPONSIBILITIES:
 * - Database access
 * - State mutation
 * - Business logic
 * - Applying changes
 */
@Injectable()
export class AIGatewayService implements IAIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. AI features will return errors.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey ?? 'not-configured',
    });

    this.model = this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.timeoutMs = this.configService.get<number>('OPENAI_TIMEOUT_MS') ?? 30000;
  }

  // ============================================
  // Generate Goal Plan
  // ============================================

  /**
   * Generate a goal plan from user description.
   *
   * @param input - Goal generation input
   * @returns Result with generated plan or error
   *
   * @see BACKEND SPECIFICATION Section 7 - AI CAN: Generate plans
   */
  async generateGoalPlan(
    input: GenerateGoalPlanInput,
  ): Promise<AIGatewayResult<AIGeneratedGoalPlan>> {
    this.logger.log('Generating goal plan', {
      descriptionLength: input.goalDescription.length,
      timezone: input.timezone,
    });

    try {
      // Build the prompt
      const systemPrompt = this.buildGoalPlanSystemPrompt(input);
      const userPrompt = this.buildGoalPlanUserPrompt(input);

      // Call OpenAI API with timeout
      const response = await this.callOpenAI(systemPrompt, userPrompt);

      if (!response.success) {
        return response;
      }

      // Parse and validate the response
      const validationResult = this.validateGoalPlanResponse(response.data);

      if (!validationResult.success) {
        return validationResult;
      }

      this.logger.log('Goal plan generated successfully', {
        title: validationResult.data.title,
        taskCount: validationResult.data.tasks.length,
      });

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      return this.handleUnexpectedError('generateGoalPlan', error);
    }
  }

  // ============================================
  // Propose Adaptation
  // ============================================

  /**
   * Propose an adaptation based on behavioral signals.
   *
   * @param context - Adaptation context with signals and metrics
   * @returns Result with adaptation proposal or error
   *
   * @see BACKEND SPECIFICATION Section 7 - AI CAN: Suggest adaptations
   * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
   */
  async proposeAdaptation(
    context: ProposeAdaptationContext,
  ): Promise<AIGatewayResult<ValidatedAdaptationProposal>> {
    this.logger.log('Proposing adaptation', {
      goalId: context.goalId,
      signalCount: context.signals.length,
      taskCount: context.currentTasks.length,
    });

    try {
      // Build the prompt
      const systemPrompt = this.buildAdaptationSystemPrompt(context);
      const userPrompt = this.buildAdaptationUserPrompt(context);

      // Call OpenAI API with timeout
      const response = await this.callOpenAI(systemPrompt, userPrompt);

      if (!response.success) {
        return response;
      }

      // Parse and validate the response
      const validationResult = this.validateAdaptationResponse(response.data, context);

      if (!validationResult.success) {
        return validationResult;
      }

      this.logger.log('Adaptation proposed successfully', {
        type: validationResult.data.type,
        goalId: context.goalId,
      });

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      return this.handleUnexpectedError('proposeAdaptation', error);
    }
  }

  // ============================================
  // OpenAI API Call
  // ============================================

  /**
   * Call OpenAI API with timeout handling.
   */
  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AIGatewayResult<string>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const completion = await this.openai.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          },
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        const content = completion.choices[0]?.message?.content;

        if (!content) {
          return this.createError(
            AIGatewayErrorCode.INVALID_RESPONSE,
            'OpenAI returned empty response',
            false,
          );
        }

        return { success: true, data: content };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      return this.handleOpenAIError(error);
    }
  }

  /**
   * Handle OpenAI-specific errors.
   */
  private handleOpenAIError(error: unknown): AIGatewayResult<never> {
    if (error instanceof Error) {
      // Timeout (AbortError)
      if (error.name === 'AbortError') {
        this.logger.warn('OpenAI request timed out');
        return this.createError(
          AIGatewayErrorCode.TIMEOUT,
          `OpenAI request timed out after ${this.timeoutMs}ms`,
          true,
        );
      }

      // OpenAI API errors
      if ('status' in error) {
        const status = (error as { status: number }).status;

        if (status === 429) {
          this.logger.warn('OpenAI rate limit exceeded');
          return this.createError(
            AIGatewayErrorCode.RATE_LIMITED,
            'OpenAI rate limit exceeded. Please try again later.',
            true,
          );
        }

        if (status >= 500) {
          this.logger.error('OpenAI server error', error);
          return this.createError(
            AIGatewayErrorCode.API_ERROR,
            'OpenAI service is temporarily unavailable',
            true,
          );
        }
      }

      this.logger.error('OpenAI API error', error);
      return this.createError(
        AIGatewayErrorCode.API_ERROR,
        `OpenAI API error: ${error.message}`,
        false,
      );
    }

    return this.createError(AIGatewayErrorCode.API_ERROR, 'Unknown OpenAI error', false);
  }

  // ============================================
  // Goal Plan Validation
  // ============================================

  /**
   * Validate and parse goal plan response.
   */
  private validateGoalPlanResponse(rawResponse: string): AIGatewayResult<ValidatedGoalPlan> {
    try {
      // Parse JSON
      const parsed: unknown = JSON.parse(rawResponse);

      // Validate with Zod schema
      const validated = GoalPlanSchema.parse(parsed);

      // Additional constraint: unique order indices
      const orderValidation = validateTaskOrderIndices(validated.tasks);
      if (!orderValidation.valid) {
        return this.createError(
          AIGatewayErrorCode.CONSTRAINT_VIOLATION,
          orderValidation.error,
          false,
        );
      }

      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.warn('AI returned invalid JSON', { rawResponse });
        return this.createError(
          AIGatewayErrorCode.INVALID_RESPONSE,
          'AI response was not valid JSON',
          false,
        );
      }

      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        this.logger.warn('AI response failed validation', { issues });
        return this.createError(
          AIGatewayErrorCode.VALIDATION_FAILED,
          `AI response validation failed: ${issues}`,
          false,
          { zodErrors: error.issues },
        );
      }

      throw error;
    }
  }

  // ============================================
  // Adaptation Validation
  // ============================================

  /**
   * Validate and parse adaptation response.
   */
  private validateAdaptationResponse(
    rawResponse: string,
    context: ProposeAdaptationContext,
  ): AIGatewayResult<ValidatedAdaptationProposal> {
    try {
      // Parse JSON
      const parsed: unknown = JSON.parse(rawResponse);

      // Validate with Zod schema
      const validated = AdaptationProposalSchema.parse(parsed);

      // Additional constraint: ±1 difficulty change
      const constraintValidation = validateAdaptationProposalWithConstraints(validated);
      if (!constraintValidation.valid) {
        return this.createError(
          AIGatewayErrorCode.CONSTRAINT_VIOLATION,
          constraintValidation.error,
          false,
        );
      }

      // Validate task IDs exist in context (if difficulty change)
      if (validated.type === AdaptationType.DIFFICULTY_CHANGE) {
        const changes = validated.suggestedChanges;
        if (changes.type === AdaptationType.DIFFICULTY_CHANGE) {
          const taskIds = new Set(context.currentTasks.map((t) => t.id));
          const invalidIds = changes.changes.affectedTaskIds.filter((id) => !taskIds.has(id));
          if (invalidIds.length > 0) {
            return this.createError(
              AIGatewayErrorCode.CONSTRAINT_VIOLATION,
              `AI proposed changes for non-existent tasks: ${invalidIds.join(', ')}`,
              false,
            );
          }
        }
      }

      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.warn('AI returned invalid JSON for adaptation');
        return this.createError(
          AIGatewayErrorCode.INVALID_RESPONSE,
          'AI response was not valid JSON',
          false,
        );
      }

      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        this.logger.warn('AI adaptation response failed validation', { issues });
        return this.createError(
          AIGatewayErrorCode.VALIDATION_FAILED,
          `AI response validation failed: ${issues}`,
          false,
          { zodErrors: error.issues },
        );
      }

      throw error;
    }
  }

  // ============================================
  // Prompt Builders - Goal Plan
  // ============================================

  /**
   * Build system prompt for goal plan generation.
   */
  private buildGoalPlanSystemPrompt(input: GenerateGoalPlanInput): string {
    const style = input.communicationStyle ?? 'friendly';
    const difficultyPref = input.difficultyPreference ?? DifficultyLevel.MEDIUM;

    return `You are an AI assistant that helps users break down their goals into actionable tasks.

Your role is to generate a structured goal plan in JSON format.

CONSTRAINTS (STRICT):
- Generate between 1 and ${MAX_TASKS_PER_GOAL} tasks per goal
- Each task must have a difficulty level: "easy", "medium", "hard", or "extreme"
- Each task must have a frequency: "daily", "weekly", or "milestone"
- Estimated duration must be between 5 and 480 minutes
- Order index must be unique and start from 0
- Explanation must not exceed ${MAX_EXPLANATION_LENGTH} characters
- User prefers ${difficultyPref} difficulty - weight tasks accordingly

COMMUNICATION STYLE: ${style}
${style === 'friendly' ? '- Use warm, encouraging language' : ''}
${style === 'direct' ? '- Be concise and action-oriented' : ''}
${style === 'encouraging' ? '- Emphasize progress and celebrate small wins' : ''}

OUTPUT FORMAT (JSON):
{
  "title": "Clear, actionable goal title",
  "tasks": [
    {
      "title": "Task description",
      "difficulty": "easy|medium|hard|extreme",
      "frequency": "daily|weekly|milestone",
      "estimatedDuration": 30,
      "isOptional": false,
      "orderIndex": 0
    }
  ],
  "explanation": "Brief explanation of the plan"
}

IMPORTANT:
- Do NOT include any text outside the JSON object
- Do NOT add comments or explanations outside the JSON
- Ensure all required fields are present
- Use realistic time estimates`;
  }

  /**
   * Build user prompt for goal plan generation.
   */
  private buildGoalPlanUserPrompt(input: GenerateGoalPlanInput): string {
    let prompt = `Generate a goal plan for: "${input.goalDescription}"

User timezone: ${input.timezone}`;

    if (input.scheduleContext) {
      prompt += `\n\nSchedule context: ${input.scheduleContext}`;
    }

    return prompt;
  }

  // ============================================
  // Prompt Builders - Adaptation
  // ============================================

  /**
   * Build system prompt for adaptation proposal.
   */
  private buildAdaptationSystemPrompt(context: ProposeAdaptationContext): string {
    const style = context.communicationStyle ?? 'friendly';

    return `You are an AI assistant that suggests plan adaptations when users are struggling.

Your role is to propose ONE adaptation based on behavioral signals.

ADAPTATION TYPES:
1. "difficulty_change" - Adjust task difficulty up or down (±1 level only!)
2. "reschedule" - Move tasks to different times
3. "buffer_add" - Add recovery buffer days (1-14 days)

DIFFICULTY LEVELS (in order):
easy → medium → hard → extreme

CONSTRAINT: Difficulty changes can only be ±1 level. Example:
- "medium" can become "easy" or "hard"
- "medium" CANNOT become "extreme" (too big a jump)

BEHAVIORAL SIGNALS DETECTED:
${context.signals.map((s) => `- ${s.type}: ${s.message} (severity: ${s.severity})`).join('\n')}

CURRENT METRICS:
- Completion rate: ${context.metrics.completionRate}%
- Consecutive failures: ${context.metrics.consecutiveFailures}
- Inactive days: ${context.metrics.inactiveDays}
- Total tasks: ${context.metrics.totalTasks}

COMMUNICATION STYLE: ${style}

OUTPUT FORMAT (JSON):
{
  "type": "difficulty_change|reschedule|buffer_add",
  "reason": "Data-driven reason for this adaptation",
  "explanation": "User-friendly explanation of what will change and why",
  "suggestedChanges": {
    "type": "same as above",
    "changes": {
      // For difficulty_change:
      "fromDifficulty": "current level",
      "toDifficulty": "new level (±1 only!)",
      "affectedTaskIds": ["task-uuid-1", "task-uuid-2"]
      
      // For reschedule:
      "taskIds": ["task-uuid"],
      "rescheduleReason": "reason"
      
      // For buffer_add:
      "bufferDays": 3,
      "reduceFrequency": true
    }
  },
  "previousState": { /* snapshot of current state */ },
  "newState": { /* snapshot of proposed state */ }
}

RULES:
- Choose the MOST appropriate adaptation for the signals
- Be conservative - prefer smaller changes
- Provide clear reasoning
- Only reference task IDs from the provided list
- Do NOT invent task IDs`;
  }

  /**
   * Build user prompt for adaptation proposal.
   */
  private buildAdaptationUserPrompt(context: ProposeAdaptationContext): string {
    const taskList = context.currentTasks
      .map(
        (t) =>
          `- ID: ${t.id}, Title: "${t.title}", Difficulty: ${t.difficulty}, Status: ${t.status}`,
      )
      .join('\n');

    return `Goal: "${context.goalTitle}"

Current tasks:
${taskList}

${context.difficultyPreference ? `User's difficulty preference: ${context.difficultyPreference}` : ''}

Based on the behavioral signals and metrics, propose an appropriate adaptation.`;
  }

  // ============================================
  // Error Helpers
  // ============================================

  /**
   * Create a standardized error result.
   */
  private createError<T>(
    code: AIGatewayErrorCode,
    message: string,
    retryable: boolean,
    details?: Record<string, unknown>,
  ): AIGatewayResult<T> {
    const error: AIGatewayError = {
      code,
      message,
      retryable,
      details,
    };

    return { success: false, error };
  }

  /**
   * Handle unexpected errors.
   */
  private handleUnexpectedError(operation: string, error: unknown): AIGatewayResult<never> {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Unexpected error in ${operation}`, error);

    return this.createError(AIGatewayErrorCode.API_ERROR, `Unexpected error: ${message}`, false);
  }
}
