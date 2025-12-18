// src/screens/Home/HomeScreen.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const handleListAllPlans = () => {
    navigation.navigate('MainTabs');
  };

  const handleCreateNewPlan = () => {
    navigation.navigate('CreatePlan');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="target"
          size={60}
          color={COLORS.PRIMARY}
        />
        <Text style={styles.title}>AI Coach Planner</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* List All Plans Option */}
        <TouchableOpacity
          onPress={handleListAllPlans}
          activeOpacity={0.7}
        >
          <Card style={styles.optionCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={48}
                  color={COLORS.PRIMARY}
                />
              </View>
              <Text style={styles.optionTitle}>List All Plans</Text>
              <Text style={styles.optionDescription}>
                View and manage your existing plans
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* Create New Plan Option */}
        <TouchableOpacity
          onPress={handleCreateNewPlan}
          activeOpacity={0.7}
        >
          <Card style={styles.optionCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={48}
                  color={COLORS.SECONDARY}
                />
              </View>
              <Text style={styles.optionTitle}>Create New Plan</Text>
              <Text style={styles.optionDescription}>
                Start a new goal with AI coaching
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: COLORS.CARD,
    elevation: 4,
    borderRadius: 16,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
