export type PlanCategory = 'life-study' | 'bible' | 'nt-half-year' | 'nt-speed-reading' | 'morning-revival' | 'spiritual-books' | 'custom';
export type UserRole = 'user' | 'admin';

export interface ThematicMember {
  userId: string;
  name: string;
  avatar: string;
  locality?: string;
  joinedAt: string;
  todayCompleted: boolean;
  lastCompletedDate?: string;
  streakDays: number;
  lastActive: string;
  encouragedToday?: boolean;
  completedUnits?: number;
  currentUnitTitle?: string;
  currentVerses?: string;
}

export interface PursuitPlan {
  id: string;
  title: string;
  category: PlanCategory;
  unitName?: string; // 追求篇目單位，如「篇」或「章」（聖經加註解預設為「章」）
  description: string;
  totalUnits: number;
  completedUnits: number;
  currentUnitTitle: string;
  currentVerses?: string;
  summary?: string;
  startDate?: string; // 開始追求日期 (例如：2026-10-01)
  endDate?: string; // 結束追求日期 (例如：2026-12-09)，新約速讀類別為必填
  speedDays?: number; // 速讀設定期程天數（例如 30, 60, 90, 120 天）
  inviteCode: string; // 6-Emoji 專屬邀請碼 (例如：✨🌱🕊️☀️📖🌿)
  adminId: string;
  adminName: string;
  members: ThematicMember[];
}

export interface Reaction {
  amenCount: number;
  prayCount?: number;
  userReactedAmen?: boolean;
  userReactedPray?: boolean;
  amenUserIds?: string[];
  amenUserNames?: string[];
  prayUserNames?: string[];
}

export interface AppNotification {
  id: string;
  recipientUserId?: string; // 若指定則僅該使用者可見，或依追求主題過濾
  planId?: string;
  actorName: string;
  actorAvatar: string;
  type: 'post_amen' | 'post_pray' | 'post_comment' | 'sanctuary_amen';
  targetTitle: string; // 例如貼文摘要或主題名稱
  createdAt: string;
  read: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface SharingPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string; // e.g. "同伴", "發起人"
  authorAvatar: string;
  planId?: string;
  planTitle: string;
  unitTitle: string;
  keyVerse: string;
  reflection: string;
  tags: string[];
  createdAt: string;
  reactions: Reaction;
  comments: Comment[];
}

export interface Companion {
  id: string;
  name: string;
  role: string;
  avatar: string;
  todayCompleted: boolean;
  streakDays: number;
  lastActive: string;
  currentPlanTitle: string;
  encouragedToday?: boolean;
  completedUnits?: number;
  totalUnits?: number;
  unitName?: string;
  currentUnitTitle?: string;
}

export type DisplayMode = 'light' | 'warm' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  email: string; // 必填電子信箱
  password?: string; // 登入密碼
  locality?: string;
  streakDays: number;
  totalChaptersRead: number;
  totalSharesCount: number;
  totalAmenReceived: number;
  avatar: string;
  role?: UserRole;
  displayMode?: DisplayMode; // 個人顯示模式設定
  joinedInviteCodes?: string[]; // 已加入主題之 6-Emoji 邀請碼
  sanctuary?: SanctuaryConfig; // 個人追求帳幕自訂陳設
  planSanctuaries?: Record<string, SanctuaryConfig>; // 各追求主題專屬帳幕自訂陳設
  dailyHistory?: Record<string, number>; // 追求地圖每日追求歷史紀錄 (Key: YYYY-MM-DD -> 篇/章數)
  passwordResetRequested?: boolean; // 是否送出了忘記密碼申請 (待管理員一鍵重設)
  mustChangePassword?: boolean; // 是否需強制更改密碼後方可進入
  tempPassword?: string; // 系統產生的 10 位臨時密碼，直到使用者重設完成後清除
}

export type SanctuaryTheme = 'dawn' | 'night' | 'meadow' | 'temple';

export interface SanctuaryConfig {
  placedRelicIds: string[]; // 擺放的信物 ID (最多 4 個)
  motto: string; // 立志經節座右銘
  theme: SanctuaryTheme; // 帳幕氛圍背景
}

export interface SpiritualRelic {
  id: string;
  name: string;
  emoji: string;
  category: 'light' | 'word' | 'life' | 'praise';
  categoryLabel: string;
  requirement: string;
  verseQuote: string;
  meaning: string;
}

export interface SiteSettings {
  allowEmailReset: boolean; // 開放信箱 6 位數驗證碼重設密碼
  allowAdminAssistedReset: boolean; // 開放聯繫管理員一鍵申請臨時密碼
  allowUserRegistration: boolean; // 開放新聖徒線上自主註冊 (關閉時僅由管理員在後台手動新增人員)
  allowSharingPosts: boolean; // 開放聖徒發表今日摸著與亮光
  allowComments: boolean; // 開放動態留言回應與交通
  allowMutualAmens: boolean; // 開放同聲阿們與禱告互動
  allowSanctuaryVisit: boolean; // 開放同伴互訪追求帳幕
  allowJoinByInviteCode: boolean; // 開放以 6-Emoji 邀請碼自主加入追求主題
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  allowEmailReset: true,
  allowAdminAssistedReset: true,
  allowUserRegistration: true,
  allowSharingPosts: true,
  allowComments: true,
  allowMutualAmens: true,
  allowSanctuaryVisit: true,
  allowJoinByInviteCode: true,
};
