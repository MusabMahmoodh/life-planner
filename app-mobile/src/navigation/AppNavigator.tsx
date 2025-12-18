// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';

// Main Screens
import CreatePlanScreen from '../screens/CreatePlan/CreatePlanScreen';
import ChatConversationScreen from '../screens/Chat/ChatConversationScreen';
import GeneratingScreen from '../screens/Generating/GeneratingScreen';
import PlanConfirmationScreen from '../screens/PlanConfirmation/PlanConfirmationScreen';
import PlanDetailScreen from '../screens/PlanDetail/PlanDetailScreen';
import ReminderAlarmScreen from '../screens/ReminderAlarm/ReminderAlarmScreen';

// Tab Navigator
import RootNavigator from './RootNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 1️⃣ LOGIN */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* 2️⃣ MAIN TABS - Bottom Navigation (Home Screen) */}
      <Stack.Screen name="MainTabs" component={RootNavigator} />

      {/* 3️⃣ CREATE PLAN FLOW */}
      <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />

      {/* 4️⃣ UNIFIED CHAT SCREEN - Used for both new plans and modifications */}
      <Stack.Screen name="ChatFromPlan" component={ChatConversationScreen} />

      {/* 9️⃣ GENERATING ANIMATION SCREEN */}
      <Stack.Screen name="Generating" component={GeneratingScreen} />

      {/* 🔟 CONFIRMATION */}
      <Stack.Screen name="PlanConfirmation" component={PlanConfirmationScreen} />

      {/* 6️⃣ PLAN SCREEN */}
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />

      {/* 7️⃣ REMINDER ALARM SCREEN */}
      <Stack.Screen
        name="ReminderAlarm"
        component={ReminderAlarmScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}
