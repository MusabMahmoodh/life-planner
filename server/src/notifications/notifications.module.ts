/**
 * Notifications Module
 *
 * @see BACKEND SPECIFICATION Section 10 - Notifications (V1)
 *
 * Provides in-app notification capabilities.
 *
 * Features:
 * - Create notifications for system events
 * - Fetch user notifications with pagination
 * - Mark notifications as read
 *
 * Rules:
 * - In-app only (no external delivery)
 * - No scheduling
 * - No AI calls
 * - User ownership enforced
 */

import { Module } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationRepository, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
