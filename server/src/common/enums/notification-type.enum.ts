/**
 * Notification Type Enum
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 *
 * Defines the types of in-app notifications.
 * Notifications are created by backend only, never by AI directly.
 */

/**
 * Types of notifications that can be sent to users.
 *
 * Trigger mapping:
 * - ADAPTATION_SUGGESTED: When AI proposes an adaptation
 * - ADAPTATION_ACCEPTED: When user accepts an adaptation
 * - ADAPTATION_REJECTED: When user rejects an adaptation
 * - ADAPTATION_ROLLED_BACK: When user rolls back an adaptation
 * - HARM_RECOVERY_TRIGGERED: When harm detection triggers recovery mode
 * - GOAL_STATUS_CHANGED: When goal status changes
 */
export enum NotificationType {
  /** AI has proposed an adaptation for review */
  ADAPTATION_SUGGESTED = 'adaptation_suggested',

  /** User has accepted an adaptation */
  ADAPTATION_ACCEPTED = 'adaptation_accepted',

  /** User has rejected an adaptation */
  ADAPTATION_REJECTED = 'adaptation_rejected',

  /** User has rolled back an adaptation */
  ADAPTATION_ROLLED_BACK = 'adaptation_rolled_back',

  /** Harm detection has triggered recovery mode */
  HARM_RECOVERY_TRIGGERED = 'harm_recovery_triggered',

  /** Goal status has changed */
  GOAL_STATUS_CHANGED = 'goal_status_changed',
}
