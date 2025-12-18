// src/screens/Chat/ChatScreen.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { NewGoalData } from "../Goals/components/NewGoalModal";

interface ChatScreenProps {
  route: {
    params: {
      goalData: NewGoalData;
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

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { goalData } = route.params;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi! I'm ${goalData.coachName}, your AI coach. I'm excited to help you achieve your goal: "${goalData.title}". Let's break this down into actionable steps. What aspect would you like to focus on first?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's a great point! Let me help you with that...",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
            <Text style={styles.headerTitle}>{goalData.coachName}</Text>
            <Text style={styles.headerSubtitle}>AI Coach</Text>
          </View>
        </View>
        <IconButton
          icon="dots-vertical"
          size={24}
          onPress={() => {}}
          iconColor={COLORS.TEXT_WHITE}
        />
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
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
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type your message..."
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingTop: Platform.OS === "ios" ? 50 : 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  userMessage: {
    flexDirection: "row-reverse",
  },
  aiMessage: {
    flexDirection: "row",
  },
  messageIcon: {
    marginTop: 4,
  },
  messageContent: {
    maxWidth: "75%",
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
    textAlign: "right",
  },
  aiMessageTime: {
    color: COLORS.TEXT_SECONDARY,
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
  },
});
