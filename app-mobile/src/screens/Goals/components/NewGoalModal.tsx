// src/screens/Goals/components/NewGoalModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Text, TextInput, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";

interface NewGoalModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (goalData: NewGoalData) => void;
  onNavigateToChat?: (goalData: NewGoalData) => void;
}

export interface NewGoalData {
  coachName: string;
  title: string;
}

export default function NewGoalModal({
  visible,
  onDismiss,
  onSave,
  onNavigateToChat,
}: NewGoalModalProps) {
  const [coachName, setCoachName] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Animated values for pulsing dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.6)).current;
  const dot3Opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGenerating) {
      // Create pulsing animation
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.6,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isGenerating, dot1Opacity, dot2Opacity, dot3Opacity]);

  const handleSave = async () => {
    if (!coachName.trim() || !title.trim()) {
      return;
    }

    // Show AI generation animation
    setIsGenerating(true);

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const goalData: NewGoalData = {
      coachName: coachName.trim(),
      title: title.trim(),
    };

    // Save and navigate to chat screen while animation is still showing
    onSave(goalData);

    if (onNavigateToChat) {
      onNavigateToChat(goalData);
    }

    // Small delay to ensure navigation starts, then clean up
    setTimeout(() => {
      setIsGenerating(false);
      resetForm();
    }, 100);
  };

  const resetForm = () => {
    setCoachName("");
    setTitle("");
    setIsGenerating(false);
  };

  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  if (!visible && !isGenerating) return null;

  return (
    <>
      <Modal
        visible={visible && !isGenerating}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel}>
          <View style={styles.container}>
            <Pressable style={styles.sheetContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.sheet}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                      name="target-account"
                      size={24}
                      color={COLORS.PRIMARY}
                    />
                    <Text style={styles.headerTitle}>Create New Goal</Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={handleCancel}
                    iconColor={COLORS.TEXT_SECONDARY}
                  />
                </View>

                {/* Form Content */}
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Coach Name */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Coach Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder="Enter your coach's name"
                      value={coachName}
                      onChangeText={setCoachName}
                      style={styles.input}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                    />
                  </View>

                  {/* Goal Title */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Your Goal <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder="What do you want to achieve?"
                      value={title}
                      onChangeText={setTitle}
                      style={styles.input}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* AI Info */}
                  <View style={styles.aiInfo}>
                    <MaterialCommunityIcons
                      name="creation"
                      size={20}
                      color={COLORS.SECONDARY}
                    />
                    <Text style={styles.aiInfoText}>
                      AI will generate category, priority, milestones & coaching
                      plan
                    </Text>
                  </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={styles.btnCancel}
                    textColor={COLORS.TEXT_SECONDARY}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.btnSave}
                    buttonColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT_WHITE}
                    disabled={!coachName.trim() || !title.trim() || isGenerating}
                    loading={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Create Goal"}
                  </Button>
                </View>
              </KeyboardAvoidingView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Full Screen AI Generating Modal */}
      {isGenerating && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
          statusBarTranslucent
        >
          <View style={styles.fullScreenOverlay}>
            <View style={styles.generatingContent}>
              <MaterialCommunityIcons
                name="creation"
                size={64}
                color={COLORS.PRIMARY}
                style={styles.generatingIcon}
              />
              <Text style={styles.generatingTitle}>
                AI is generating your goal...
              </Text>
              <Text style={styles.generatingSubtitle}>
                Creating category, milestones & coaching plan
              </Text>
              <View style={styles.dotsContainer}>
                <Animated.View
                  style={[styles.dot, { opacity: dot1Opacity }]}
                />
                <Animated.View
                  style={[styles.dot, { opacity: dot2Opacity }]}
                />
                <Animated.View
                  style={[styles.dot, { opacity: dot3Opacity }]}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "90%",
  },
  sheet: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: 500,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  required: {
    color: COLORS.DANGER,
  },
  input: {
    backgroundColor: COLORS.CARD,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  categories: {
    flexDirection: "row",
    gap: 8,
  },
  aiInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.SECONDARY + "10",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY + "30",
    marginBottom: 10,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  btnCancel: {
    flex: 1,
    borderColor: COLORS.BORDER,
  },
  btnSave: {
    flex: 1,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  generatingContent: {
    alignItems: "center",
    padding: 32,
  },
  generatingIcon: {
    marginBottom: 20,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: "center",
  },
  generatingSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
});
