// src/screens/PlanDetail/components/QuickChangesModal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

interface QuickChangesModalProps {
  visible: boolean;
  onDismiss: () => void;
  onGenerate: (changes: string) => void;
  planTitle: string;
}

export default function QuickChangesModal({
  visible,
  onDismiss,
  onGenerate,
  planTitle,
}: QuickChangesModalProps) {
  const [changesText, setChangesText] = useState('');

  const handleGenerate = () => {
    if (changesText.trim()) {
      onGenerate(changesText.trim());
      setChangesText('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={24}
                color={COLORS.SECONDARY}
              />
              <Text style={styles.headerTitle}>Quick Changes</Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor={COLORS.TEXT_PRIMARY}
            />
          </View>

          {/* Plan Info */}
          <View style={styles.planInfo}>
            <Text style={styles.planInfoLabel}>Refining plan:</Text>
            <Text style={styles.planTitle}>{planTitle}</Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>What would you like to change?</Text>
            <TextInput
              mode="outlined"
              placeholder="E.g., Skip the next 3 steps, make it faster, adjust timeline..."
              value={changesText}
              onChangeText={setChangesText}
              multiline
              numberOfLines={6}
              style={styles.input}
              outlineColor={COLORS.BORDER}
              activeOutlineColor={COLORS.PRIMARY}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
              textColor={COLORS.TEXT_PRIMARY}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleGenerate}
              disabled={!changesText.trim()}
              style={styles.generateButton}
              buttonColor={COLORS.SUCCESS}
              icon="auto-fix"
            >
              Generate Updated Plan
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  planInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  planInfoLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.CARD,
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.BORDER,
  },
  generateButton: {
    flex: 2,
  },
});
