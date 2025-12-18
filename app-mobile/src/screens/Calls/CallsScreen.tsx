// src/screens/Calls/CallsScreen.tsx
import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Button, Chip, FAB } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Call } from "../../types";
import { sampleCalls } from "../../data/placeholderData";
import { COLORS } from "../../constants/colors";
import ScheduleCallModal, { NewCallData } from "./components/ScheduleCallModal";

type CallFilter = "upcoming" | "completed" | "all";

export default function CallsScreen() {
  const [filter, setFilter] = useState<CallFilter>("upcoming");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Filter calls
  const getFilteredCalls = (): Call[] => {
    switch (filter) {
      case "upcoming":
        return sampleCalls.filter((call) => call.status === "upcoming");
      case "completed":
        return sampleCalls.filter((call) => call.status === "completed");
      default:
        return sampleCalls;
    }
  };

  const filteredCalls = getFilteredCalls();
  const upcomingCount = sampleCalls.filter(
    (c) => c.status === "upcoming",
  ).length;

  const handleScheduleCall = (callData: NewCallData) => {
    // TODO: Implement call scheduling logic
    console.log("New call scheduled:", callData);
    setShowScheduleModal(false);
    // In a real app, you would:
    // 1. Call an API to create the call
    // 2. Update the calls list
    // 3. Show a success message
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Calls</Text>
        <Text style={styles.headerSubtitle}>
          {upcomingCount} upcoming {upcomingCount === 1 ? "call" : "calls"}
        </Text>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Chip
          selected={filter === "upcoming"}
          onPress={() => setFilter("upcoming")}
          style={[
            styles.filterChip,
            filter === "upcoming" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "upcoming" ? styles.activeFilterText : styles.filterText
          }
        >
          Upcoming ({upcomingCount})
        </Chip>
        <Chip
          selected={filter === "completed"}
          onPress={() => setFilter("completed")}
          style={[
            styles.filterChip,
            filter === "completed" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "completed" ? styles.activeFilterText : styles.filterText
          }
        >
          Completed
        </Chip>
        <Chip
          selected={filter === "all"}
          onPress={() => setFilter("all")}
          style={[
            styles.filterChip,
            filter === "all" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "all" ? styles.activeFilterText : styles.filterText
          }
        >
          All
        </Chip>
      </ScrollView>

      {/* Calls List */}
      <ScrollView
        style={styles.callsList}
        contentContainerStyle={styles.callsContent}
      >
        {filteredCalls.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="video-outline"
              size={80}
              color={COLORS.TEXT_TERTIARY}
            />
            <Text style={styles.emptyStateTitle}>No calls scheduled</Text>
            <Text style={styles.emptyStateMessage}>
              Schedule a coaching call to get started
            </Text>
          </View>
        ) : (
          filteredCalls.map((call) => <CallCard key={call.id} call={call} />)
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: COLORS.PRIMARY }]}
        color={COLORS.TEXT_WHITE}
        onPress={() => setShowScheduleModal(true)}
        label="Schedule Call"
      />

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        visible={showScheduleModal}
        onDismiss={() => setShowScheduleModal(false)}
        onSave={handleScheduleCall}
      />
    </View>
  );
}

// Call Card Component
interface CallCardProps {
  call: Call;
}

const CallCard: React.FC<CallCardProps> = ({ call }) => {
  const isUpcoming = call.status === "upcoming";
  const isToday =
    new Date(call.scheduledTime).toDateString() === new Date().toDateString();

  const getCallTypeColor = (): string => {
    switch (call.type) {
      case "coaching":
        return COLORS.PRIMARY;
      case "accountability":
        return COLORS.SECONDARY;
      case "group":
        return COLORS.ACCENT;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const getCallTypeIcon = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (call.type) {
      case "coaching":
        return "school";
      case "accountability":
        return "account-check";
      case "group":
        return "account-group";
      default:
        return "video";
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    if (isToday) return "Today";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const getTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 0) return "Started";
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    return `In ${days}d`;
  };

  return (
    <Card style={[styles.callCard, isToday && isUpcoming && styles.todayCard]}>
      <TouchableOpacity onPress={() => console.log("Call tapped:", call.id)}>
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.callTypeIcon,
                { backgroundColor: getCallTypeColor() + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={getCallTypeIcon()}
                size={20}
                color={getCallTypeColor()}
              />
            </View>
            <View style={styles.callInfo}>
              <View style={styles.callTitleRow}>
                <Text style={styles.callTitle}>{call.title}</Text>
                {isToday && isUpcoming && (
                  <Chip
                    style={styles.todayChip}
                    textStyle={styles.todayChipText}
                  >
                    Today
                  </Chip>
                )}
              </View>
              <Text style={styles.callParticipant}>{call.participantName}</Text>
            </View>
          </View>

          {/* Description */}
          {call.description && (
            <Text style={styles.callDescription} numberOfLines={2}>
              {call.description}
            </Text>
          )}

          {/* Time and Duration */}
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.timeText}>
                {formatDate(call.scheduledTime)}
              </Text>
            </View>
            <View style={styles.timeItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.timeText}>
                {formatTime(call.scheduledTime)} ({call.duration}min)
              </Text>
            </View>
          </View>

          {/* Call Type Badge */}
          <View style={styles.metaContainer}>
            <Chip
              icon={() => (
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: getCallTypeColor() },
                  ]}
                />
              )}
              style={styles.typeChip}
              textStyle={styles.typeChipText}
            >
              {call.type}
            </Chip>
            {isUpcoming && (
              <Text
                style={[styles.timeUntil, isToday && { color: COLORS.PRIMARY }]}
              >
                {getTimeUntil(call.scheduledTime)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          {isUpcoming && call.meetingLink && (
            <Button
              mode="contained"
              onPress={() => console.log("Join call:", call.id)}
              style={styles.joinButton}
              buttonColor={COLORS.PRIMARY}
              textColor={COLORS.TEXT_WHITE}
              icon="video"
            >
              Join Call
            </Button>
          )}

          {call.status === "completed" && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={COLORS.SUCCESS}
              />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
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
  header: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  filterContainer: {
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 6,
  },
  filterChip: {
    backgroundColor: COLORS.BACKGROUND,
    marginRight: 6,
    height: 32,
  },
  activeFilterChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
  },
  activeFilterText: {
    color: COLORS.TEXT_WHITE,
    fontSize: 13,
  },
  callsList: {
    flex: 1,
  },
  callsContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  callCard: {
    marginBottom: 8,
    backgroundColor: COLORS.CARD,
    elevation: 1,
    borderRadius: 8,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  todayCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  callTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  callInfo: {
    flex: 1,
  },
  callTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginTop: 2,
  },
  todayChip: {
    height: 22,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 6,
  },
  todayChipText: {
    fontSize: 10,
    color: COLORS.TEXT_WHITE,
  },
  callParticipant: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  callDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    lineHeight: 18,
  },
  timeContainer: {
    marginBottom: 10,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeChip: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.TEXT_PRIMARY,
    textTransform: "capitalize",
    lineHeight: 18,
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  timeUntil: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
  },
  joinButton: {
    borderRadius: 6,
    height: 36,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  completedText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    fontWeight: "600",
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
