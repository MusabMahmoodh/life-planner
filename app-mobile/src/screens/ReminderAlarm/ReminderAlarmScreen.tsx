// src/screens/ReminderAlarm/ReminderAlarmScreen.tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.4; // 40% of screen width

interface ReminderAlarmScreenProps {
  route: {
    params: {
      planId: string;
      planTitle: string;
      reminderMessage?: string;
    };
  };
  navigation: any;
}

export default function ReminderAlarmScreen({
  route,
  navigation,
}: ReminderAlarmScreenProps) {
  const { planId, planTitle, reminderMessage } = route.params;
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const leftButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const rightButtonOpacity = useRef(new Animated.Value(0.3)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow horizontal movement
        pan.setValue({ x: gestureState.dx, y: 0 });

        // Update button opacities based on swipe direction
        if (gestureState.dx < 0) {
          // Swiping left (towards red button)
          const opacity = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
          Animated.timing(leftButtonOpacity, {
            toValue: opacity,
            duration: 0,
            useNativeDriver: true,
          }).start();
          Animated.timing(rightButtonOpacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx > 0) {
          // Swiping right (towards green button)
          const opacity = Math.min(1, gestureState.dx / SWIPE_THRESHOLD);
          Animated.timing(rightButtonOpacity, {
            toValue: opacity,
            duration: 0,
            useNativeDriver: true,
          }).start();
          Animated.timing(leftButtonOpacity, {
            toValue: 0.3,
            duration: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();

        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped left - Dismiss/Snooze
          setSwipeDirection('left');
          handleDismiss();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped right - Open Plan
          setSwipeDirection('right');
          handleOpenPlan();
        } else {
          // Not enough swipe distance - reset
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          Animated.timing(leftButtonOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Animated.timing(rightButtonOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDismiss = () => {
    Animated.timing(pan.x, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const handleOpenPlan = () => {
    Animated.timing(pan.x, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Navigate to plan detail directly
      navigation.navigate('PlanDetail', { plan: { id: planId, title: planTitle } });
    });
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Background Indicators */}
      <Animated.View style={[styles.leftIndicator, { opacity: leftButtonOpacity }]}>
        <MaterialCommunityIcons name="close-circle" size={80} color="#fff" />
        <Text style={styles.indicatorText}>Dismiss</Text>
      </Animated.View>

      <Animated.View style={[styles.rightIndicator, { opacity: rightButtonOpacity }]}>
        <MaterialCommunityIcons name="check-circle" size={80} color="#fff" />
        <Text style={styles.indicatorText}>Open Plan</Text>
      </Animated.View>

      {/* Main Alarm Card */}
      <Animated.View
        style={[
          styles.alarmCard,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardContent}>
          {/* Time */}
          <Text style={styles.time}>{currentTime}</Text>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="bell-ring" size={100} color={COLORS.PRIMARY} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Time to work on your goal!</Text>

          {/* Plan Name */}
          <View style={styles.planContainer}>
            <MaterialCommunityIcons name="target" size={24} color={COLORS.SECONDARY} />
            <Text style={styles.planTitle}>{planTitle}</Text>
          </View>

          {/* Message */}
          {reminderMessage && (
            <Text style={styles.message}>{reminderMessage}</Text>
          )}

          {/* Swipe Instruction */}
          <View style={styles.swipeInstruction}>
            <View style={styles.swipeHint}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.DANGER} />
              <Text style={styles.swipeText}>Swipe left to dismiss</Text>
            </View>
            <View style={styles.swipeHint}>
              <Text style={styles.swipeText}>Swipe right to open</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color={COLORS.SUCCESS} />
            </View>
          </View>

          {/* Swipe Bar */}
          <View style={styles.swipeBar}>
            <View style={styles.swipeHandle} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIndicator: {
    position: 'absolute',
    left: 40,
    top: height / 2 - 100,
    alignItems: 'center',
  },
  rightIndicator: {
    position: 'absolute',
    right: 40,
    top: height / 2 - 100,
    alignItems: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  alarmCard: {
    width: width * 0.9,
    backgroundColor: COLORS.CARD,
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  cardContent: {
    alignItems: 'center',
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  iconContainer: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  swipeInstruction: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  swipeBar: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  swipeHandle: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.TEXT_TERTIARY,
    borderRadius: 3,
  },
});
