// src/screens/Generating/GeneratingScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface GeneratingScreenProps {
  navigation: any;
  route: {
    params: {
      planData: any;
      isUpdate?: boolean;
    };
  };
}

export default function GeneratingScreen({ navigation, route }: GeneratingScreenProps) {
  const { planData, isUpdate = false } = route.params;
  const scaleAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    // Scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Simulate AI processing
    const timer = setTimeout(() => {
      // Navigate to confirmation screen
      navigation.replace('PlanConfirmation', {
        planData,
        isUpdate,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="brain"
            size={80}
            color={COLORS.PRIMARY}
          />
        </Animated.View>

        {/* Loading Indicator */}
        <ActivityIndicator
          size="large"
          color={COLORS.PRIMARY}
          style={styles.loader}
        />

        {/* Text */}
        <Text style={styles.title}>
          {isUpdate ? 'Updating Your Plan...' : 'Generating Your Plan...'}
        </Text>
        <Text style={styles.subtitle}>
          {isUpdate
            ? 'AI is recalculating your steps based on your feedback'
            : 'AI is creating a personalized action plan for you'}
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.stepText}>Analyzing your goal</Text>
          </View>
          <View style={styles.step}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.stepText}>Creating action steps</Text>
          </View>
          <View style={styles.step}>
            <MaterialCommunityIcons name="circle-outline" size={20} color={COLORS.TEXT_TERTIARY} />
            <Text style={[styles.stepText, styles.pendingText]}>Setting timeline</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  pendingText: {
    color: COLORS.TEXT_TERTIARY,
  },
});
