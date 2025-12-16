/**
 * Adaptation Intent Types
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see LLM INPUT CONTRACT Section 8 - Adaptation Lifecycle
 *
 * AdaptationIntent represents a proposed adaptation BEFORE it is
 * stored in the database. It is the output of the rules engine
 * and input to the AI gateway for proposal generation.
 *
 * Key principle: Intents are suggestions, not actions.
 * They must be validated, stored as 'suggested', and approved by user.
 */

import { AdaptationType, AdaptationCreator, DifficultyLevel } from '../../common/enums';
import { BehavioralSignal, BehavioralMetrics } from '../../behavior/types';

// ============================================
// Adaptation Intent Types
// ============================================

/**
 * Target entity for the adaptation.
 */
export interface AdaptationTarget {
  /** Goal ID being adapted */
  goalId: string;

  /** Specific task IDs affected (optional, for task-level changes) */
  taskIds?: string[];
}

/**
 * Suggested changes for a difficulty change adaptation.
 */
export interface DifficultyChangeIntent {
  /** Current difficulty level */
  fromDifficulty: DifficultyLevel;

  /** Proposed new difficulty level (must be ±1 from current) */
  toDifficulty: DifficultyLevel;

  /** Which tasks to affect */
  affectedTaskIds: string[];
}

/**
 * Suggested changes for a reschedule adaptation.
 */
export interface RescheduleIntent {
  /** Tasks to reschedule */
  taskIds: string[];

  /** Reason for reschedule */
  rescheduleReason: string;
}

/**
 * Suggested changes for a buffer add adaptation.
 */
export interface BufferAddIntent {
  /** Number of buffer days to add */
  bufferDays: number;

  /** Whether to reduce task frequency */
  reduceFrequency: boolean;
}

/**
 * Union type for all suggested changes.
 */
export type AdaptationSuggestedChanges =
  | { type: 'difficulty_change'; changes: DifficultyChangeIntent }
  | { type: 'reschedule'; changes: RescheduleIntent }
  | { type: 'buffer_add'; changes: BufferAddIntent };

/**
 * AdaptationIntent represents a proposed adaptation.
 *
 * This is the output of the AdaptationRulesService.
 * It describes WHAT should be adapted and WHY, but does NOT apply changes.
 *
 * Flow:
 * 1. BehavioralEngine detects signal
 * 2. AdaptationRulesService generates AdaptationIntent
 * 3. AI Gateway generates detailed proposal from intent
 * 4. Backend validates and stores as Adaptation (suggested)
 * 5. User accepts/rejects
 */
export interface AdaptationIntent {
  /** Type of adaptation being suggested */
  type: AdaptationType;

  /** Target goal and optionally specific tasks */
  target: AdaptationTarget;

  /** Human-readable reason for the adaptation */
  reason: string;

  /** The behavioral signal that triggered this intent */
  triggeringSignal: BehavioralSignal;

  /** Behavioral metrics at the time of intent generation */
  metrics: BehavioralMetrics;

  /** Suggested changes based on adaptation type */
  suggestedChanges: AdaptationSuggestedChanges;

  /** Who/what created this intent */
  createdBy: AdaptationCreator;

  /** Priority level for processing (higher = more urgent) */
  priority: AdaptationPriority;

  /** Timestamp when intent was generated */
  generatedAt: Date;
}

/**
 * Priority levels for adaptation intents.
 */
export enum AdaptationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

/**
 * Result of adaptation rules evaluation.
 */
export interface AdaptationRulesResult {
  /** Generated intents (may be empty if no adaptation needed) */
  intents: AdaptationIntent[];

  /** Whether any adaptation is recommended */
  shouldAdapt: boolean;

  /** Summary of the evaluation */
  summary: string;

  /** Timestamp of evaluation */
  evaluatedAt: Date;
}

/**
 * Context needed for adaptation rules evaluation.
 */
export interface AdaptationRulesContext {
  /** Goal ID being evaluated */
  goalId: string;

  /** Current difficulty level of tasks (for difficulty_change intents) */
  currentDifficulty: DifficultyLevel;

  /** Task IDs that can be adapted */
  taskIds: string[];

  /** Timestamp for evaluation (for deterministic testing) */
  evaluationDate: Date;
}
