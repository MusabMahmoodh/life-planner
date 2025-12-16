/**
 * Goal lifecycle status.
 * Tracks the overall state of a user's goal.
 *
 * @see BACKEND SPECIFICATION Section 5 - Goal Model
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ABANDONED = 'abandoned',
}
