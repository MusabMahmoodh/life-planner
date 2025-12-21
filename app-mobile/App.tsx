import React, { useRef, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import theme from './src/theme/theme';
import { QueryProvider } from './src/providers/QueryProvider';
import { AuthProvider } from './src/providers/AuthProvider';

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Request notification permissions on app start
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };

    requestPermissions();

    // Handle notification received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);

        // Navigate to ReminderAlarmScreen when notification is received
        const data = notification.request.content.data;
        if (navigationRef.current && data.planId) {
          navigationRef.current.navigate('ReminderAlarm', {
            planId: data.planId,
            planTitle: data.planTitle,
            reminderMessage: data.reminderMessage,
          });
        }
      }
    );

    // Handle notification tap/response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);

        // Navigate to ReminderAlarmScreen when notification is tapped
        const data = response.notification.request.content.data;
        if (navigationRef.current && data.planId) {
          navigationRef.current.navigate('ReminderAlarm', {
            planId: data.planId,
            planTitle: data.planTitle,
            reminderMessage: data.reminderMessage,
          });
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
