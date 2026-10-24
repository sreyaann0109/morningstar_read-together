import { PursuitPlan, SharingPost, Companion, UserProfile, ThematicMember, AppNotification } from '../types';

export const demoUsers: UserProfile[] = [
  {
    id: 'user-admin',
    name: '管理同工',
    email: 'admin@morningstar',
    password: 'sha256$fixedsaltforadmin111111$70bab25006d54c8cfe5a9be6dcb7035c7b938687a5077dc9125ddff6edd06a96',
    locality: '全召會服事處',
    streakDays: 0,
    totalChaptersRead: 0,
    totalSharesCount: 0,
    totalAmenReceived: 0,
    avatar: '🛡️',
    role: 'admin',
    joinedInviteCodes: [],
    sanctuary: {
      placedRelicIds: ['relic-sun', 'relic-shield', 'relic-scroll', 'relic-crown'],
      motto: '同那清心呼求主的人，竭力追求公義、信、愛、和平。',
      theme: 'dawn',
    },
  },
];

export const currentUser: UserProfile = demoUsers[0];

export const initialThematicMembers: ThematicMember[] = [];

export const initialPlans: PursuitPlan[] = [];

export const initialCompanions: Companion[] = [];

export const initialPosts: SharingPost[] = [];

export const initialNotifications: AppNotification[] = [];
