// src/data/placeholderData.ts
// 📊 Sample data for development and testing

import { Goal, Update, Community, Call, User, Stats } from '../types';

// Current user
export const currentUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  totalGoals: 12,
  completedGoals: 5,
  currentStreak: 7,
  longestStreak: 21,
  joinDate: new Date('2024-01-01'),
};

// Sample goals
export const sampleGoals: Goal[] = [
  {
    id: '1',
    title: 'Run a Marathon',
    description: 'Complete my first full marathon in under 4 hours',
    category: 'Fitness',
    status: 'active',
    priority: 'high',
    progress: 65,
    startDate: new Date('2024-01-15'),
    targetDate: new Date('2024-06-30'),
    streak: 7,
    tasks: [],
    milestones: [],
    tags: ['running', 'endurance', 'health'],
    aiCoachingEnabled: true,
  },
  {
    id: '2',
    title: 'Learn React Native',
    description: 'Build 3 mobile apps using React Native',
    category: 'Learning',
    status: 'active',
    priority: 'high',
    progress: 45,
    startDate: new Date('2024-02-01'),
    targetDate: new Date('2024-08-01'),
    streak: 12,
    tasks: [],
    milestones: [],
    tags: ['coding', 'mobile', 'career'],
    aiCoachingEnabled: true,
  },
  {
    id: '3',
    title: 'Save $10,000',
    description: 'Build emergency fund for financial security',
    category: 'Finance',
    status: 'active',
    priority: 'medium',
    progress: 80,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-12-31'),
    streak: 30,
    tasks: [],
    milestones: [],
    tags: ['savings', 'financial-security'],
    aiCoachingEnabled: false,
  },
  {
    id: '4',
    title: 'Read 24 Books',
    description: 'Read 2 books per month throughout the year',
    category: 'Personal',
    status: 'active',
    priority: 'low',
    progress: 33,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-12-31'),
    streak: 5,
    tasks: [],
    milestones: [],
    tags: ['reading', 'self-improvement'],
    aiCoachingEnabled: true,
  },
  {
    id: '5',
    title: 'Get Promoted to Senior Dev',
    description: 'Achieve senior developer position with 20% raise',
    category: 'Career',
    status: 'active',
    priority: 'high',
    progress: 55,
    startDate: new Date('2024-03-01'),
    targetDate: new Date('2024-12-31'),
    streak: 15,
    tasks: [],
    milestones: [],
    tags: ['career', 'promotion', 'skills'],
    aiCoachingEnabled: true,
  },
  {
    id: '6',
    title: 'Morning Meditation Habit',
    description: 'Meditate for 10 minutes every morning',
    category: 'Health',
    status: 'completed',
    priority: 'medium',
    progress: 100,
    startDate: new Date('2023-11-01'),
    targetDate: new Date('2024-02-01'),
    streak: 90,
    tasks: [],
    milestones: [],
    tags: ['meditation', 'mindfulness', 'wellness'],
    aiCoachingEnabled: false,
  },
];

// Sample updates/notifications
export const sampleUpdates: Update[] = [
  {
    id: '1',
    type: 'achievement',
    title: 'Streak Milestone!',
    message: 'You have maintained a 7-day streak on "Run a Marathon"! Keep it up!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    relatedGoalId: '1',
    icon: 'fire',
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Upcoming Coaching Call',
    message: 'Your coaching session with Sarah starts in 30 minutes',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    read: false,
    icon: 'video',
  },
  {
    id: '3',
    type: 'progress',
    title: 'Goal Progress Update',
    message: 'You have reached 80% on "Save $10,000". Almost there!',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    relatedGoalId: '3',
    icon: 'chart-line',
  },
  {
    id: '4',
    type: 'community',
    title: 'New Post in Fitness Community',
    message: 'John shared tips about marathon training',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    relatedCommunityId: '1',
    icon: 'account-group',
  },
  {
    id: '5',
    type: 'achievement',
    title: 'Goal Completed!',
    message: 'Congratulations! You completed "Morning Meditation Habit"',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    read: true,
    relatedGoalId: '6',
    icon: 'trophy',
  },
];

// Sample communities
export const sampleCommunities: Community[] = [
  {
    id: '1',
    name: 'Marathon Runners',
    description: 'Community for aspiring and experienced marathon runners',
    category: 'Fitness',
    memberCount: 1243,
    isJoined: true,
    activityLevel: 'high',
    tags: ['running', 'marathon', 'fitness'],
  },
  {
    id: '2',
    name: 'React Native Developers',
    description: 'Learn and share React Native development tips',
    category: 'Learning',
    memberCount: 5821,
    isJoined: true,
    activityLevel: 'high',
    tags: ['coding', 'react-native', 'mobile'],
  },
  {
    id: '3',
    name: 'Financial Freedom',
    description: 'Achieve financial independence together',
    category: 'Finance',
    memberCount: 3456,
    isJoined: false,
    activityLevel: 'medium',
    tags: ['finance', 'savings', 'investing'],
  },
  {
    id: '4',
    name: 'Book Club 2024',
    description: 'Monthly book discussions and reading challenges',
    category: 'Personal',
    memberCount: 892,
    isJoined: false,
    activityLevel: 'medium',
    tags: ['reading', 'books', 'discussion'],
  },
  {
    id: '5',
    name: 'Career Growth Network',
    description: 'Professional development and career advancement',
    category: 'Career',
    memberCount: 2156,
    isJoined: true,
    activityLevel: 'high',
    tags: ['career', 'networking', 'growth'],
  },
  {
    id: '6',
    name: 'Mindfulness & Wellness',
    description: 'Daily meditation and wellness practices',
    category: 'Health',
    memberCount: 1789,
    isJoined: false,
    activityLevel: 'low',
    tags: ['meditation', 'wellness', 'health'],
  },
];

// Sample calls
export const sampleCalls: Call[] = [
  {
    id: '1',
    title: 'Weekly Coaching Session',
    description: 'Review progress on marathon training plan',
    participantName: 'Sarah Johnson',
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
    duration: 30,
    status: 'upcoming',
    type: 'coaching',
    meetingLink: 'https://meet.example.com/coaching-123',
  },
  {
    id: '2',
    title: 'Accountability Check-in',
    description: 'Monthly goal review with accountability partner',
    participantName: 'Mike Chen',
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    duration: 20,
    status: 'upcoming',
    type: 'accountability',
    meetingLink: 'https://meet.example.com/check-in-456',
  },
  {
    id: '3',
    title: 'React Native Study Group',
    description: 'Weekly group learning session',
    participantName: 'Dev Community',
    scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    duration: 60,
    status: 'upcoming',
    type: 'group',
    meetingLink: 'https://meet.example.com/study-group-789',
  },
  {
    id: '4',
    title: 'Goal Planning Session',
    description: 'Q2 goal planning with coach',
    participantName: 'Sarah Johnson',
    scheduledTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    duration: 45,
    status: 'completed',
    type: 'coaching',
  },
];

// User stats
export const userStats: Stats = {
  totalGoals: 12,
  activeGoals: 5,
  completedGoals: 6,
  archivedGoals: 1,
  averageProgress: 55,
  currentStreak: 7,
  totalTasksCompleted: 142,
};
