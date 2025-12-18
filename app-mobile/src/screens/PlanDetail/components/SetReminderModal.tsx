// src/screens/PlanDetail/components/SetReminderModal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Modal, Portal, Text, Button, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

interface SetReminderModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSetReminder: (date: Date, message: string) => void;
  planTitle: string;
}

export default function SetReminderModal({
  visible,
  onDismiss,
  onSetReminder,
  planTitle,
}: SetReminderModalProps) {
  // Initialize to 1 hour from now by default
  const getDefaultReminderDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
  };

  const [reminderDate, setReminderDate] = useState(getDefaultReminderDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  const handleSetReminder = () => {
    const now = new Date();
    const minutesUntilReminder = Math.floor((reminderDate.getTime() - now.getTime()) / (1000 * 60));

    console.log('Setting reminder for:', reminderDate.toLocaleString());
    console.log('Minutes from now:', minutesUntilReminder);

    if (reminderDate > now && minutesUntilReminder > 0) {
      onSetReminder(reminderDate, reminderMessage);
      // Reset state
      setReminderMessage('');
      setReminderDate(getDefaultReminderDate());
    } else {
      console.log('Reminder date is in the past or too close');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Keep the current time when changing date
      const newDate = new Date(selectedDate);
      newDate.setHours(reminderDate.getHours());
      newDate.setMinutes(reminderDate.getMinutes());
      setReminderDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(reminderDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setReminderDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="bell-plus"
              size={32}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.title}>Set Reminder</Text>
            <Text style={styles.subtitle}>for {planTitle}</Text>
          </View>

          {/* Date/Time Selection */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Select Date</Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
              contentStyle={styles.dateButtonContent}
            >
              {formatDate(reminderDate)}
            </Button>
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Select Time</Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.dateButton}
              icon="clock-outline"
              contentStyle={styles.dateButtonContent}
            >
              {formatTime(reminderDate)}
            </Button>
          </View>

          {/* Optional Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.label}>Custom Message (Optional)</Text>
            <TextInput
              mode="outlined"
              placeholder="e.g., Time to work on your goal!"
              value={reminderMessage}
              onChangeText={setReminderMessage}
              multiline
              numberOfLines={3}
              style={styles.messageInput}
              outlineColor={COLORS.BORDER}
              activeOutlineColor={COLORS.PRIMARY}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
              textColor={COLORS.TEXT_SECONDARY}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSetReminder}
              style={styles.setButton}
              buttonColor={COLORS.PRIMARY}
              disabled={reminderDate <= new Date()}
            >
              Set Reminder
            </Button>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={reminderDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
  },
  content: {
    gap: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  dateTimeContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  dateButton: {
    borderColor: COLORS.BORDER,
  },
  dateButtonContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    gap: 8,
  },
  messageInput: {
    backgroundColor: COLORS.BACKGROUND,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.BORDER,
  },
  setButton: {
    flex: 1,
  },
});
