// src/screens/Calls/components/ScheduleCallModal.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, Chip, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";

interface ScheduleCallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (callData: NewCallData) => void;
}

export interface NewCallData {
  participantName: string;
  title: string;
  description: string;
  type: "coaching" | "accountability" | "group";
  scheduledTime: Date;
  duration: number;
  meetingLink: string;
}

const callTypes = [
  {
    value: "coaching",
    label: "Coaching",
    icon: "school",
    color: COLORS.PRIMARY,
  },
  {
    value: "accountability",
    label: "Accountability",
    icon: "account-check",
    color: COLORS.SECONDARY,
  },
  {
    value: "group",
    label: "Group Call",
    icon: "account-group",
    color: COLORS.ACCENT,
  },
];

const durations = [15, 30, 45, 60, 90, 120];

export default function ScheduleCallModal({
  visible,
  onDismiss,
  onSave,
}: ScheduleCallModalProps) {
  const [participantName, setParticipantName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [callType, setCallType] = useState<
    "coaching" | "accountability" | "group"
  >("coaching");
  const [duration, setDuration] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSave = () => {
    if (!participantName.trim() || !title.trim()) {
      return;
    }

    const callData: NewCallData = {
      participantName: participantName.trim(),
      title: title.trim(),
      description: description.trim(),
      type: callType,
      scheduledTime: selectedDate,
      duration,
      meetingLink: meetingLink.trim(),
    };

    onSave(callData);
    resetForm();
  };

  const resetForm = () => {
    setParticipantName("");
    setTitle("");
    setDescription("");
    setCallType("coaching");
    setDuration(30);
    setMeetingLink("");
    setSelectedDate(new Date());
  };

  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const adjustDateTime = (hours: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(newDate.getHours() + hours);
    setSelectedDate(newDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                      name="video-plus"
                      size={24}
                      color={COLORS.PRIMARY}
                    />
                    <Text style={styles.headerTitle}>Schedule Call</Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={handleCancel}
                    iconColor={COLORS.TEXT_SECONDARY}
                  />
                </View>

                {/* Form */}
                <ScrollView
                  style={styles.form}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Participant Name */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      Participant Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder="Who are you meeting with?"
                      value={participantName}
                      onChangeText={setParticipantName}
                      style={styles.input}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                      left={
                        <TextInput.Icon
                          icon="account"
                          color={COLORS.TEXT_SECONDARY}
                        />
                      }
                    />
                  </View>

                  {/* Call Title */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      Call Title <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder="What's this call about?"
                      value={title}
                      onChangeText={setTitle}
                      style={styles.input}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                      left={
                        <TextInput.Icon
                          icon="video"
                          color={COLORS.TEXT_SECONDARY}
                        />
                      }
                    />
                  </View>

                  {/* Call Type */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Call Type</Text>
                    <View style={styles.callTypesContainer}>
                      {callTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.callTypeButton,
                            callType === type.value &&
                              styles.callTypeButtonActive,
                            callType === type.value && {
                              backgroundColor: type.color + "20",
                              borderColor: type.color,
                            },
                          ]}
                          onPress={() =>
                            setCallType(
                              type.value as
                                | "coaching"
                                | "accountability"
                                | "group",
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            name={
                              type.icon as keyof typeof MaterialCommunityIcons.glyphMap
                            }
                            size={20}
                            color={
                              callType === type.value
                                ? type.color
                                : COLORS.TEXT_SECONDARY
                            }
                          />
                          <Text
                            style={[
                              styles.callTypeText,
                              callType === type.value && {
                                color: type.color,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Date and Time */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Date & Time</Text>
                    <View style={styles.dateTimeCard}>
                      <View style={styles.dateTimeDisplay}>
                        <MaterialCommunityIcons
                          name="calendar-clock"
                          size={20}
                          color={COLORS.PRIMARY}
                        />
                        <Text style={styles.dateTimeText}>
                          {formatDateTime(selectedDate)}
                        </Text>
                      </View>
                      <View style={styles.dateTimeButtons}>
                        <IconButton
                          icon="minus"
                          size={20}
                          onPress={() => adjustDateTime(-1)}
                          iconColor={COLORS.PRIMARY}
                          style={styles.dateTimeButton}
                        />
                        <Text style={styles.dateTimeLabel}>Hour</Text>
                        <IconButton
                          icon="plus"
                          size={20}
                          onPress={() => adjustDateTime(1)}
                          iconColor={COLORS.PRIMARY}
                          style={styles.dateTimeButton}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Duration */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Duration</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.durationContainer}
                    >
                      {durations.map((dur) => (
                        <Chip
                          key={dur}
                          selected={duration === dur}
                          onPress={() => setDuration(dur)}
                          style={[
                            styles.durationChip,
                            duration === dur && {
                              backgroundColor: COLORS.PRIMARY,
                            },
                          ]}
                          textStyle={[
                            styles.durationChipText,
                            duration === dur && {
                              color: COLORS.TEXT_WHITE,
                              fontWeight: "600",
                            },
                          ]}
                        >
                          {dur} min
                        </Chip>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Description */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="Add any notes or agenda items..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      style={[styles.input, styles.textArea]}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                    />
                  </View>

                  {/* Meeting Link */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Meeting Link</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="https://zoom.us/j/..."
                      value={meetingLink}
                      onChangeText={setMeetingLink}
                      style={styles.input}
                      outlineColor={COLORS.BORDER}
                      activeOutlineColor={COLORS.PRIMARY}
                      left={
                        <TextInput.Icon
                          icon="link"
                          color={COLORS.TEXT_SECONDARY}
                        />
                      }
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    textColor={COLORS.TEXT_SECONDARY}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.saveButton}
                    buttonColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT_WHITE}
                    disabled={!participantName.trim() || !title.trim()}
                  >
                    Schedule Call
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
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
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldContainer: {
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
  callTypesContainer: {
    gap: 10,
  },
  callTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  callTypeButtonActive: {
    borderWidth: 1.5,
  },
  callTypeText: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  dateTimeCard: {
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    gap: 12,
  },
  dateTimeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.TEXT_PRIMARY,
  },
  dateTimeButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateTimeButton: {
    margin: 0,
  },
  dateTimeLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  durationContainer: {
    flexDirection: "row",
  },
  durationChip: {
    marginRight: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  durationChipText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.BORDER,
  },
  saveButton: {
    flex: 1,
  },
});
