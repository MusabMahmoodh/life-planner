// src/screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    // Simulate login (in production, call your auth API)
    setTimeout(() => {
      setLoading(false);
      // Navigate directly to MainTabs (bottom navigation) after successful login
      navigation.replace('MainTabs');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="target"
            size={80}
            color={COLORS.PRIMARY}
          />
          <Text style={styles.appTitle}>AI Coach Planner</Text>
          <Text style={styles.appSubtitle}>Your personal goal achievement partner</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor={COLORS.BORDER}
            activeOutlineColor={COLORS.PRIMARY}
            left={<TextInput.Icon icon="email-outline" />}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            outlineColor={COLORS.BORDER}
            activeOutlineColor={COLORS.PRIMARY}
            left={<TextInput.Icon icon="lock-outline" />}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password || loading}
            style={styles.loginButton}
            buttonColor={COLORS.PRIMARY}
            textColor={COLORS.TEXT_WHITE}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => {}}
            style={styles.forgotButton}
            textColor={COLORS.PRIMARY}
          >
            Forgot Password?
          </Button>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Button
            mode="text"
            onPress={() => {}}
            textColor={COLORS.PRIMARY}
            compact
          >
            Sign Up
          </Button>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  appSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.CARD,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  forgotButton: {
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
