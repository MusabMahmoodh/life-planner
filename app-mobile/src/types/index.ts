// src/types/index.ts
// 📝 TypeScript type definitions for the Smart AI Planner app

export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalCategory = 'Fitness' | 'Career' | 'Health' | 'Personal' | 'Finance' | 'Education' | 'Learning';
export type Priority = 'low' | 'medium' | 'high';
export type UpdateType = 'progress' | 'achievement' | 'reminder' | 'community' | 'call';
export type CallStatus = 'upcoming' | 'completed' | 'cancelled';

// Goal type
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: Priority;
  progress: number; // 0-100
  startDate: Date;
  targetDate: Date;
  streak: number; // Days streak
  tasks: Task[];
  milestones: Milestone[];
  tags: string[];
  aiCoachingEnabled: boolean;
}

// Task type
export interface Task {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority: Priority;
}

// Milestone type
export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: Date;
  completed: boolean;
  progress: number;
}

// Update/Notification type
export interface Update {
  id: string;
  type: UpdateType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  relatedGoalId?: string;
  relatedCommunityId?: string;
  icon?: string;
}

// Community type
export interface Community {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  memberCount: number;
  imageUrl?: string;
  isJoined: boolean;
  activityLevel: 'low' | 'medium' | 'high';
  tags: string[];
}

// Call type
export interface Call {
  id: string;
  title: string;
  description: string;
  participantName: string;
  participantAvatar?: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: CallStatus;
  type: 'coaching' | 'accountability' | 'group';
  meetingLink?: string;
}

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalGoals: number;
  completedGoals: number;
  currentStreak: number;
  longestStreak: number;
  joinDate: Date;
}

// Stats type
export interface Stats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  averageProgress: number;
  currentStreak: number;
  totalTasksCompleted: number;
}

// Navigation types
export type RootTabParamList = {
  Goals: undefined;
  Updates: undefined;
  Communities: undefined;
  Calls: undefined;
};

export type GoalTabType = 'active' | 'all' | 'completed' | 'archived';

// 🎯 Flow-Based Plan Types
export type ConversationMode = 'CONVERSATION' | 'PLAN_SCREEN';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'paused';

// Plan Step type
export interface PlanStep {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  order: number;
}

// Plan type (Flow-based structure)
export interface Plan {
  id: string;
  title: string;
  coachName: string;
  category: string;
  status: PlanStatus;
  steps: PlanStep[];
  totalDuration: string;
  progress: number; // 0-100
  streak: number;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Message type
export interface ConversationMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Plan Modification Request type
export interface PlanModificationRequest {
  planId: string;
  modificationType: 'skip_steps' | 'adjust_timeline' | 'change_steps' | 'general';
  details: string;
  affectedStepIds?: string[];
}
