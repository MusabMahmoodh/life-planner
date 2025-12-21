// src/screens/Chat/ChatConversationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Text, TextInput, IconButton, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useSendMessage, useChatHistory } from '../../hooks/useChat';

interface ChatConversationScreenProps {
  route: {
    params: {
      goalId: string;
      coachName: string;
      goalText: string;
      mode?: string;
      plan?: any;
    };
  };
  navigation: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ChatConversationScreen({
  route,
  navigation,
}: ChatConversationScreenProps) {
  const { goalId, coachName, goalText } = route.params;

  console.log(`[${new Date().toISOString()}] ChatConversationScreen MOUNTED`);

  const [messages, setMessages] = useState<Message[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessageMutation = useSendMessage();
  const { data: chatHistory, isLoading: isLoadingHistory } = useChatHistory(goalId);

  // Load chat history when component mounts
  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory.messages || []);
      setWelcomeMessage(chatHistory.welcome_message || '');
    }
  }, [chatHistory]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');

    // Send message to API
    sendMessageMutation.mutate(
      { goalId, message: messageToSend },
      {
        onSuccess: (data) => {
          // Add AI response to messages
          const aiMessage: Message = {
            role: 'assistant',
            content: data.message,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Check if plan is ready
          if (data.plan_ready || data.flag === 'PLAN_SCREEN') {
            // Navigate to plan confirmation screen after a short delay
            setTimeout(() => {
              navigation.replace('PlanConfirmation', {
                goalId,
                plan: data.plan_data,
                coachName,
                goalText,
              });
            }, 1000);
          }
        },
        onError: (error: any) => {
          // Add error message
          const errorMessage: Message = {
            role: 'assistant',
            content: `Sorry, something went wrong: ${error.message}. Please try again.`,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={COLORS.TEXT_PRIMARY}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <View style={styles.headerContent}>
            <View style={styles.coachAvatar}>
              <MaterialCommunityIcons name="robot" size={24} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{coachName}</Text>
              <Text style={styles.headerSubtitle}>AI Coach</Text>
            </View>
          </View>
        </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Loading indicator */}
        {isLoadingHistory && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        )}

        {/* Welcome Message */}
        {!isLoadingHistory && welcomeMessage && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiIcon}>
              <MaterialCommunityIcons
                name="robot"
                size={16}
                color={COLORS.PRIMARY}
              />
            </View>
            <View style={[styles.messageContent, styles.aiMessageContent, styles.welcomeMessageContent]}>
              <Text style={[styles.messageText, styles.aiMessageText]}>
                {welcomeMessage}
              </Text>
            </View>
          </View>
        )}

        {!isLoadingHistory && messages.map((message, index) => (
          <View
            key={`${message.created_at}-${index}`}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.aiIcon}>
                <MaterialCommunityIcons
                  name="robot"
                  size={16}
                  color={COLORS.PRIMARY}
                />
              </View>
            )}
            <View
              style={[
                styles.messageContent,
                message.role === 'user'
                  ? styles.userMessageContent
                  : styles.aiMessageContent,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user'
                    ? styles.userMessageText
                    : styles.aiMessageText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading indicator */}
        {sendMessageMutation.isPending && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiIcon}>
              <MaterialCommunityIcons
                name="robot"
                size={16}
                color={COLORS.PRIMARY}
              />
            </View>
            <View style={[styles.messageContent, styles.aiMessageContent]}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          mode="outlined"
          outlineColor={COLORS.BORDER}
          activeOutlineColor={COLORS.PRIMARY}
          disabled={sendMessageMutation.isPending}
        />
        <IconButton
          icon="send"
          iconColor={COLORS.TEXT_WHITE}
          size={24}
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessageMutation.isPending}
          style={[
            styles.sendButton,
            (!inputText.trim() || sendMessageMutation.isPending) &&
              styles.sendButtonDisabled,
          ]}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.CARD,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    minHeight: 60,
  },
  backButton: {
    margin: 0,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageContent: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: COLORS.CARD,
    borderBottomLeftRadius: 4,
  },
  welcomeMessageContent: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.TEXT_WHITE,
  },
  aiMessageText: {
    color: COLORS.TEXT_PRIMARY,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    margin: 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.TEXT_TERTIARY,
    opacity: 0.5,
  },
});
