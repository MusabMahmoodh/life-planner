/**
 * Task completion status.
 * Tracks the lifecycle state of a task.
 *
 * @see BACKEND SPECIFICATION Section 5 - Task Model
 */
export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  OVERDUE = 'overdue',
}
