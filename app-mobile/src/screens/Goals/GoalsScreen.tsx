import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, ProgressBar, FAB, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Goal, GoalTabType } from "../../types";
import { sampleGoals, userStats } from "../../data/placeholderData";
import { COLORS, CATEGORY_COLORS } from "../../constants/colors";
import NewGoalModal, { NewGoalData } from "./components/NewGoalModal";

export default function GoalsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<GoalTabType>("active");
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  const getFilteredGoals = (): Goal[] => {
    switch (selectedTab) {
      case "active":
        return sampleGoals.filter((goal) => goal.status === "active");
      case "completed":
        return sampleGoals.filter((goal) => goal.status === "completed");
      case "archived":
        return sampleGoals.filter((goal) => goal.status === "archived");
      default:
        return sampleGoals;
    }
  };

  const filteredGoals = getFilteredGoals();

  const handleNewGoal = (goalData: NewGoalData) => {
    // AI will generate the full goal details from coach name and goal title
    console.log("New goal created with AI:", goalData);
    setShowNewGoalModal(false);
    // In a real app, you would:
    // 1. Send coach name + goal to AI backend
    // 2. AI generates: category, priority, milestones, coaching plan
    // 3. Update the goals list with AI-generated goal
    // 4. Show a success message
  };

  const handleNavigateToChat = (goalData: NewGoalData) => {
    setShowNewGoalModal(false);
    // Navigate to unified ChatFromPlan screen (same as existing plans)
    navigation.getParent()?.navigate('ChatFromPlan', {
      coachName: goalData.coachName,
      goalText: goalData.title,
      mode: 'CONVERSATION',
      plan: null,
    });
  };

  const handleGoalPress = (goal: Goal) => {
    // Navigate to PlanDetail screen instead of showing modal

    // Calculate duration safely
    let totalDuration = '12 weeks'; // Default
    try {
      const startTime = new Date(goal.startDate).getTime();
      const targetTime = new Date(goal.targetDate).getTime();
      if (!isNaN(startTime) && !isNaN(targetTime)) {
        const weeks = Math.ceil((targetTime - startTime) / (1000 * 60 * 60 * 24 * 7));
        if (weeks > 0) {
          totalDuration = `${weeks} weeks`;
        }
      }
    } catch (e) {
      console.log('Error calculating duration:', e);
    }

    const planData = {
      id: goal.id,
      title: goal.title,
      coachName: 'Coach AI', // You can add coachName to Goal type later
      steps: goal.tasks && goal.tasks.length > 0
        ? goal.tasks.map((task, index) => ({
            id: task.id,
            title: task.title,
            duration: '1 week',
            completed: task.completed,
            order: index + 1,
          }))
        : [
            { id: '1', title: 'Get started with your goal', duration: '1 week', completed: false, order: 1 },
            { id: '2', title: 'Make consistent progress', duration: '2 weeks', completed: false, order: 2 },
            { id: '3', title: 'Achieve your goal', duration: '4 weeks', completed: false, order: 3 },
          ],
      totalDuration,
      progress: goal.progress || 0,
      category: goal.category,
    };

    // Navigate to PlanDetail in parent navigator (AppNavigator)
    navigation.getParent()?.navigate('PlanDetail', { plan: planData });
  };


  return (
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
      >
        {filteredGoals.length === 0 ? (
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
        onNavigateToChat={handleNavigateToChat}
      />

      {/* Removed GoalDetailModal - navigating to PlanDetail page instead */}
    </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingVertical: 12,
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
    maxHeight: 44,
  },
  tabContent: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 6,
  },
  tab: {
    backgroundColor: COLORS.BACKGROUND,
    marginRight: 6,
    height: 32,
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
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  goalCard: {
    marginBottom: 8,
    backgroundColor: COLORS.CARD,
    elevation: 1,
    borderRadius: 8,
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
