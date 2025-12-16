/**
 * Notification Service
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 *
 * Handles in-app notification logic.
 *
 * Responsibilities:
 * - Create notifications for system events
 * - Fetch notifications for users
 * - Mark notifications as read
 *
 * Triggers (called by other services):
 * - Adaptation suggested
 * - Adaptation accepted
 * - Harm recovery triggered
 *
 * Rules:
 * - In-app only (no email, push, SMS)
 * - No scheduling
 * - No AI calls
 * - No external services
 * - Enforce user ownership
 */

import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../common/enums';
import { NotificationRepository } from './notification.repository';
import {
  Notification,
  CreateNotificationInput,
  GetNotificationsInput,
  MarkNotificationReadInput,
  MarkAllNotificationsReadInput,
  NotificationsResult,
  NotificationOperationResult,
  AdaptationSuggestedPayload,
  AdaptationAcceptedPayload,
  HarmRecoveryTriggeredPayload,
} from './types';

/**
 * Service for managing in-app notifications.
 *
 * This service:
 * - Does NOT call AI
 * - Does NOT send external notifications (email, push, SMS)
 * - Does NOT schedule notifications
 * - DOES enforce user ownership
 * - DOES prevent duplicate notifications
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly notificationRepository: NotificationRepository) {}

  // ============================================
  // Notification Triggers (called by other services)
  // ============================================

  /**
   * Notify user that an adaptation has been suggested.
   *
   * @see BACKEND SPECIFICATION Section 10 - Notification triggers
   *
   * @param userId - User to notify
   * @param payload - Adaptation details
   * @returns Created notification
   */
  async notifyAdaptationSuggested(
    userId: string,
    payload: AdaptationSuggestedPayload,
  ): Promise<Notification> {
    // Prevent duplicate notifications for same adaptation
    const exists = await this.notificationRepository.existsRecentForEntity(
      userId,
      NotificationType.ADAPTATION_SUGGESTED,
      payload.adaptationId,
      5, // 5 minute window
    );

    if (exists) {
      this.logger.debug('Skipping duplicate adaptation suggested notification', {
        userId,
        adaptationId: payload.adaptationId,
      });
      // Return the existing notification (fetch it)
      const existing = await this.notificationRepository.findByEntity(
        userId,
        payload.adaptationId,
        'adaptation',
      );
      if (existing.length > 0) {
        return existing[0];
      }
    }

    const input: CreateNotificationInput = {
      userId,
      type: NotificationType.ADAPTATION_SUGGESTED,
      title: 'Plan Adjustment Suggested',
      message: `We noticed you might be struggling with "${payload.goalTitle}". ${payload.reason}`,
      entityId: payload.adaptationId,
      entityType: 'adaptation',
      metadata: {
        goalId: payload.goalId,
        goalTitle: payload.goalTitle,
        adaptationType: payload.adaptationType,
        reason: payload.reason,
      },
    };

    const notification = await this.notificationRepository.create(input);

    this.logger.log('Adaptation suggested notification created', {
      userId,
      adaptationId: payload.adaptationId,
      notificationId: notification.id,
    });

    return notification;
  }

  /**
   * Notify user that an adaptation has been accepted.
   *
   * @param userId - User to notify
   * @param payload - Adaptation acceptance details
   * @returns Created notification
   */
  async notifyAdaptationAccepted(
    userId: string,
    payload: AdaptationAcceptedPayload,
  ): Promise<Notification> {
    const input: CreateNotificationInput = {
      userId,
      type: NotificationType.ADAPTATION_ACCEPTED,
      title: 'Plan Updated',
      message: `Your plan for "${payload.goalTitle}" has been adjusted. ${payload.changesApplied} changes applied.`,
      entityId: payload.adaptationId,
      entityType: 'adaptation',
      metadata: {
        goalId: payload.goalId,
        goalTitle: payload.goalTitle,
        adaptationType: payload.adaptationType,
        changesApplied: payload.changesApplied,
      },
    };

    const notification = await this.notificationRepository.create(input);

    this.logger.log('Adaptation accepted notification created', {
      userId,
      adaptationId: payload.adaptationId,
      notificationId: notification.id,
    });

    return notification;
  }

  /**
   * Notify user that harm recovery mode has been triggered.
   *
   * @see BACKEND SPECIFICATION Section 11 - Failure Handling
   *
   * @param userId - User to notify
   * @param payload - Harm recovery details
   * @returns Created notification
   */
  async notifyHarmRecoveryTriggered(
    userId: string,
    payload: HarmRecoveryTriggeredPayload,
  ): Promise<Notification> {
    const input: CreateNotificationInput = {
      userId,
      type: NotificationType.HARM_RECOVERY_TRIGGERED,
      title: "Let's Simplify",
      message: this.buildHarmRecoveryMessage(payload),
      entityId: payload.incidentId,
      entityType: 'harm_incident',
      metadata: {
        goalId: payload.goalId,
        goalTitle: payload.goalTitle,
        signalType: payload.signalType,
        severity: payload.severity,
        actionsApplied: payload.actionsApplied,
      },
    };

    const notification = await this.notificationRepository.create(input);

    this.logger.log('Harm recovery notification created', {
      userId,
      incidentId: payload.incidentId,
      notificationId: notification.id,
    });

    return notification;
  }

  /**
   * Notify user of goal status change.
   *
   * @param userId - User to notify
   * @param goalId - Goal ID
   * @param goalTitle - Goal title
   * @param newStatus - New status
   * @param reason - Optional reason
   * @returns Created notification
   */
  async notifyGoalStatusChanged(
    userId: string,
    goalId: string,
    goalTitle: string,
    newStatus: string,
    reason?: string,
  ): Promise<Notification> {
    const input: CreateNotificationInput = {
      userId,
      type: NotificationType.GOAL_STATUS_CHANGED,
      title: `Goal ${this.formatStatus(newStatus)}`,
      message: reason ?? `Your goal "${goalTitle}" is now ${newStatus}.`,
      entityId: goalId,
      entityType: 'goal',
      metadata: {
        goalTitle,
        newStatus,
        reason,
      },
    };

    const notification = await this.notificationRepository.create(input);

    this.logger.log('Goal status change notification created', {
      userId,
      goalId,
      newStatus,
      notificationId: notification.id,
    });

    return notification;
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get notifications for a user.
   *
   * @param input - Query input with filters
   * @returns Paginated notifications
   */
  async getNotifications(input: GetNotificationsInput): Promise<NotificationsResult> {
    return this.notificationRepository.findForUser(input);
  }

  /**
   * Get a single notification by ID.
   *
   * @param userId - User ID (ownership check)
   * @param notificationId - Notification ID
   * @returns Notification or null
   */
  async getNotification(userId: string, notificationId: string): Promise<Notification | null> {
    return this.notificationRepository.findById(userId, notificationId);
  }

  /**
   * Get unread notification count.
   *
   * @param userId - User ID
   * @returns Unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  // ============================================
  // Update Methods
  // ============================================

  /**
   * Mark a notification as read.
   *
   * Idempotent: If already read, returns success.
   *
   * @param input - Mark read input
   * @returns Operation result
   */
  async markAsRead(input: MarkNotificationReadInput): Promise<NotificationOperationResult> {
    const { userId, notificationId } = input;

    const notification = await this.notificationRepository.markAsRead(userId, notificationId);

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found or not owned by user',
      };
    }

    return {
      success: true,
      notification,
    };
  }

  /**
   * Mark all notifications as read for a user.
   *
   * @param input - Mark all read input
   * @returns Operation result with count
   */
  async markAllAsRead(
    input: MarkAllNotificationsReadInput,
  ): Promise<{ success: boolean; count: number }> {
    const { userId, type } = input;

    const count = await this.notificationRepository.markAllAsRead(userId, type);

    this.logger.log('Marked all notifications as read', {
      userId,
      type,
      count,
    });

    return {
      success: true,
      count,
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Build a user-friendly message for harm recovery.
   */
  private buildHarmRecoveryMessage(payload: HarmRecoveryTriggeredPayload): string {
    const actions = payload.actionsApplied;

    if (actions.includes('difficulty_reduced')) {
      return "We've noticed things might be getting overwhelming. We've simplified your tasks to help you get back on track. What's one small thing you can do today?";
    }

    if (actions.includes('auto_adaptation_disabled')) {
      return "We've paused automatic suggestions to give you more control. Take your time, and let us know when you're ready to continue.";
    }

    return "We're here to help. Let's take it one step at a time.";
  }

  /**
   * Format status for display.
   */
  private formatStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed! 🎉';
      case 'paused':
        return 'Paused';
      case 'abandoned':
        return 'Archived';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}
