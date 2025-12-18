import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface PlanConfirmationScreenProps {
  navigation: any;
  route: {
    params: {
      planData: any;
      isUpdate?: boolean;
    };
  };
}

// Mock generated plan (in production, this would come from AI backend)
const mockPlan = {
  id: 'plan-1',
  title: 'Run a Marathon',
  coachName: 'Coach Sarah',
  steps: [
    { id: '1', title: 'Get proper running shoes', duration: '1 day', completed: false },
    { id: '2', title: 'Start with 2km runs, 3 times a week', duration: '2 weeks', completed: false },
    { id: '3', title: 'Gradually increase to 5km runs', duration: '3 weeks', completed: false },
    { id: '4', title: 'Build endurance with 10km runs', duration: '4 weeks', completed: false },
    { id: '5', title: 'Practice half-marathon distance', duration: '6 weeks', completed: false },
    { id: '6', title: 'Complete marathon training plan', duration: '8 weeks', completed: false },
  ],
  totalDuration: '24 weeks',
  category: 'Fitness',
};

export default function PlanConfirmationScreen({
  navigation,
  route,
}: PlanConfirmationScreenProps) {
  const { isUpdate = false } = route.params;

  const handleAccept = () => {
    // Save plan and navigate to Plan Detail screen
    navigation.replace('PlanDetail', { plan: mockPlan });
  };

  const handleReject = () => {
    // Go back to chat to continue refinement
    navigation.goBack();
  };

  return (
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
              <View>
                <Text style={styles.planTitle}>{mockPlan.title}</Text>
                <Text style={styles.coachName}>by {mockPlan.coachName}</Text>
              </View>
              <Chip
                icon="calendar"
                style={styles.durationChip}
                textStyle={styles.durationText}
              >
                {mockPlan.totalDuration}
              </Chip>
            </View>

            <View style={styles.divider} />

            <Text style={styles.stepsTitle}>Action Steps</Text>
            {mockPlan.steps.map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
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
          >
            Yes, Save Plan
          </Button>
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
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
