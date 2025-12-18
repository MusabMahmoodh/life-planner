// src/screens/Updates/UpdatesScreen.tsx
import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Update } from "../../types";
import { sampleUpdates } from "../../data/placeholderData";
import { COLORS } from "../../constants/colors";

type UpdateFilter = "all" | "unread" | "achievement" | "reminder";

export default function UpdatesScreen() {
  const [filter, setFilter] = useState<UpdateFilter>("all");

  // Filter updates based on selected filter
  const getFilteredUpdates = (): Update[] => {
    switch (filter) {
      case "unread":
        return sampleUpdates.filter((update) => !update.read);
      case "achievement":
        return sampleUpdates.filter((update) => update.type === "achievement");
      case "reminder":
        return sampleUpdates.filter((update) => update.type === "reminder");
      default:
        return sampleUpdates;
    }
  };

  const filteredUpdates = getFilteredUpdates();
  const unreadCount = sampleUpdates.filter((u) => !u.read).length;

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Updates</Text>
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount} unread</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
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
        <Chip
          selected={filter === "unread"}
          onPress={() => setFilter("unread")}
          style={[
            styles.filterChip,
            filter === "unread" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "unread" ? styles.activeFilterText : styles.filterText
          }
        >
          Unread ({unreadCount})
        </Chip>
        <Chip
          selected={filter === "achievement"}
          onPress={() => setFilter("achievement")}
          style={[
            styles.filterChip,
            filter === "achievement" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "achievement"
              ? styles.activeFilterText
              : styles.filterText
          }
        >
          Achievements
        </Chip>
        <Chip
          selected={filter === "reminder"}
          onPress={() => setFilter("reminder")}
          style={[
            styles.filterChip,
            filter === "reminder" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "reminder" ? styles.activeFilterText : styles.filterText
          }
        >
          Reminders
        </Chip>
      </ScrollView>

      {/* Updates List */}
      <ScrollView
        style={styles.updatesList}
        contentContainerStyle={styles.updatesContent}
      >
        {filteredUpdates.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={80}
              color={COLORS.TEXT_TERTIARY}
            />
            <Text style={styles.emptyStateTitle}>No updates</Text>
            <Text style={styles.emptyStateMessage}>
              You&apos;re all caught up!
            </Text>
          </View>
        ) : (
          filteredUpdates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Update Card Component
interface UpdateCardProps {
  update: Update;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update }) => {
  const getIconName = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (update.icon) {
      return update.icon as keyof typeof MaterialCommunityIcons.glyphMap;
    }
    switch (update.type) {
      case "achievement":
        return "trophy";
      case "reminder":
        return "bell-ring";
      case "progress":
        return "chart-line";
      case "community":
        return "account-group";
      case "call":
        return "video";
      default:
        return "bell";
    }
  };

  const getIconColor = (): string => {
    switch (update.type) {
      case "achievement":
        return COLORS.ACCENT;
      case "reminder":
        return COLORS.SECONDARY;
      case "progress":
        return COLORS.PRIMARY;
      case "community":
        return COLORS.INFO;
      case "call":
        return COLORS.SUCCESS;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <TouchableOpacity onPress={() => console.log("Update tapped:", update.id)}>
      <Card style={[styles.updateCard, !update.read && styles.unreadCard]}>
        <Card.Content style={styles.updateCardContent}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getIconColor() + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name={getIconName()}
              size={20}
              color={getIconColor()}
            />
          </View>

          {/* Content */}
          <View style={styles.updateContent}>
            <View style={styles.updateHeader}>
              <Text style={styles.updateTitle}>{update.title}</Text>
              {!update.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.updateMessage} numberOfLines={2}>
              {update.message}
            </Text>
            <Text style={styles.updateTime}>
              {getTimeAgo(update.timestamp)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.PRIMARY,
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
  updatesList: {
    flex: 1,
  },
  updatesContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  updateCard: {
    marginBottom: 8,
    backgroundColor: COLORS.CARD,
    elevation: 1,
    borderRadius: 8,
  },
  unreadCard: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  updateCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginTop: 2,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 6,
  },
  updateMessage: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    lineHeight: 18,
  },
  updateTime: {
    fontSize: 11,
    color: COLORS.TEXT_TERTIARY,
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
});
