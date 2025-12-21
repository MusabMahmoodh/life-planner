// src/screens/Profile/ProfileScreen.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Avatar, List, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../providers/AuthProvider';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Get initials from email
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={getInitials(user?.email || 'U')}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <Text style={styles.name}>{user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Account Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account</Text>

          <List.Item
            title="Email"
            description={user?.email}
            left={props => <List.Icon {...props} icon="email-outline" color={COLORS.PRIMARY} />}
            style={styles.listItem}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="User ID"
            description={user?.id}
            left={props => <List.Icon {...props} icon="account-outline" color={COLORS.PRIMARY} />}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Settings Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity>
            <List.Item
              title="Notifications"
              description="Manage notification preferences"
              left={props => <List.Icon {...props} icon="bell-outline" color={COLORS.PRIMARY} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity>
            <List.Item
              title="Privacy"
              description="Manage your privacy settings"
              left={props => <List.Icon {...props} icon="shield-account-outline" color={COLORS.PRIMARY} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* About Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity>
            <List.Item
              title="Help & Support"
              left={props => <List.Icon {...props} icon="help-circle-outline" color={COLORS.PRIMARY} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity>
            <List.Item
              title="Terms & Privacy Policy"
              left={props => <List.Icon {...props} icon="file-document-outline" color={COLORS.PRIMARY} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
            />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information-outline" color={COLORS.PRIMARY} />}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={COLORS.DANGER}
        textColor={COLORS.TEXT_WHITE}
        icon="logout"
      >
        Logout
      </Button>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  avatar: {
    backgroundColor: COLORS.PRIMARY,
    marginBottom: 16,
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.CARD,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: COLORS.DIVIDER,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 6,
  },
  bottomSpacer: {
    height: 32,
  },
});
