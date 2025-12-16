/**
 * Notification Types
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 *
 * Types for the Notifications module.
 * In-app notifications only - no email, push, or SMS.
 */

import { NotificationType } from '../../common/enums';

// ============================================
// Notification Entity
// ============================================

/**
 * Notification entity representing an in-app notification.
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 */
export interface Notification {
  /** Unique notification ID */
  id: string;

  /** User who receives this notification */
  userId: string;

  /** Type of notification */
  type: NotificationType;

  /** Notification title (short) */
  title: string;

  /** Notification message (details) */
  message: string;

  /** Whether the notification has been read */
  isRead: boolean;

  /** Optional reference to related entity (goal, adaptation, etc.) */
  entityId?: string;

  /** Type of related entity */
  entityType?: 'goal' | 'task' | 'adaptation' | 'harm_incident';

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** When the notification was created */
  createdAt: Date;

  /** When the notification was read (null if unread) */
  readAt: Date | null;
}

// ============================================
// Input Types
// ============================================

/**
 * Input for creating a notification.
 */
export interface CreateNotificationInput {
  /** User to notify */
  userId: string;

  /** Notification type */
  type: NotificationType;

  /** Short title */
  title: string;

  /** Detailed message */
  message: string;

  /** Optional related entity ID */
  entityId?: string;

  /** Optional related entity type */
  entityType?: 'goal' | 'task' | 'adaptation' | 'harm_incident';

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Input for fetching notifications.
 */
export interface GetNotificationsInput {
  /** User ID */
  userId: string;

  /** Filter by read status */
  isRead?: boolean;

  /** Filter by type */
  type?: NotificationType;

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;
}

/**
 * Input for marking a notification as read.
 */
export interface MarkNotificationReadInput {
  /** User ID (for ownership verification) */
  userId: string;

  /** Notification ID */
  notificationId: string;
}

/**
 * Input for marking all notifications as read.
 */
export interface MarkAllNotificationsReadInput {
  /** User ID */
  userId: string;

  /** Optional: only mark specific type as read */
  type?: NotificationType;
}

// ============================================
// Result Types
// ============================================

/**
 * Result of fetching notifications.
 */
export interface NotificationsResult {
  /** Notifications */
  notifications: Notification[];

  /** Total count (for pagination) */
  total: number;

  /** Number of unread notifications */
  unreadCount: number;
}

/**
 * Result of notification operation.
 */
export interface NotificationOperationResult {
  /** Whether operation succeeded */
  success: boolean;

  /** Notification (if applicable) */
  notification?: Notification;

  /** Error message (if failed) */
  error?: string;
}

// ============================================
// Trigger Payloads
// ============================================

/**
 * Payload for adaptation suggested notification.
 */
export interface AdaptationSuggestedPayload {
  goalId: string;
  goalTitle: string;
  adaptationId: string;
  adaptationType: string;
  reason: string;
}

/**
 * Payload for adaptation accepted notification.
 */
export interface AdaptationAcceptedPayload {
  goalId: string;
  goalTitle: string;
  adaptationId: string;
  adaptationType: string;
  changesApplied: number;
}

/**
 * Payload for harm recovery triggered notification.
 */
export interface HarmRecoveryTriggeredPayload {
  incidentId: string;
  goalId?: string;
  goalTitle?: string;
  signalType: string;
  severity: string;
  actionsApplied: string[];
}
