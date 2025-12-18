// src/screens/Chat/ChatConversationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, IconButton, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

type ConversationMode = 'CONVERSATION' | 'PLAN_SCREEN';

interface ChatConversationScreenProps {
  route: {
    params: {
      coachName?: string;
      goalText?: string;
      plan?: any;
      mode: ConversationMode;
    };
  };
  navigation: any;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatConversationScreen({
  route,
  navigation,
}: ChatConversationScreenProps) {
  const { coachName, goalText, plan, mode } = route.params;

  // Initial message based on mode
  const getInitialMessage = (): Message => {
    if (mode === 'CONVERSATION') {
      return {
        id: '1',
        text: `Hi! I'm ${coachName}, your AI coach. I'm excited to help you achieve: "${goalText}". Let me ask you a few questions so I can create the perfect plan for you.\n\nFirst, what's your current experience level with this goal?`,
        isUser: false,
        timestamp: new Date(),
      };
    } else {
      // PLAN_SCREEN mode
      return {
        id: '1',
        text: `Hey! You're doing great with "${plan?.title}". How can I help you today?`,
        isUser: false,
        timestamp: new Date(),
      };
    }
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [inputText, setInputText] = useState('');
  const [showFinalize, setShowFinalize] = useState(false);
  const [conversationRound, setConversationRound] = useState(1);
  const [viewMode, setViewMode] = useState<'chat' | 'plan'>('chat'); // Toggle between chat and plan view

  // For PLAN_SCREEN mode, always show toggle. For CONVERSATION mode, show after data collection
  const canShowToggle = mode === 'PLAN_SCREEN' || conversationRound >= 2;

  // Get the current plan to display (either from params or mock for conversation mode)
  const currentPlanToShow = mode === 'PLAN_SCREEN' ? plan : {
    title: goalText,
    coachName: coachName,
    steps: [
      { id: '1', title: 'Get proper running shoes', duration: '1 day', completed: false },
      { id: '2', title: 'Start with 2km runs, 3 times a week', duration: '2 weeks', completed: false },
      { id: '3', title: 'Gradually increase to 5km runs', duration: '3 weeks', completed: false },
      { id: '4', title: 'Build endurance with 10km runs', duration: '4 weeks', completed: false },
      { id: '5', title: 'Practice half-marathon distance', duration: '6 weeks', completed: false },
      { id: '6', title: 'Complete marathon training plan', duration: '8 weeks', completed: false },
    ],
    totalDuration: '24 weeks',
    progress: 0,
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(newMessage.text);
      setMessages((prev) => [...prev, aiResponse]);

      // After a few rounds, ask if ready to finalize
      if (mode === 'CONVERSATION' && conversationRound >= 2) {
        setTimeout(() => {
          setShowFinalize(true);
        }, 500);
      }
      setConversationRound((prev) => prev + 1);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    if (mode === 'PLAN_SCREEN') {
      // Check if user is confirming to generate plan
      const confirmationKeywords = ['ok', 'okay', 'yes', 'sure', 'sounds good', 'looks good', 'perfect', 'great', 'do it', 'go ahead', 'proceed', 'generate'];
      const isConfirming = confirmationKeywords.some(keyword => lowerMessage.includes(keyword));

      if (isConfirming && messages.length > 2) {
        // User is confirming, trigger plan generation
        setTimeout(() => {
          navigation.navigate('Generating', {
            planData: {
              plan,
              modifications: messages,
            },
            isUpdate: true,
          });
        }, 1500);

        return {
          id: (Date.now() + 1).toString(),
          text: 'Perfect! Let me generate your updated plan with these changes...',
          isUser: false,
          timestamp: new Date(),
        };
      }

      // Handle plan modification requests
      if (
        lowerMessage.includes('skip') ||
        lowerMessage.includes('boring') ||
        lowerMessage.includes('remove')
      ) {
        return {
          id: (Date.now() + 1).toString(),
          text: 'I understand you want to adjust your plan. Let me recalculate the remaining steps to better fit your needs. Just say "okay" when you\'re ready and I\'ll generate the updated plan!',
          isUser: false,
          timestamp: new Date(),
        };
      } else if (lowerMessage.includes('change') || lowerMessage.includes('adjust')) {
        return {
          id: (Date.now() + 1).toString(),
          text: 'Great! Tell me what changes you\'d like to make, and I\'ll adjust the plan accordingly. When you\'re satisfied, just say "okay"!',
          isUser: false,
          timestamp: new Date(),
        };
      } else {
        return {
          id: (Date.now() + 1).toString(),
          text: 'That\'s a great question! I\'m here to support you. What specific help do you need?',
          isUser: false,
          timestamp: new Date(),
        };
      }
    } else {
      // CONVERSATION mode - collecting data
      if (conversationRound === 1) {
        return {
          id: (Date.now() + 1).toString(),
          text: 'Perfect! Now, how much time can you dedicate to this goal each week?',
          isUser: false,
          timestamp: new Date(),
        };
      } else if (conversationRound === 2) {
        return {
          id: (Date.now() + 1).toString(),
          text: 'Excellent! One more thing - when would you like to achieve this goal by?',
          isUser: false,
          timestamp: new Date(),
        };
      } else {
        return {
          id: (Date.now() + 1).toString(),
          text: 'That sounds perfect! I think I have enough information to create an amazing plan for you.',
          isUser: false,
          timestamp: new Date(),
        };
      }
    }
  };

  const handleFinalizePlan = () => {
    // Navigate to Generating screen
    navigation.navigate('Generating', {
      planData: {
        coachName,
        goalText,
        conversationData: messages,
      },
      isUpdate: false,
    });
  };

  const handleContinueConversation = () => {
    setShowFinalize(false);
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: 'Sure! What else would you like to tell me about your goal?',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([...messages, aiMessage]);
  };

  const handleModifyPlan = () => {
    if (!inputText.trim()) {
      // If no message typed, just navigate to generating with existing modifications
      navigation.navigate('Generating', {
        planData: {
          plan,
          modifications: messages,
        },
        isUpdate: true,
      });
    } else {
      // Send the message first, then navigate
      handleSend();
      setTimeout(() => {
        navigation.navigate('Generating', {
          planData: {
            plan,
            modifications: messages,
          },
          isUpdate: true,
        });
      }, 1500);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          iconColor={COLORS.TEXT_WHITE}
        />
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="robot"
            size={24}
            color={COLORS.TEXT_WHITE}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {mode === 'CONVERSATION' ? coachName : plan?.coachName}
            </Text>
            <Text style={styles.headerSubtitle}>AI Coach</Text>
          </View>
        </View>
        {canShowToggle && (
          <IconButton
            icon={viewMode === 'chat' ? 'format-list-bulleted' : 'chat'}
            size={24}
            onPress={() => setViewMode(viewMode === 'chat' ? 'plan' : 'chat')}
            iconColor={COLORS.TEXT_WHITE}
          />
        )}
      </View>

      {/* Messages or Plan View */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {viewMode === 'chat' ? (
          // Chat Messages View
          <>
            {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {!message.isUser && (
              <MaterialCommunityIcons
                name="robot"
                size={20}
                color={COLORS.SECONDARY}
                style={styles.messageIcon}
              />
            )}
            <View
              style={[
                styles.messageContent,
                message.isUser
                  ? styles.userMessageContent
                  : styles.aiMessageContent,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.isUser ? styles.userMessageTime : styles.aiMessageTime,
                ]}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
            ))}

            {/* Finalize Prompt in Chat View */}
            {showFinalize && mode === 'CONVERSATION' && (
              <View style={styles.finalizeContainer}>
                <Text style={styles.finalizeText}>
                  All data collected. Shall we finalize the plan?
                </Text>
                <View style={styles.finalizeButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleContinueConversation}
                    style={styles.finalizeButton}
                    textColor={COLORS.PRIMARY}
                  >
                    No, Continue
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleFinalizePlan}
                    style={styles.finalizeButton}
                    buttonColor={COLORS.SUCCESS}
                  >
                    Yes, Generate Plan
                  </Button>
                </View>
              </View>
            )}
          </>
        ) : (
          // Current Plan Detail View
          <View style={styles.planDetailContainer}>
            <View style={styles.planDetailHeader}>
              <MaterialCommunityIcons
                name="target"
                size={32}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.planDetailTitle}>{currentPlanToShow.title}</Text>
              <Text style={styles.planDetailSubtitle}>
                by {currentPlanToShow.coachName}
              </Text>
            </View>

            <View style={styles.planDetailContent}>
              <View style={styles.planDetailInfo}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.planDetailDuration}>
                  Duration: {currentPlanToShow.totalDuration}
                </Text>
              </View>

              {currentPlanToShow.progress !== undefined && (
                <View style={styles.planDetailProgress}>
                  <Text style={styles.planDetailProgressText}>
                    Progress: {currentPlanToShow.progress}%
                  </Text>
                  <ProgressBar
                    progress={currentPlanToShow.progress / 100}
                    color={COLORS.SUCCESS}
                    style={styles.planDetailProgressBar}
                  />
                </View>
              )}

              <Text style={styles.planDetailStepsTitle}>Action Steps</Text>
              {currentPlanToShow.steps?.map((step: any, index: number) => (
                <View key={step.id} style={styles.planDetailStep}>
                  <View
                    style={[
                      styles.planDetailStepNumber,
                      step.completed && styles.planDetailStepNumberCompleted,
                    ]}
                  >
                    {step.completed ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={COLORS.TEXT_WHITE}
                      />
                    ) : (
                      <Text style={styles.planDetailStepNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.planDetailStepContent}>
                    <Text
                      style={[
                        styles.planDetailStepText,
                        step.completed && styles.planDetailStepTextCompleted,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.planDetailStepDuration}>{step.duration}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={step.completed ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={step.completed ? COLORS.SUCCESS : COLORS.TEXT_TERTIARY}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder={mode === 'PLAN_SCREEN' ? "Tell me what to change, or say 'okay' to generate..." : "Type your message..."}
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          outlineColor={COLORS.BORDER}
          activeOutlineColor={COLORS.PRIMARY}
          multiline
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!inputText.trim()}
              color={inputText.trim() ? COLORS.PRIMARY : COLORS.TEXT_TERTIARY}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.TEXT_WHITE,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  userMessage: {
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    flexDirection: 'row',
  },
  messageIcon: {
    marginTop: 4,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userMessageContent: {
    backgroundColor: COLORS.PRIMARY,
  },
  aiMessageContent: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: COLORS.TEXT_WHITE,
  },
  aiMessageText: {
    color: COLORS.TEXT_PRIMARY,
  },
  messageTime: {
    fontSize: 11,
  },
  userMessageTime: {
    color: COLORS.TEXT_WHITE,
    opacity: 0.7,
    textAlign: 'right',
  },
  aiMessageTime: {
    color: COLORS.TEXT_SECONDARY,
  },
  finalizeContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  planDetailContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  planDetailHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.CARD,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  planDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  planDetailSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  planDetailContent: {
    paddingHorizontal: 16,
  },
  planDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  planDetailDuration: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  planDetailProgress: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  planDetailProgressText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  planDetailProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.BORDER,
  },
  planDetailStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  planDetailStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: COLORS.CARD,
    padding: 12,
    borderRadius: 12,
  },
  planDetailStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDetailStepNumberCompleted: {
    backgroundColor: COLORS.SUCCESS,
  },
  planDetailStepNumberText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_WHITE,
  },
  planDetailStepContent: {
    flex: 1,
  },
  planDetailStepText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  planDetailStepTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_SECONDARY,
  },
  planDetailStepDuration: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  finalizeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  finalizeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  finalizeButton: {
    flex: 1,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  input: {
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 15,
    maxHeight: 100,
    marginBottom: 8,
  },
  modifyButton: {
    marginTop: 4,
  },
});
