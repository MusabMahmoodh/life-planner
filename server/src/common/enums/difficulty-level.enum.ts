/**
 * Task difficulty level.
 * Used for behavioral analysis and adaptation decisions.
 *
 * Difficulty changes are constrained to ±1 level per adaptation.
 *
 * @see BACKEND SPECIFICATION Section 5 - Task Model
 * @see BACKEND SPECIFICATION Section 7 - AI Validation Rules
 */
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
}

/**
 * Ordered difficulty levels for validation.
 * Used to enforce ±1 difficulty change constraint.
 */
export const DIFFICULTY_ORDER: readonly DifficultyLevel[] = [
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
  DifficultyLevel.EXTREME,
] as const;
