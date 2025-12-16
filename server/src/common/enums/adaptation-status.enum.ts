/**
 * Adaptation lifecycle status.
 * Tracks the state of an AI-proposed change.
 *
 * All adaptations start as 'suggested' and require user action.
 * No automatic application is allowed.
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 */
export enum AdaptationStatus {
  SUGGESTED = 'suggested',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Type of adaptation that can be proposed.
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 */
export enum AdaptationType {
  DIFFICULTY_CHANGE = 'difficulty_change',
  RESCHEDULE = 'reschedule',
  BUFFER_ADD = 'buffer_add',
}

/**
 * Creator of an adaptation.
 * Distinguishes system-generated adaptations from user-initiated ones.
 */
export enum AdaptationCreator {
  SYSTEM = 'system',
  USER = 'user',
}
