// src/screens/Auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useRegister } from '../../hooks/useAuth';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const registerMutation = useRegister();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      setSnackbarVisible(true);
      return;
    }

    if (password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters');
      setSnackbarVisible(true);
      return;
    }

    registerMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setSnackbarMessage('Registration successful! Please check your email to verify your account.');
          setSnackbarVisible(true);

          // Navigate back to login after 2 seconds
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2000);
        },
        onError: (error: any) => {
          setSnackbarMessage(error.message || 'Registration failed. Please try again.');
          setSnackbarVisible(true);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="account-plus"
              size={80}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.appTitle}>Create Account</Text>
            <Text style={styles.appSubtitle}>Join us to start achieving your goals</Text>
          </View>

          {/* Register Form */}
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

            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              outlineColor={COLORS.BORDER}
              activeOutlineColor={COLORS.PRIMARY}
              left={<TextInput.Icon icon="lock-check-outline" />}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={registerMutation.isPending}
              disabled={!email || !password || !confirmPassword || registerMutation.isPending}
              style={styles.registerButton}
              buttonColor={COLORS.PRIMARY}
              textColor={COLORS.TEXT_WHITE}
            >
              Create Account
            </Button>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              textColor={COLORS.PRIMARY}
              compact
            >
              Login
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Snackbar for messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
  registerButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
