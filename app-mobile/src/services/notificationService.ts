// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Don't show banner/alert - we'll show our custom full-screen alarm instead
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderData {
  planId: string;
  planTitle: string;
  reminderMessage?: string;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  // For Android, configure notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedule a reminder notification
 */
export async function scheduleReminder(
  reminderData: ReminderData,
  triggerDate: Date
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission');
      return null;
    }

    // If the trigger date is in the past, don't schedule
    const now = new Date();
    if (triggerDate <= now) {
      console.log('Trigger date is in the past:', triggerDate);
      return null;
    }

    // Calculate seconds from now
    const secondsUntilTrigger = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

    console.log('Scheduling notification for:', triggerDate.toLocaleString());
    console.log('Seconds from now:', secondsUntilTrigger);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to work on your goal! 🎯',
        body: reminderData.reminderMessage || `Let's make progress on: ${reminderData.planTitle}`,
        data: {
          planId: reminderData.planId,
          planTitle: reminderData.planTitle,
          reminderMessage: reminderData.reminderMessage,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntilTrigger,
        repeats: false,
      } as any,
    });

    console.log('Notification scheduled successfully:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule automatic reminder for inactive plan (2 days)
 */
export async function scheduleInactivityReminder(
  reminderData: ReminderData,
  lastActivityDate: Date
): Promise<string | null> {
  const twoDaysFromLastActivity = new Date(lastActivityDate);
  twoDaysFromLastActivity.setDate(twoDaysFromLastActivity.getDate() + 2);

  // Only schedule if the reminder is in the future
  if (twoDaysFromLastActivity > new Date()) {
    return await scheduleReminder(
      {
        ...reminderData,
        reminderMessage: `You haven't worked on "${reminderData.planTitle}" for 2 days. Let's get back on track!`,
      },
      twoDaysFromLastActivity
    );
  }

  return null;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications for a plan
 */
export async function cancelAllRemindersForPlan(planId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const planNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.planId === planId
    );

    for (const notification of planNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`Cancelled ${planNotifications.length} notifications for plan ${planId}`);
  } catch (error) {
    console.error('Error cancelling plan notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
