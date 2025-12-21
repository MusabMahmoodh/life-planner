import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, InteractionManager } from "react-native";
import { Text, Card, ProgressBar, FAB, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Goal, GoalTabType } from "../../types";
import { COLORS, CATEGORY_COLORS } from "../../constants/colors";
import NewGoalModal, { NewGoalData } from "./components/NewGoalModal";
import { useGoals, useCreateGoal } from "../../hooks/useGoals";
import type { Goal as APIGoal } from "../../services/apiClient";
import { apiClient } from "../../services/apiClient";

export default function GoalsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<GoalTabType>("active");
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  // Close and reset modal when screen comes into focus (cleanup from previous navigation)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('GoalsScreen focused');
      // Always close modal on focus to clean up from navigation
      if (showNewGoalModal) {
        console.log('Closing modal on focus');
        setShowNewGoalModal(false);
      }
    });
    return unsubscribe;
  }, [navigation, showNewGoalModal]);

  // Fetch goals from API
  const { data: apiGoals, isLoading, error, refetch } = useGoals();
  const createGoalMutation = useCreateGoal();

  // Transform API goals to UI format
  const transformGoalToUI = (apiGoal: APIGoal): Goal => {
    // Map pending_acceptance to active for display purposes
    let displayStatus: "active" | "completed" | "archived" = "active";
    if (apiGoal.status === "completed") {
      displayStatus = "completed";
    } else if (apiGoal.status === "archived") {
      displayStatus = "archived";
    }

    return {
      id: apiGoal.id,
      title: apiGoal.goal_description,
      description: apiGoal.coach_name ? `Coached by ${apiGoal.coach_name}` : "AI Coaching",
      category: "Personal", // Default category, could be enhanced
      progress: 0, // Would need to calculate from plan steps
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
      startDate: apiGoal.created_at,
      priority: "medium" as const,
      aiCoachingEnabled: true,
      status: displayStatus,
      streak: 0, // Would need to track this
      tasks: [], // Would need to load from plan
    };
  };

  const getFilteredGoals = (): Goal[] => {
    if (!apiGoals) return [];

    const transformedGoals = apiGoals.map(transformGoalToUI);

    switch (selectedTab) {
      case "active":
        return transformedGoals.filter((goal) => goal.status === "active");
      case "completed":
        return transformedGoals.filter((goal) => goal.status === "completed");
      case "archived":
        return transformedGoals.filter((goal) => goal.status === "archived");
      default:
        return transformedGoals;
    }
  };

  const filteredGoals = getFilteredGoals();

  // Calculate stats from API goals
  const userStats = {
    activeGoals: apiGoals?.filter(g => g.status === 'active').length || 0,
    completedGoals: apiGoals?.filter(g => g.status === 'completed').length || 0,
    currentStreak: 0, // Would need to track this
  };

  const handleNewGoal = (goalData: NewGoalData) => {
    // Don't close modal yet - let the API call complete first
    // This prevents the black screen issue

    // Create goal via API and navigate directly to chat
    createGoalMutation.mutate(
      {
        coach_name: goalData.coachName,
        goal_description: goalData.title,
      },
      {
        onSuccess: (goal) => {
          console.log(`[${new Date().toISOString()}] 2. API Success - goal created`);
          console.log(`[${new Date().toISOString()}] 3. Navigating to ChatFromPlan NOW`);

          // Navigate immediately
          // Use getParent() twice to go from GoalsStack -> RootNavigator -> AppNavigator
          navigation.getParent()?.getParent()?.navigate('ChatFromPlan', {
            goalId: goal.id,
            coachName: goal.coach_name,
            goalText: goal.goal_description,
          });

          console.log(`[${new Date().toISOString()}] 4. Waiting for navigation animation to complete`);
          // Close modal AFTER all navigation animations/interactions complete
          // This prevents remounts while keeping the overlay visible during transition
          InteractionManager.runAfterInteractions(() => {
            console.log(`[${new Date().toISOString()}] 5. Navigation complete - closing modal now`);
            setShowNewGoalModal(false);
          });
        },
        onError: (error: any) => {
          console.error('Failed to create goal:', error);
          // Keep modal open on error so user can try again
        },
      }
    );
  };

  // Removed handleNavigateToChat - not needed anymore
  // All navigation is handled in handleNewGoal

  const handleGoalPress = async (goal: Goal) => {
    // Fetch full goal details including plan from API
    try {
      const response = await apiClient.getGoalDetails(goal.id);

      if (response.error) {
        console.error("Failed to fetch goal details:", response.error);
        return;
      }

      const goalDetail = response.data!;

      // If goal has a plan, navigate to plan detail
      if (goalDetail.plan && goalDetail.plan.steps && goalDetail.plan.steps.length > 0) {
        // Calculate duration
        let totalDuration = '12 weeks'; // Default
        try {
          const startTime = new Date(goalDetail.created_at).getTime();
          const now = Date.now();
          const weeks = Math.ceil((now - startTime) / (1000 * 60 * 60 * 24 * 7));
          if (weeks > 0) {
            totalDuration = `${weeks} weeks`;
          }
        } catch (e) {
          console.log('Error calculating duration:', e);
        }

        // Calculate progress
        const completedSteps = goalDetail.plan.steps.filter(s => s.completed).length;
        const progress = Math.round((completedSteps / goalDetail.plan.steps.length) * 100);

        const planData = {
          id: goalDetail.id,
          title: goalDetail.goal_description,
          coachName: goalDetail.coach_name,
          steps: goalDetail.plan.steps.map((step) => ({
            id: step.id.toString(),
            title: step.title,
            duration: step.duration,
            completed: step.completed,
            order: step.id,
          })),
          totalDuration,
          progress,
          category: goal.category,
          status: goalDetail.status,
        };

        // Use getParent() twice to go from GoalsStack -> RootNavigator -> AppNavigator
        navigation.getParent()?.getParent()?.navigate('PlanDetail', { plan: planData, goalId: goalDetail.id });
      } else {
        // If no plan exists, navigate to chat to create one
        // Use getParent() twice to go from GoalsStack -> RootNavigator -> AppNavigator
        navigation.getParent()?.getParent()?.navigate('ChatFromPlan', {
          goalId: goalDetail.id,
          coachName: goalDetail.coach_name,
          goalText: goalDetail.goal_description,
        });
      }
    } catch (error) {
      console.error("Failed to open goal:", error);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Stats Header */}
        <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.activeGoals}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.completedGoals}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.ACCENT }]}>
            {userStats.currentStreak} 🔥
          </Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        <Chip
          selected={selectedTab === "active"}
          onPress={() => setSelectedTab("active")}
          style={[styles.tab, selectedTab === "active" && styles.activeTab]}
          textStyle={
            selectedTab === "active" ? styles.activeTabText : styles.tabText
          }
        >
          Active
        </Chip>
        <Chip
          selected={selectedTab === "all"}
          onPress={() => setSelectedTab("all")}
          style={[styles.tab, selectedTab === "all" && styles.activeTab]}
          textStyle={
            selectedTab === "all" ? styles.activeTabText : styles.tabText
          }
        >
          All
        </Chip>
        <Chip
          selected={selectedTab === "completed"}
          onPress={() => setSelectedTab("completed")}
          style={[styles.tab, selectedTab === "completed" && styles.activeTab]}
          textStyle={
            selectedTab === "completed" ? styles.activeTabText : styles.tabText
          }
        >
          Completed
        </Chip>
        <Chip
          selected={selectedTab === "archived"}
          onPress={() => setSelectedTab("archived")}
          style={[styles.tab, selectedTab === "archived" && styles.activeTab]}
          textStyle={
            selectedTab === "archived" ? styles.activeTabText : styles.tabText
          }
        >
          Archived
        </Chip>
      </ScrollView>

      {/* Goals List */}
      <ScrollView
        style={styles.goalsList}
        contentContainerStyle={styles.goalsContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.emptyStateMessage}>Loading goals...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={80}
              color={COLORS.DANGER}
            />
            <Text style={styles.emptyStateTitle}>Error loading goals</Text>
            <Text style={styles.emptyStateMessage}>
              {error.message || 'Something went wrong'}
            </Text>
          </View>
        ) : filteredGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="target"
              size={80}
              color={COLORS.TEXT_TERTIARY}
            />
            <Text style={styles.emptyStateTitle}>No goals yet</Text>
            <Text style={styles.emptyStateMessage}>
              Start your journey by creating your first goal
            </Text>
          </View>
        ) : (
          filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={handleGoalPress} />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: COLORS.PRIMARY }]}
        color={COLORS.TEXT_WHITE}
        onPress={() => {
          console.log("FAB clicked - opening modal");
          setShowNewGoalModal(true);
        }}
        label="New Goal"
      />

      {/* Modals */}
      <NewGoalModal
        visible={showNewGoalModal}
        onDismiss={() => {
          console.log("Modal dismissed");
          setShowNewGoalModal(false);
        }}
        onSave={handleNewGoal}
      />

      {/* Removed GoalDetailModal - navigating to PlanDetail page instead */}
      </View>
    </SafeAreaView>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  onPress: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const categoryColor = CATEGORY_COLORS[goal.category] || COLORS.PRIMARY;

  return (
    <Card style={styles.goalCard}>
      <TouchableOpacity onPress={() => onPress(goal)}>
        <Card.Content style={styles.cardContent}>
          {/* Category Badge */}
          <View style={styles.cardHeader}>
            <Chip
              icon={() => (
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: categoryColor },
                  ]}
                />
              )}
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
            >
              {goal.category}
            </Chip>
            {goal.aiCoachingEnabled && (
              <MaterialCommunityIcons
                name="robot"
                size={16}
                color={COLORS.SECONDARY}
                style={styles.aiIcon}
              />
            )}
          </View>

          {/* Goal Title */}
          <Text style={styles.goalTitle}>{goal.title}</Text>

          {/* Goal Description */}
          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.description}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{goal.progress}% Complete</Text>
            <ProgressBar
              progress={goal.progress / 100}
              color={categoryColor}
              style={styles.progressBar}
            />
          </View>

          {/* Footer Info */}
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons
                name="fire"
                size={14}
                color={COLORS.ACCENT}
              />
              <Text style={styles.footerText}>{goal.streak} day streak</Text>
            </View>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.footerText}>
                {new Date(goal.targetDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons
                name={
                  goal.priority === "high"
                    ? "flag"
                    : goal.priority === "medium"
                      ? "flag-outline"
                      : "flag-variant-outline"
                }
                size={14}
                color={
                  goal.priority === "high"
                    ? COLORS.DANGER
                    : goal.priority === "medium"
                      ? COLORS.WARNING
                      : COLORS.TEXT_TERTIARY
                }
              />
              <Text style={styles.footerText}>{goal.priority}</Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.CARD,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.DIVIDER,
  },
  tabContainer: {
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    maxHeight: 52,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    backgroundColor: COLORS.BACKGROUND,
    height: 36,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
  },
  activeTabText: {
    color: COLORS.TEXT_WHITE,
    fontSize: 13,
  },
  goalsList: {
    flex: 1,
  },
  goalsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  goalCard: {
    marginBottom: 12,
    backgroundColor: COLORS.CARD,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  aiIcon: {
    marginLeft: 6,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    marginTop: 0,
    lineHeight: 26,
  },
  goalDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.BORDER,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
