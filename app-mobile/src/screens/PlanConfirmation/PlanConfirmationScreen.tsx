import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAcceptPlan } from '../../hooks/useGoals';

interface PlanConfirmationScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
      plan: any;
      coachName: string;
      goalText: string;
      isUpdate?: boolean;
    };
  };
}

export default function PlanConfirmationScreen({
  navigation,
  route,
}: PlanConfirmationScreenProps) {
  const { goalId, plan, coachName, goalText, isUpdate = false } = route.params;

  // Validate that goalId exists
  if (!goalId) {
    console.error('PlanConfirmationScreen: goalId is missing!', route.params);
  }
  const [isAccepting, setIsAccepting] = useState(false);

  const acceptPlanMutation = useAcceptPlan();

  const handleAccept = async () => {
    setIsAccepting(true);

    // Accept the plan via API
    acceptPlanMutation.mutate(goalId, {
      onSuccess: () => {
        // Navigate to Plan Detail screen
        const planData = {
          id: goalId,
          title: plan.goal || goalText,
          coachName,
          steps: plan.steps.map((step: any, index: number) => ({
            id: step.id?.toString() || (index + 1).toString(),
            title: step.title,
            duration: step.duration,
            completed: step.completed || false,
            order: step.id || index + 1,
          })),
          totalDuration: calculateTotalDuration(plan.steps),
          progress: 0,
          category: 'Personal',
          status: 'active',
        };

        navigation.replace('PlanDetail', { plan: planData, goalId });
      },
      onError: (error: any) => {
        console.error('Failed to accept plan:', error);
        setIsAccepting(false);
        // You could show an error message here
      },
    });
  };

  const handleReject = () => {
    // Go back to chat to continue refinement
    navigation.goBack();
  };

  const calculateTotalDuration = (steps: any[]): string => {
    // Sum up all step durations or provide a reasonable estimate
    return `${steps.length * 2} weeks`; // Simple estimation
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <MaterialCommunityIcons
          name="check-circle"
          size={48}
          color={COLORS.SUCCESS}
        />
        <Text style={styles.headerTitle}>
          {isUpdate ? 'Plan Updated!' : 'Your Plan is Ready!'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isUpdate
            ? 'Review the changes and let me know if you\'re happy with them'
            : 'Review your personalized action plan'}
        </Text>
      </View>

      {/* Plan Preview */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.planCard}>
          <Card.Content>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{plan?.goal || goalText}</Text>
                <Text style={styles.coachName}>by {coachName}</Text>
              </View>
              <Chip
                icon="calendar"
                style={styles.durationChip}
                textStyle={styles.durationText}
              >
                {calculateTotalDuration(plan?.steps || [])}
              </Chip>
            </View>

            <View style={styles.divider} />

            <Text style={styles.stepsTitle}>Action Steps</Text>
            {(plan?.steps || []).map((step: any, index: number) => (
              <View key={step.id || index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDuration}>{step.duration}</Text>
                </View>
                <MaterialCommunityIcons
                  name="circle-outline"
                  size={20}
                  color={COLORS.TEXT_TERTIARY}
                />
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.questionText}>Is this plan okay?</Text>
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={handleReject}
            style={styles.rejectButton}
            textColor={COLORS.TEXT_PRIMARY}
          >
            No, Let's Refine
          </Button>
          <Button
            mode="contained"
            onPress={handleAccept}
            style={styles.acceptButton}
            buttonColor={COLORS.SUCCESS}
            textColor={COLORS.TEXT_WHITE}
            disabled={isAccepting || acceptPlanMutation.isPending}
            loading={isAccepting || acceptPlanMutation.isPending}
          >
            {isAccepting || acceptPlanMutation.isPending ? 'Accepting...' : 'Yes, Save Plan'}
          </Button>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.CARD,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  planCard: {
    backgroundColor: COLORS.CARD,
    elevation: 2,
    borderRadius: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  coachName: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  durationChip: {
    backgroundColor: COLORS.BACKGROUND,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 16,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  actionsContainer: {
    padding: 20,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    borderColor: COLORS.BORDER,
  },
  acceptButton: {
    flex: 1,
  },
});
