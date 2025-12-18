// src/screens/CreatePlan/CreatePlanScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface CreatePlanScreenProps {
  navigation: any;
}

export default function CreatePlanScreen({ navigation }: CreatePlanScreenProps) {
  const [coachName, setCoachName] = useState('');
  const [goalText, setGoalText] = useState('');

  const handleContinue = () => {
    if (!coachName.trim() || !goalText.trim()) return;

    // Navigate to same ChatFromPlan screen used for existing plans
    navigation.navigate('ChatFromPlan', {
      coachName: coachName.trim(),
      goalText: goalText.trim(),
      mode: 'CONVERSATION',
      plan: null, // No existing plan, creating new one
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="robot"
            size={64}
            color={COLORS.PRIMARY}
          />
          <Text style={styles.title}>Let's Create Your Plan</Text>
          <Text style={styles.subtitle}>
            Tell me about your goal and I'll help you achieve it
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <TextInput
            mode="outlined"
            label="Coach Name"
            placeholder="e.g., Alex, Sarah, Coach Mike"
            value={coachName}
            onChangeText={setCoachName}
            style={styles.input}
            outlineColor={COLORS.BORDER}
            activeOutlineColor={COLORS.PRIMARY}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            mode="outlined"
            label="What do you want to achieve?"
            placeholder="e.g., Run a marathon, Learn Spanish, Start a business"
            value={goalText}
            onChangeText={setGoalText}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            outlineColor={COLORS.BORDER}
            activeOutlineColor={COLORS.PRIMARY}
            left={<TextInput.Icon icon="target" />}
          />

          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!coachName.trim() || !goalText.trim()}
            style={styles.continueButton}
            buttonColor={COLORS.PRIMARY}
            textColor={COLORS.TEXT_WHITE}
            icon="arrow-right"
            contentStyle={styles.buttonContent}
          >
            Continue to Chat
          </Button>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color={COLORS.TEXT_SECONDARY}
          />
          <Text style={styles.infoText}>
            Your AI coach will ask clarifying questions to create the perfect plan for you
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.CARD,
  },
  textArea: {
    minHeight: 120,
  },
  continueButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});
