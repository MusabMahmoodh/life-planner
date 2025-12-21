import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens
import GoalsScreen from '../screens/Goals/GoalsScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import UpdatesScreen from '../screens/Updates/UpdatesScreen';
import CommunitiesScreen from '../screens/Communities/CommunitiesScreen';
import CallsScreen from '../screens/Calls/CallsScreen';

const Tab = createBottomTabNavigator();
const GoalsStack = createNativeStackNavigator();

function GoalsStackNavigator() {
  return (
    <GoalsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <GoalsStack.Screen name="GoalsList" component={GoalsScreen} />
      <GoalsStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
          headerTitle: '',
        }}
      />
    </GoalsStack.Navigator>
  );
}

export default function RootNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help-circle';

          switch (route.name) {
            case 'Goals':
              iconName = focused ? 'target' : 'target-variant';
              break;
            case 'Communities':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'Calls':
              iconName = focused ? 'video' : 'video-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Goals"
        component={GoalsStackNavigator}
        options={{
          title: 'Goals',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          title: 'Communities',
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          title: 'Calls',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }}
      />
    </Tab.Navigator>
  );
}
