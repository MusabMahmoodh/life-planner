// src/screens/Goals/components/GoalDetailModal.tsx
import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Text,
  Button,
  ProgressBar,
  IconButton,
  Chip,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Goal } from "../../../types";
import { COLORS, CATEGORY_COLORS } from "../../../constants/colors";

interface GoalDetailModalProps {
  visible: boolean;
  goal: Goal | null;
  onDismiss: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onMarkComplete?: (goal: Goal) => void;
}

export default function GoalDetailModal({
  visible,
  goal,
  onDismiss,
  onEdit,
  onDelete,
  onMarkComplete,
}: GoalDetailModalProps) {
  if (!goal) return null;

  const categoryColor = CATEGORY_COLORS[goal.category] || COLORS.PRIMARY;
  const isCompleted = goal.status === "completed";
  const isActive = goal.status === "active";

  const getPriorityColor = () => {
    switch (goal.priority) {
      case "high":
        return COLORS.DANGER;
      case "medium":
        return COLORS.WARNING;
      default:
        return COLORS.TEXT_TERTIARY;
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (): number => {
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                      name="target"
                      size={24}
                      color={categoryColor}
                    />
                    <Text style={styles.headerTitle}>Goal Details</Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={onDismiss}
                    iconColor={COLORS.TEXT_SECONDARY}
                  />
                </View>

                {/* Category and Status */}
                <View style={styles.badges}>
                  <Chip
                    icon={() => (
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: categoryColor },
                        ]}
                      />
                    )}
                    style={[
                      styles.categoryChip,
                      { borderColor: categoryColor, borderWidth: 1 },
                    ]}
                    textStyle={[styles.chipText, { color: categoryColor }]}
                  >
                    {goal.category}
                  </Chip>

                  {isCompleted && (
                    <Chip
                      icon="check-circle"
                      style={styles.completedChip}
                      textStyle={styles.completedChipText}
                    >
                      Completed
                    </Chip>
                  )}

                  {goal.aiCoachingEnabled && (
                    <Chip
                      icon="robot"
                      style={styles.aiChip}
                      textStyle={styles.aiChipText}
                    >
                      AI Coaching
                    </Chip>
                  )}
                </View>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <Text style={styles.title}>{goal.title}</Text>

                {/* Description */}
                <Text style={styles.description}>{goal.description}</Text>

                {/* Progress Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressText}>{goal.progress}%</Text>
                      <Text style={styles.progressLabel}>Complete</Text>
                    </View>
                    <ProgressBar
                      progress={goal.progress / 100}
                      color={categoryColor}
                      style={styles.progressBar}
                    />
                  </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  {/* Streak */}
                  <View style={styles.statCard}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={24}
                      color={COLORS.ACCENT}
                    />
                    <Text style={styles.statValue}>{goal.streak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>

                  {/* Priority */}
                  <View style={styles.statCard}>
                    <MaterialCommunityIcons
                      name={
                        goal.priority === "high"
                          ? "flag"
                          : goal.priority === "medium"
                            ? "flag-outline"
                            : "flag-variant-outline"
                      }
                      size={24}
                      color={getPriorityColor()}
                    />
                    <Text
                      style={[styles.statValue, { color: getPriorityColor() }]}
                    >
                      {goal.priority.charAt(0).toUpperCase() +
                        goal.priority.slice(1)}
                    </Text>
                    <Text style={styles.statLabel}>Priority</Text>
                  </View>

                  {/* Days Remaining */}
                  <View style={styles.statCard}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={24}
                      color={COLORS.PRIMARY}
                    />
                    <Text style={styles.statValue}>
                      {daysRemaining > 0 ? daysRemaining : "0"}
                    </Text>
                    <Text style={styles.statLabel}>Days Left</Text>
                  </View>
                </View>

                {/* Target Date */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Target Date</Text>
                  <View style={styles.dateCard}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color={COLORS.TEXT_SECONDARY}
                    />
                    <Text style={styles.dateText}>
                      {formatDate(goal.targetDate)}
                    </Text>
                  </View>
                </View>

                {/* Milestones (if any) */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Milestones</Text>
                    {goal.milestones.map((milestone, index) => (
                      <View key={index} style={styles.milestoneItem}>
                        <MaterialCommunityIcons
                          name={
                            milestone.completed
                              ? "checkbox-marked-circle"
                              : "checkbox-blank-circle-outline"
                          }
                          size={20}
                          color={
                            milestone.completed
                              ? COLORS.SUCCESS
                              : COLORS.TEXT_TERTIARY
                          }
                        />
                        <Text
                          style={[
                            styles.milestoneText,
                            milestone.completed && styles.milestoneCompleted,
                          ]}
                        >
                          {milestone.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.footer}>
                {isActive && (
                  <Button
                    mode="contained"
                    onPress={() => onMarkComplete && onMarkComplete(goal)}
                    style={styles.completeButton}
                    buttonColor={COLORS.SUCCESS}
                    textColor={COLORS.TEXT_WHITE}
                    icon="check-circle"
                  >
                    Mark Complete
                  </Button>
                )}

                <View style={styles.actionButtons}>
                  {onEdit && (
                    <Button
                      mode="outlined"
                      onPress={() => onEdit(goal)}
                      style={styles.actionButton}
                      textColor={COLORS.PRIMARY}
                      icon="pencil"
                    >
                      Edit
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      mode="outlined"
                      onPress={() => onDelete(goal)}
                      style={styles.actionButton}
                      textColor={COLORS.DANGER}
                      icon="delete"
                    >
                      Delete
                    </Button>
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  completedChip: {
    backgroundColor: COLORS.SUCCESS + "20",
    borderColor: COLORS.SUCCESS,
    borderWidth: 1,
  },
  completedChipText: {
    color: COLORS.SUCCESS,
    fontSize: 13,
    fontWeight: "500",
  },
  aiChip: {
    backgroundColor: COLORS.SECONDARY + "20",
    borderColor: COLORS.SECONDARY,
    borderWidth: 1,
  },
  aiChipText: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.BORDER,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.TEXT_PRIMARY,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  milestoneCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.TEXT_SECONDARY,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: 12,
  },
  completeButton: {
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
  },
});
