// src/screens/Communities/CommunitiesScreen.tsx
import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Button, Chip, Searchbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Community } from "../../types";
import { sampleCommunities } from "../../data/placeholderData";
import { COLORS, CATEGORY_COLORS } from "../../constants/colors";

type CommunityFilter = "all" | "joined" | "suggested";

export default function CommunitiesScreen() {
  const [filter, setFilter] = useState<CommunityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter communities
  const getFilteredCommunities = (): Community[] => {
    let filtered = sampleCommunities;

    // Apply filter
    switch (filter) {
      case "joined":
        filtered = filtered.filter((c) => c.isJoined);
        break;
      case "suggested":
        filtered = filtered.filter((c) => !c.isJoined);
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const filteredCommunities = getFilteredCommunities();
  const joinedCount = sampleCommunities.filter((c) => c.isJoined).length;

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <Text style={styles.headerSubtitle}>{joinedCount} joined</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search communities..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={COLORS.TEXT_SECONDARY}
          inputStyle={styles.searchInput}
        />
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
          selected={filter === "joined"}
          onPress={() => setFilter("joined")}
          style={[
            styles.filterChip,
            filter === "joined" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "joined" ? styles.activeFilterText : styles.filterText
          }
        >
          Joined ({joinedCount})
        </Chip>
        <Chip
          selected={filter === "suggested"}
          onPress={() => setFilter("suggested")}
          style={[
            styles.filterChip,
            filter === "suggested" && styles.activeFilterChip,
          ]}
          textStyle={
            filter === "suggested" ? styles.activeFilterText : styles.filterText
          }
        >
          Suggested
        </Chip>
      </ScrollView>

      {/* Communities List */}
      <ScrollView
        style={styles.communitiesList}
        contentContainerStyle={styles.communitiesContent}
      >
        {filteredCommunities.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={80}
              color={COLORS.TEXT_TERTIARY}
            />
            <Text style={styles.emptyStateTitle}>No communities found</Text>
            <Text style={styles.emptyStateMessage}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Community Card Component
interface CommunityCardProps {
  community: Community;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community }) => {
  const categoryColor = CATEGORY_COLORS[community.category] || COLORS.PRIMARY;

  const getActivityIcon = () => {
    switch (community.activityLevel) {
      case "high":
        return "chart-line";
      case "medium":
        return "chart-line-variant";
      default:
        return "chart-box-outline";
    }
  };

  const getActivityColor = () => {
    switch (community.activityLevel) {
      case "high":
        return COLORS.SUCCESS;
      case "medium":
        return COLORS.WARNING;
      default:
        return COLORS.TEXT_TERTIARY;
    }
  };

  return (
    <Card style={styles.communityCard}>
      <TouchableOpacity
        onPress={() => console.log("Community tapped:", community.id)}
      >
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.communityIcon}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={categoryColor}
              />
            </View>
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>{community.name}</Text>
              <View style={styles.communityMeta}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={12}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.memberCount}>
                  {community.memberCount.toLocaleString()} members
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.communityDescription} numberOfLines={2}>
            {community.description}
          </Text>

          {/* Tags and Activity */}
          <View style={styles.metaContainer}>
            <View style={styles.tagsContainer}>
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
                {community.category}
              </Chip>
            </View>
            <View style={styles.activityBadge}>
              <MaterialCommunityIcons
                name={getActivityIcon()}
                size={12}
                color={getActivityColor()}
              />
              <Text
                style={[styles.activityText, { color: getActivityColor() }]}
              >
                {community.activityLevel}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <Button
            mode={community.isJoined ? "outlined" : "contained"}
            onPress={() => console.log("Community action:", community.id)}
            style={styles.actionButton}
            buttonColor={community.isJoined ? "transparent" : COLORS.PRIMARY}
            textColor={community.isJoined ? COLORS.PRIMARY : COLORS.TEXT_WHITE}
          >
            {community.isJoined ? "Joined" : "Join Community"}
          </Button>
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
  searchContainer: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchBar: {
    backgroundColor: COLORS.BACKGROUND,
    elevation: 0,
    height: 40,
  },
  searchInput: {
    fontSize: 13,
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
  communitiesList: {
    flex: 1,
  },
  communitiesContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  communityCard: {
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
    alignItems: "center",
    marginBottom: 10,
  },
  communityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
    marginTop: 2,
  },
  communityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  communityDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    flex: 1,
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
  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
  },
  activityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionButton: {
    borderRadius: 6,
    minHeight: 40,
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
