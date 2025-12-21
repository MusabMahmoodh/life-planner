// src/screens/PlanDetail/PlanDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Text, Card, Chip, ProgressBar, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import QuickChangesModal from './components/QuickChangesModal';
import SetReminderModal from './components/SetReminderModal';
import { scheduleReminder, scheduleInactivityReminder } from '../../services/notificationService';
import { useToggleStep, useGoalDetails } from '../../hooks/useGoals';

interface PlanDetailScreenProps {
  navigation: any;
  route: {
    params: {
      plan: any;
      goalId?: string;
    };
  };
}

export default function PlanDetailScreen({ navigation, route }: PlanDetailScreenProps) {
  const { plan: initialPlan, goalId } = route.params;
  const [showQuickChangesModal, setShowQuickChangesModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [lastActivityDate, setLastActivityDate] = useState(new Date());

  // Fetch goal details if goalId is provided, otherwise use initial plan
  const { data: goalDetail } = useGoalDetails(goalId || '', !!goalId);
  const toggleStepMutation = useToggleStep();

  // Use plan from API if available, otherwise use the initial plan
  const plan = goalDetail?.plan ? {
    ...initialPlan,
    steps: goalDetail.plan.steps.map((step: any) => ({
      id: step.id.toString(),
      title: step.title,
      duration: step.duration,
      completed: step.completed,
      order: step.id,
    })),
  } : initialPlan;

  const steps = plan.steps || [];

  // Calculate progress
  const completedSteps = steps?.filter((s: any) => s.completed).length || 0;
  const progress = steps?.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  // Schedule automatic 2-day inactivity reminder when user stops interacting
  useEffect(() => {
    // Only schedule inactivity reminder if there's actual inactivity (not on first mount)
    // This will reschedule when lastActivityDate changes (when user interacts with plan)
    if (!plan?.id || !plan?.title) return;

    // Don't schedule on initial mount - only when activity date changes
    const now = new Date();
    const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only schedule if user has actually been inactive (not the initial render)
    if (daysSinceActivity > 0) {
      const setupInactivityReminder = async () => {
        const notificationId = await scheduleInactivityReminder(
          {
            planId: plan.id,
            planTitle: plan.title,
          },
          lastActivityDate
        );
        console.log('Inactivity reminder scheduled:', notificationId);
      };
      setupInactivityReminder();
    }
  }, [lastActivityDate]); // Only trigger when activity date changes

  const handleToggleStep = (stepId: string) => {
    if (!goalId) {
      console.warn('Cannot toggle step: goalId is not provided');
      return;
    }

    const step = steps.find((s: any) => s.id === stepId);
    if (!step) return;

    const newCompletedState = !step.completed;

    // Optimistically update UI
    // Note: React Query will handle the actual update via cache invalidation

    // Call API to toggle step
    toggleStepMutation.mutate({
      goalId,
      stepId: parseInt(stepId),
      completed: newCompletedState,
    }, {
      onError: (error) => {
        console.error('Failed to toggle step:', error);
        // Optionally show an error message to the user
      },
    });

    // Update last activity date when user interacts with plan
    setLastActivityDate(new Date());
  };

  const handleSetReminder = async (date: Date, message: string) => {
    const notificationId = await scheduleReminder(
      {
        planId: plan.id,
        planTitle: plan.title,
        reminderMessage: message,
      },
      date
    );

    if (notificationId) {
      Alert.alert(
        'Reminder Set',
        `You'll be reminded about "${plan.title}" on ${date.toLocaleString()}`,
        [{ text: 'OK' }]
      );
      setShowReminderModal(false);
    } else {
      Alert.alert(
        'Failed to Set Reminder',
        'Please check notification permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChatClick = () => {
    // Navigate to chat with the goal ID
    if (goalId) {
      navigation.navigate('ChatFromPlan', {
        goalId,
        coachName: plan.coachName || 'Coach',
        goalText: plan.title,
        mode: 'PLAN_SCREEN',
        plan,
      });
    } else {
      // Fallback if no goalId
      navigation.navigate('ChatFromPlan', {
        plan,
        mode: 'PLAN_SCREEN',
      });
    }
  };

  const handleQuickChanges = () => {
    // Open quick changes modal
    setShowQuickChangesModal(true);
  };

  const handleGenerateWithChanges = (changes: string) => {
    // Close modal and navigate to generating screen
    setShowQuickChangesModal(false);

    navigation.navigate('Generating', {
      planData: {
        plan,
        modifications: [{ text: changes }],
      },
      isUpdate: true,
      goalId: goalId || plan.id,
      coachName: plan.coachName,
      goalText: plan.title,
    });
  };

  const handleListClick = () => {
    // Navigate back to goals list (MainTabs)
    // Use getParent() to navigate from PlanDetail (in AppNavigator) to MainTabs
    navigation.navigate('MainTabs', { screen: 'Goals' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              iconColor={COLORS.TEXT_WHITE}
              style={styles.headerButton}
            />
            <View style={styles.headerActions}>
            <IconButton
              icon="bell-plus"
              size={24}
              onPress={() => setShowReminderModal(true)}
              iconColor={COLORS.TEXT_WHITE}
            />
            <IconButton
              icon="format-list-bulleted"
              size={24}
              onPress={handleListClick}
              iconColor={COLORS.TEXT_WHITE}
            />
            <IconButton
              icon="chat"
              size={24}
              onPress={handleChatClick}
              iconColor={COLORS.TEXT_WHITE}
            />
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{plan.title}</Text>
          {plan.coachName && (
            <Text style={styles.headerSubtitle}>by {plan.coachName}</Text>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {completedSteps} of {steps.length} steps completed
              </Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <ProgressBar
              progress={progress / 100}
              color={COLORS.TEXT_WHITE}
              style={styles.progressBar}
            />
          </View>
        </View>
      </View>

      {/* Plan Details */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={COLORS.PRIMARY}
                />
                <View>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{plan.totalDuration}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="fire"
                  size={20}
                  color={COLORS.ACCENT}
                />
                <View>
                  <Text style={styles.infoLabel}>Streak</Text>
                  <Text style={styles.infoValue}>5 days</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="tag"
                  size={20}
                  color={COLORS.SECONDARY}
                />
                <View>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{plan.category}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Steps</Text>
          {steps.map((step: any, index: number) => (
            <TouchableOpacity
              key={step.id}
              onPress={() => handleToggleStep(step.id)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.stepCard,
                  step.completed && styles.completedStepCard,
                ]}
              >
                <Card.Content style={styles.stepContent}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepNumber,
                        step.completed && styles.completedStepNumber,
                      ]}
                    >
                      {step.completed ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={COLORS.TEXT_WHITE}
                        />
                      ) : (
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.stepInfo}>
                      <Text
                        style={[
                          styles.stepTitle,
                          step.completed && styles.completedStepTitle,
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={styles.stepDuration}>{step.duration}</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={step.completed ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={step.completed ? COLORS.SUCCESS : COLORS.TEXT_TERTIARY}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timeline Note */}
        <Card style={styles.noteCard}>
          <Card.Content>
            <View style={styles.noteHeader}>
              <MaterialCommunityIcons
                name="robot"
                size={20}
                color={COLORS.SECONDARY}
              />
              <Text style={styles.noteTitle}>Coach's Note</Text>
            </View>
            <Text style={styles.noteText}>
              You're doing great! Stay consistent and you'll achieve your goal.
              Feel free to chat with me if you need to adjust the plan.
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Changes Button */}
        <Button
          mode="contained"
          onPress={handleQuickChanges}
          style={styles.quickChangesButton}
          buttonColor={COLORS.SECONDARY}
          icon="lightning-bolt"
          contentStyle={styles.quickChangesButtonContent}
        >
          Quick Changes
        </Button>
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleChatClick}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chat" size={24} color={COLORS.TEXT_WHITE} />
      </TouchableOpacity>

      {/* Quick Changes Modal */}
      <QuickChangesModal
        visible={showQuickChangesModal}
        onDismiss={() => setShowQuickChangesModal(false)}
        onGenerate={handleGenerateWithChanges}
        planTitle={plan.title}
      />

      {/* Set Reminder Modal */}
      <SetReminderModal
        visible={showReminderModal}
        onDismiss={() => setShowReminderModal(false)}
        onSetReminder={handleSetReminder}
        planTitle={plan.title}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 56,
  },
  headerButton: {
    margin: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_WHITE,
    opacity: 0.8,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.TEXT_WHITE,
    opacity: 0.9,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  infoCard: {
    backgroundColor: COLORS.CARD,
    elevation: 2,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: COLORS.CARD,
    elevation: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  completedStepCard: {
    opacity: 0.7,
  },
  stepContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStepNumber: {
    backgroundColor: COLORS.SUCCESS,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  completedStepTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_SECONDARY,
  },
  stepDuration: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  noteCard: {
    backgroundColor: COLORS.CARD,
    elevation: 2,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SECONDARY,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  quickChangesButton: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 6,
  },
  quickChangesButtonContent: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
