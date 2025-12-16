/**
 * Notification Repository
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 *
 * Handles persistence of in-app notifications.
 * Uses in-memory store as placeholder for Prisma integration.
 *
 * Rules:
 * - All queries scoped by userId (user isolation)
 * - No cross-user access
 * - Append-only for notifications (no deletion)
 */

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationType } from '../common/enums';
import {
  Notification,
  CreateNotificationInput,
  GetNotificationsInput,
  NotificationsResult,
} from './types';

/**
 * Repository for notification persistence.
 *
 * In production, this will use Prisma.
 * Currently uses in-memory Map as placeholder.
 */
@Injectable()
export class NotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  /**
   * In-memory notification store.
   * Key: notification ID
   * Value: Notification
   *
   * TODO: Replace with Prisma when database is connected.
   */
  private readonly notifications = new Map<string, Notification>();

  // ============================================
  // Create Operations
  // ============================================

  /**
   * Create a new notification.
   *
   * @param input - Notification creation input
   * @returns Created notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification: Notification = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      isRead: false,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: input.metadata,
      createdAt: new Date(),
      readAt: null,
    };

    this.notifications.set(notification.id, notification);

    this.logger.debug('Notification created', {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
    });

    return await Promise.resolve(notification);
  }

  // ============================================
  // Read Operations
  // ============================================

  /**
   * Find a notification by ID, scoped to user.
   *
   * @param userId - User ID (for ownership verification)
   * @param notificationId - Notification ID
   * @returns Notification or null if not found/not owned
   */
  async findById(userId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.get(notificationId);

    if (!notification || notification.userId !== userId) {
      return await Promise.resolve(null);
    }

    return await Promise.resolve(notification);
  }

  /**
   * Get notifications for a user with filtering and pagination.
   *
   * @param input - Query input with filters
   * @returns Paginated notifications result
   */
  async findForUser(input: GetNotificationsInput): Promise<NotificationsResult> {
    const { userId, isRead, type, limit = 50, offset = 0 } = input;

    // Get all notifications for user
    let userNotifications = Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId,
    );

    // Apply filters
    if (isRead !== undefined) {
      userNotifications = userNotifications.filter((n) => n.isRead === isRead);
    }

    if (type !== undefined) {
      userNotifications = userNotifications.filter((n) => n.type === type);
    }

    // Sort by createdAt descending (newest first)
    userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Count unread (before pagination)
    const unreadCount = Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && !n.isRead,
    ).length;

    // Get total before pagination
    const total = userNotifications.length;

    // Apply pagination
    const paginated = userNotifications.slice(offset, offset + limit);

    return await Promise.resolve({
      notifications: paginated,
      total,
      unreadCount,
    });
  }

  /**
   * Get unread count for a user.
   *
   * @param userId - User ID
   * @returns Number of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && !n.isRead,
    ).length;

    return await Promise.resolve(count);
  }

  /**
   * Get notifications by entity reference.
   *
   * @param userId - User ID
   * @param entityId - Entity ID
   * @param entityType - Entity type
   * @returns Notifications for the entity
   */
  async findByEntity(
    userId: string,
    entityId: string,
    entityType: 'goal' | 'task' | 'adaptation' | 'harm_incident',
  ): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values())
      .filter((n) => n.userId === userId && n.entityId === entityId && n.entityType === entityType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return await Promise.resolve(notifications);
  }

  // ============================================
  // Update Operations
  // ============================================

  /**
   * Mark a notification as read.
   *
   * @param userId - User ID (for ownership verification)
   * @param notificationId - Notification ID
   * @returns Updated notification or null if not found/not owned
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.get(notificationId);

    if (!notification || notification.userId !== userId) {
      return await Promise.resolve(null);
    }

    // Already read - idempotent
    if (notification.isRead) {
      return await Promise.resolve(notification);
    }

    const updated: Notification = {
      ...notification,
      isRead: true,
      readAt: new Date(),
    };

    this.notifications.set(notificationId, updated);

    this.logger.debug('Notification marked as read', {
      id: notificationId,
      userId,
    });

    return await Promise.resolve(updated);
  }

  /**
   * Mark all notifications as read for a user.
   *
   * @param userId - User ID
   * @param type - Optional: only mark specific type as read
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string, type?: NotificationType): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId !== userId) continue;
      if (notification.isRead) continue;
      if (type !== undefined && notification.type !== type) continue;

      this.notifications.set(id, {
        ...notification,
        isRead: true,
        readAt: now,
      });
      count++;
    }

    this.logger.debug('Marked all notifications as read', {
      userId,
      type,
      count,
    });

    return await Promise.resolve(count);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if a notification exists for a specific trigger.
   * Used to prevent duplicate notifications.
   *
   * @param userId - User ID
   * @param type - Notification type
   * @param entityId - Entity ID
   * @param withinMinutes - Time window to check (default 5 minutes)
   * @returns true if recent notification exists
   */
  async existsRecentForEntity(
    userId: string,
    type: NotificationType,
    entityId: string,
    withinMinutes: number = 5,
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);

    const exists = Array.from(this.notifications.values()).some(
      (n) =>
        n.userId === userId && n.type === type && n.entityId === entityId && n.createdAt >= cutoff,
    );

    return await Promise.resolve(exists);
  }
}
