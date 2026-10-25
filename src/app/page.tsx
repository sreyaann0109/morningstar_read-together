'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from '../components/Header';
import { TodayPursuitCard } from '../components/TodayPursuitCard';
import { CompanionsFeed } from '../components/CompanionsFeed';
import { CompanionsStatusList } from '../components/CompanionsStatusList';
import { LightShareModal } from '../components/LightShareModal';
import { PlanSelectorModal } from '../components/PlanSelectorModal';
import { ThemesDrawer } from '../components/ThemesDrawer';
import { EditCurrentPursuitModal } from '../components/EditCurrentPursuitModal';
import { CreateThematicPlanModal } from '../components/CreateThematicPlanModal';
import { AdminPanel } from '../components/AdminPanel';
import { AuthModal } from '../components/AuthModal';
import { LoginPage } from '../components/LoginPage';
import { StatsModal } from '../components/StatsModal';
import { JoinByCodeModal } from '../components/JoinByCodeModal';
import { BottomNav, MobileTab } from '../components/BottomNav';
import { SanctuaryCard } from '../components/SanctuaryCard';
import { SanctuaryCustomizeModal } from '../components/SanctuaryCustomizeModal';
import { RelicsCollectionModal } from '../components/RelicsCollectionModal';
import { CompanionSanctuaryModal } from '../components/CompanionSanctuaryModal';
import { SetProgressModal } from '../components/SetProgressModal';
import { JoinByCodePage } from '../components/JoinByCodePage';
import { PursuitMap } from '../components/PursuitMap';
import { useBodyScrollLock } from '../lib/scrollLock';
import {
  currentUser as defaultUser,
  initialPlans,
  initialPosts,
  initialNotifications,
  demoUsers,
} from '../data/initialData';
import { DEFAULT_SANCTUARY_CONFIG } from '../data/relicsData';
import { getTodayNTSchedule, calculateNTSpeedPace, getNTChapterLocation } from '../data/ntBibleData';
import {
  PursuitPlan,
  SharingPost,
  Companion,
  UserProfile,
  UserRole,
  ThematicMember,
  SanctuaryConfig,
  AppNotification,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from '../types';
import { Sparkles, Flame, HeartHandshake, KeyRound, ShieldCheck, Plus } from 'lucide-react';
import {
  fetchInitialDataFromBackend,
  fetchSiteSettingsFromBackend,
  syncSettingsToBackend,
  syncPlansToBackend,
  syncPostsToBackend,
  syncUsersToBackend,
  syncNotificationsToBackend,
  deletePlanFromBackend,
  deletePostFromBackend,
  deleteUserFromBackend,
  clearNotificationsFromBackend,
  isMutatingOrInCooldown,
  getLastMutationTimestamp,
} from '../lib/api';
import { hashPasswordWeb, generateRandomTempPassword } from '../lib/password';
import { getUTC8DateString, addDaysUTC8 } from '../lib/dateUtils';
import { DeletedCommentRecord } from '../components/CompanionsFeed';

const getUserStorageKey = (userId: string, key: string) => `morningstar_user_${userId}_${key}`;

// Helper to load all registered & builtin users
const loadAllRegisteredUsers = (): UserProfile[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('morningstar_registered_users');
      if (saved !== null) {
        const parsed: UserProfile[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return demoUsers;
};

// Helper to load user-scoped data with strict authoritative membership
const loadUserData = (targetUser: UserProfile, sourcePlansOverride?: PursuitPlan[]) => {
  try {
    // 1. Profile
    let activeProfile = targetUser;
    const savedProfileStr = localStorage.getItem(getUserStorageKey(targetUser.id, 'profile'));
    if (savedProfileStr) {
      const parsed = JSON.parse(savedProfileStr);
      activeProfile = {
        ...parsed,
        ...targetUser,
        role: targetUser.role || parsed.role || 'user',
      };
    }

    try {
      localStorage.setItem(getUserStorageKey(targetUser.id, 'profile'), JSON.stringify(activeProfile));
    } catch (e) {}

    // 2. Joined Plans — strictly derived from plan.members authority
    const savedPlansStr = localStorage.getItem('morningstar_plans');
    const sourcePlans: PursuitPlan[] =
      sourcePlansOverride || (savedPlansStr ? JSON.parse(savedPlansStr) : initialPlans);
    const activeJoinedIds = sourcePlans
      .filter((p) => (p.members || []).some((m) => m.userId === targetUser.id))
      .map((p) => p.id);

    try {
      localStorage.setItem(getUserStorageKey(targetUser.id, 'joined_plans'), JSON.stringify(activeJoinedIds));
    } catch (e) {}

    // 3. Completed Today (Strictly anchored to UTC+8 current date)
    let completedToday = false;
    const todayDateStr = getUTC8DateString();
    const savedCompletedDate = localStorage.getItem(getUserStorageKey(targetUser.id, 'completed_today_date'));
    if (savedCompletedDate === todayDateStr) {
      const savedCompletedStr = localStorage.getItem(getUserStorageKey(targetUser.id, 'completed_today'));
      if (savedCompletedStr !== null) {
        completedToday = JSON.parse(savedCompletedStr);
      }
    } else {
      try {
        localStorage.setItem(getUserStorageKey(targetUser.id, 'completed_today'), JSON.stringify(false));
      } catch (e) {}
    }

    return { activeProfile, activeJoinedIds, completedToday };
  } catch (e) {
    return {
      activeProfile: targetUser,
      activeJoinedIds: [],
      completedToday: false,
    };
  }
};

// 追求地圖：讀取個人每日追求單位歷史記錄（不存在時依 streak 與追求歷史產生真實紀錄）
const loadUserDailyHistory = (targetUser: UserProfile): Record<string, number> => {
  try {
    const stored = localStorage.getItem(getUserStorageKey(targetUser.id, 'daily_units_history'));
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}

  // 預設依 streak 與近月天數初始化真實追求數據（若 streak 為 0 則預設為空，嚴格杜絕幽靈方格）
  const initialHistory: Record<string, number> = {};
  const todayStr = getUTC8DateString();
  const streak = targetUser.streakDays || 0;
  if (streak > 0) {
    for (let i = 0; i < streak; i++) {
      const dateStr = addDaysUTC8(todayStr, -i);
      initialHistory[dateStr] = i === 0 ? 2 : (i % 3 === 0 ? 3 : 2);
    }
  }
  try {
    localStorage.setItem(getUserStorageKey(targetUser.id, 'daily_units_history'), JSON.stringify(initialHistory));
  } catch (e) {}
  return initialHistory;
};

// 取得指定聖徒在特定追求主題中的獨立進度 (100% Per-User Independent Progress — 絕不混用共用進度)
const getUserPlan = (plan: PursuitPlan, targetUserId: string): PursuitPlan => {
  const member = (plan.members || []).find((m) => m.userId === targetUserId);
  let userCompletedUnits = member?.completedUnits;

  // 若該聖徒尚未寫入 member.completedUnits，僅讀取該聖徒個人專屬 localStorage，預設為 0（絕不回退至 plan.completedUnits 共用欄位）
  if (userCompletedUnits === undefined && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(getUserStorageKey(targetUserId, `plan_${plan.id}_completed_units`));
      if (stored !== null) {
        const parsedNum = Number(stored);
        if (!Number.isNaN(parsedNum) && parsedNum >= 0) {
          userCompletedUnits = parsedNum;
        }
      }
    } catch (e) {}
  }

  if (userCompletedUnits === undefined || Number.isNaN(userCompletedUnits)) {
    userCompletedUnits = 0;
  }

  const isNT = plan.category === 'nt-half-year';
  const isNTSpeed = plan.category === 'nt-speed-reading';
  const planUnit = plan.unitName || (plan.category === 'bible' || isNT || isNTSpeed ? '章' : '篇');

  let currentUnitTitle = member?.currentUnitTitle;
  let currentVerses = member?.currentVerses || plan.currentVerses;

  if (isNT) {
    currentUnitTitle = getTodayNTSchedule(userCompletedUnits).schedule.displayText;
    currentVerses = currentUnitTitle;
  } else if (isNTSpeed) {
    const loc = getNTChapterLocation((userCompletedUnits % 260) + 1);
    currentUnitTitle = `第 ${Math.floor(userCompletedUnits / 260) + 1} 遍 · ${loc.displayText}`;
    currentVerses = loc.displayText;
  } else if (!currentUnitTitle) {
    const nextUnit = Math.min(userCompletedUnits + 1, Math.max(1, plan.totalUnits));
    currentUnitTitle = `第 ${nextUnit} ${planUnit}`;
  }

  return {
    ...plan,
    completedUnits: userCompletedUnits,
    currentUnitTitle,
    currentVerses,
  };
};

export default function Home() {
  // App States
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(demoUsers);
  const [plans, setPlans] = useState<PursuitPlan[]>(initialPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlans[0]?.id || '');
  const [joinedPlanIds, setJoinedPlanIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<SharingPost[]>(initialPosts);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [isCompletedToday, setIsCompletedToday] = useState<boolean>(false);
  const [dailyPursuitHistory, setDailyPursuitHistory] = useState<Record<string, number>>({});
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [mounted, setMounted] = useState<boolean>(false);

  // Synchronous state refs to prevent race conditions during consecutive rapid operations
  const userRef = useRef<UserProfile>(user);
  const allUsersRef = useRef<UserProfile[]>(allUsers);
  const plansRef = useRef<PursuitPlan[]>(plans);
  const postsRef = useRef<SharingPost[]>(posts);
  const notificationsRef = useRef<AppNotification[]>(notifications);
  const siteSettingsRef = useRef<SiteSettings>(siteSettings);
  const lastSettingsModifiedAtRef = useRef<number>(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);
  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    siteSettingsRef.current = siteSettings;
  }, [siteSettings]);

  // Modals & Navigation
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isThemesDrawerOpen, setIsThemesDrawerOpen] = useState(false);
  const [isPlanSelectorOpen, setIsPlanSelectorOpen] = useState(false);
  const [isEditPursuitOpen, setIsEditPursuitOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PursuitPlan | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isJoinByCodeOpen, setIsJoinByCodeOpen] = useState(false);
  const [isSanctuaryCustomizeOpen, setIsSanctuaryCustomizeOpen] = useState(false);
  const [isRelicsCollectionOpen, setIsRelicsCollectionOpen] = useState(false);
  const [viewingCompanion, setViewingCompanion] = useState<Companion | null>(null);
  const [companionAmenMap, setCompanionAmenMap] = useState<Record<string, boolean>>({});
  const [mobileTab, setMobileTab] = useState<MobileTab>('today');
  const [isSetProgressOpen, setIsSetProgressOpen] = useState(false);

  // 全站鎖定背景滾動：當任何浮動視窗、側邊欄或彈窗開啟時，徹底鎖定背景防止滑動干擾
  const isAnyModalOpen = Boolean(
    isThemesDrawerOpen ||
    isShareModalOpen ||
    isPlanSelectorOpen ||
    isEditPursuitOpen ||
    isCreatePlanOpen ||
    isAuthModalOpen ||
    isStatsModalOpen ||
    isJoinByCodeOpen ||
    isSanctuaryCustomizeOpen ||
    isRelicsCollectionOpen ||
    viewingCompanion ||
    isSetProgressOpen ||
    (isLoggedIn && user.mustChangePassword)
  );
  useBodyScrollLock(isAnyModalOpen);

  // Undo Pending Progress Snapshot (支援 10 秒即時復原，逾時後不可往回修改)
  interface ProgressUndoSnapshot {
    planId: string;
    planTitle: string;
    unitName: string;
    prevCompletedUnits: number;
    prevCurrentUnitTitle?: string;
    prevTotalChaptersRead: number;
    prevTodayCompleted: boolean;
    newCompletedUnits: number;
    secondsRemaining: number;
  }
  const [progressUndo, setProgressUndo] = useState<ProgressUndoSnapshot | null>(null);

  // Toast Notification
  interface ToastData {
    id: number;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
  const [toast, setToast] = useState<ToastData | null>(null);

  // Undo Comment restoration state
  const [recentlyDeletedComment, setRecentlyDeletedComment] = useState<DeletedCommentRecord | null>(null);

  // In-App Force Change Password State (when active logged-in user mustChangePassword === true)
  const [inAppNewPassword, setInAppNewPassword] = useState('');
  const [inAppConfirmPassword, setInAppConfirmPassword] = useState('');
  const [inAppChangeError, setInAppChangeError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToast({ id, message: msg });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const showToastWithAction = (msg: string, actionLabel: string, onAction: () => void) => {
    const id = Date.now();
    setToast({
      id,
      message: msg,
      action: {
        label: actionLabel,
        onClick: () => {
          onAction();
        },
      },
    });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 7000);
  };

  // Progress Undo Countdown Timer (10 秒倒數計時，時間到即正式確認並鎖定，不可往回修改)
  useEffect(() => {
    if (!progressUndo) return;
    const timer = setInterval(() => {
      setProgressUndo((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          showToast(`🔒 《${prev.planTitle}》追求進度已確認鎖定至第 ${prev.newCompletedUnits} ${prev.unitName || '篇'}，不可往回修改。`);
          return null;
        }
        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [progressUndo?.planId, progressUndo !== null]);

  // Sync displayMode class onto document.body & html so portals and scrollbars match
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const mode = isLoggedIn ? user.displayMode || 'light' : 'light';
      document.body.classList.remove('theme-light', 'theme-warm', 'theme-dark', 'dark');
      document.documentElement.classList.remove('theme-light', 'theme-warm', 'theme-dark', 'dark');

      document.body.classList.add(`theme-${mode}`);
      document.documentElement.classList.add(`theme-${mode}`);

      if (mode === 'dark') {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
      }
    }
  }, [user.displayMode, isLoggedIn]);

  // Load from sessionStorage (per-tab) or fallback to localStorage on mount
  useEffect(() => {
    try {
      const initialUsers = loadAllRegisteredUsers();
      allUsersRef.current = initialUsers;
      setAllUsers(initialUsers);

      const loggedInFlag =
        sessionStorage.getItem('morningstar_is_logged_in') ??
        localStorage.getItem('morningstar_is_logged_in');
      const savedUserStr =
        sessionStorage.getItem('morningstar_current_user') ??
        localStorage.getItem('morningstar_current_user');

      if (loggedInFlag === 'true' && savedUserStr) {
        setIsLoggedIn(true);
        let initialUser = defaultUser;
        try {
          initialUser = JSON.parse(savedUserStr);
        } catch (e) {}

        // Load scoped data for this user
        const { activeProfile, activeJoinedIds, completedToday } = loadUserData(initialUser);
        setUser(activeProfile);
        setJoinedPlanIds(activeJoinedIds);
        setIsCompletedToday(completedToday);
        setDailyPursuitHistory(loadUserDailyHistory(activeProfile));

        if (activeJoinedIds.length > 0) {
          setSelectedPlanId(activeJoinedIds[0]);
        } else {
          setSelectedPlanId('');
        }
      } else {
        setIsLoggedIn(false);
      }

      const savedPosts = localStorage.getItem('morningstar_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }

      const savedNotifications = localStorage.getItem('morningstar_notifications');
      if (savedNotifications) {
        try {
          const parsed: AppNotification[] = JSON.parse(savedNotifications);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(
              (n) => n.id !== 'notif-1' && n.id !== 'notif-2' && n.actorName !== '測試聖徒 1' && n.actorName !== '測試聖徒 2'
            );
            setNotifications(clean);
            notificationsRef.current = clean;
          }
        } catch (e) {}
      }

      const savedPlans = localStorage.getItem('morningstar_plans');
      if (savedPlans) {
        const parsed: PursuitPlan[] = JSON.parse(savedPlans);
        if (Array.isArray(parsed)) {
          setPlans(parsed);
        }
      }

      const savedSettings = localStorage.getItem('morningstar_site_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...parsed });
          siteSettingsRef.current = { ...DEFAULT_SITE_SETTINGS, ...parsed };
        } catch (e) {}
      }

      // Mark mounted so first authenticated render uses activeProfile rather than defaultUser
      setMounted(true);

      // Fetch site settings from backend
      fetchSiteSettingsFromBackend().then((remoteSettings) => {
        if (remoteSettings && Date.now() - lastSettingsModifiedAtRef.current > 4000) {
          setSiteSettings(remoteSettings);
          siteSettingsRef.current = remoteSettings;
          try {
            localStorage.setItem('morningstar_site_settings', JSON.stringify(remoteSettings));
          } catch (e) {}
        }
      });

      // Fetch latest state from Backend DB & sync
      const fetchStartTs = Date.now();
      fetchInitialDataFromBackend().then((backendData) => {
        if (!backendData || isMutatingOrInCooldown() || fetchStartTs < getLastMutationTimestamp()) {
          return;
        }
        if (backendData.siteSettings && Date.now() - lastSettingsModifiedAtRef.current > 4000) {
          setSiteSettings(backendData.siteSettings);
          siteSettingsRef.current = backendData.siteSettings;
          try {
            localStorage.setItem('morningstar_site_settings', JSON.stringify(backendData.siteSettings));
          } catch (e) {}
        }
        if (Array.isArray(backendData.plans)) {
          setPlans(backendData.plans);
          plansRef.current = backendData.plans;
          try {
            localStorage.setItem('morningstar_plans', JSON.stringify(backendData.plans));
          } catch (e) {}

          const currentUid = userRef.current.id;
          const memberPlanIds = backendData.plans
            .filter((p) => (p.members || []).some((m) => m.userId === currentUid))
            .map((p) => p.id);
          setJoinedPlanIds(memberPlanIds);
          try {
            localStorage.setItem(getUserStorageKey(currentUid, 'joined_plans'), JSON.stringify(memberPlanIds));
          } catch (e) {}
          setSelectedPlanId((prev) => {
            return prev && memberPlanIds.includes(prev) ? prev : memberPlanIds[0] || '';
          });
        }
        if (Array.isArray(backendData.users) && backendData.users.length > 0) {
          allUsersRef.current = backendData.users;
          setAllUsers(backendData.users);
          try {
            localStorage.setItem('morningstar_registered_users', JSON.stringify(backendData.users));
          } catch (e) {}

          setUser((currentUser) => {
            const remote = backendData.users?.find(
              (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
            );
            if (remote) {
              const updated = {
                ...currentUser,
                ...remote,
                role: remote.role || currentUser.role,
              };
              userRef.current = updated;
              try {
                sessionStorage.setItem('morningstar_current_user', JSON.stringify(updated));
                localStorage.setItem(getUserStorageKey(currentUser.id, 'profile'), JSON.stringify(updated));
              } catch (e) {}
              return updated;
            }
            return currentUser;
          });
        }
        if (Array.isArray(backendData.posts)) {
          postsRef.current = backendData.posts;
          setPosts(backendData.posts);
          try {
            localStorage.setItem('morningstar_posts', JSON.stringify(backendData.posts));
          } catch (e) {}
        }
        if (Array.isArray(backendData.notifications)) {
          const clean = backendData.notifications.filter(
            (n) => n.id !== 'notif-1' && n.id !== 'notif-2' && n.actorName !== '測試聖徒 1' && n.actorName !== '測試聖徒 2'
          );
          setNotifications(clean);
          notificationsRef.current = clean;
          try {
            localStorage.setItem('morningstar_notifications', JSON.stringify(clean));
          } catch (e) {}
        }
      });
    } catch (e) {
      console.error('LocalStorage error:', e);
      setMounted(true);
    }
  }, []);

  // Mutation-safe polling from backend database on mount, focus, and interval
  useEffect(() => {
    const syncFromDatabaseAndStorage = () => {
      if (isMutatingOrInCooldown()) return;
      const fetchStartTs = Date.now();

      fetchInitialDataFromBackend().then((backendData) => {
        if (!backendData || isMutatingOrInCooldown() || fetchStartTs < getLastMutationTimestamp()) {
          return;
        }
        if (backendData.siteSettings && Date.now() - lastSettingsModifiedAtRef.current > 4000) {
          setSiteSettings(backendData.siteSettings);
          siteSettingsRef.current = backendData.siteSettings;
          try {
            localStorage.setItem('morningstar_site_settings', JSON.stringify(backendData.siteSettings));
          } catch (e) {}
        }
        if (Array.isArray(backendData.users) && backendData.users.length > 0) {
          allUsersRef.current = backendData.users;
          setAllUsers(backendData.users);
          try {
            localStorage.setItem('morningstar_registered_users', JSON.stringify(backendData.users));
          } catch (e) {}

          setUser((currentUser) => {
            const remote = backendData.users?.find(
              (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
            );
            if (remote) {
              const updated = {
                ...currentUser,
                ...remote,
                role: remote.role || currentUser.role,
              };
              userRef.current = updated;
              try {
                sessionStorage.setItem('morningstar_current_user', JSON.stringify(updated));
                localStorage.setItem(getUserStorageKey(currentUser.id, 'profile'), JSON.stringify(updated));
              } catch (e) {}
              return updated;
            }
            return currentUser;
          });
        }
        if (Array.isArray(backendData.plans)) {
          plansRef.current = backendData.plans;
          setPlans(backendData.plans);
          try {
            localStorage.setItem('morningstar_plans', JSON.stringify(backendData.plans));
          } catch (e) {}

          // 嚴格以資料庫 plan.members 為唯一權威來源：加入即顯示、退出即移除，絕不疊加殘留舊主題 ID
          const currentUid = userRef.current.id;
          const memberPlanIds = backendData.plans
            .filter((p) => (p.members || []).some((m) => m.userId === currentUid))
            .map((p) => p.id);

          setJoinedPlanIds(memberPlanIds);
          try {
            localStorage.setItem(getUserStorageKey(currentUid, 'joined_plans'), JSON.stringify(memberPlanIds));
          } catch (e) {}

          setSelectedPlanId((prev) => {
            return prev && memberPlanIds.includes(prev) ? prev : memberPlanIds[0] || '';
          });
        }
        if (Array.isArray(backendData.posts)) {
          postsRef.current = backendData.posts;
          setPosts(backendData.posts);
          try {
            localStorage.setItem('morningstar_posts', JSON.stringify(backendData.posts));
          } catch (e) {}
        }
        if (Array.isArray(backendData.notifications)) {
          const clean = backendData.notifications.filter(
            (n) => n.id !== 'notif-1' && n.id !== 'notif-2' && n.actorName !== '測試聖徒 1' && n.actorName !== '測試聖徒 2'
          );
          notificationsRef.current = clean;
          setNotifications(clean);
          try {
            localStorage.setItem('morningstar_notifications', JSON.stringify(clean));
          } catch (e) {}
        }
      });
    };

    syncFromDatabaseAndStorage();
    window.addEventListener('focus', syncFromDatabaseAndStorage);
    const intervalTimer = setInterval(syncFromDatabaseAndStorage, 3500);
    return () => {
      window.removeEventListener('focus', syncFromDatabaseAndStorage);
      clearInterval(intervalTimer);
    };
  }, [isJoinByCodeOpen, isPlanSelectorOpen, isAuthModalOpen, isAdminMode, user.id]);

  // Save helpers (sync to both localStorage & backend Supabase cloud DB)
  const savePosts = (newPostsOrUpdater: SharingPost[] | ((prev: SharingPost[]) => SharingPost[])) => {
    const nextPosts = typeof newPostsOrUpdater === 'function' ? newPostsOrUpdater(postsRef.current) : newPostsOrUpdater;
    postsRef.current = nextPosts;
    setPosts(nextPosts);
    try {
      localStorage.setItem('morningstar_posts', JSON.stringify(nextPosts));
    } catch (e) {}
    syncPostsToBackend(nextPosts);
    return nextPosts;
  };

  const saveNotifications = (newNotificationsOrUpdater: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => {
    const nextNotifications = typeof newNotificationsOrUpdater === 'function' ? newNotificationsOrUpdater(notificationsRef.current) : newNotificationsOrUpdater;
    notificationsRef.current = nextNotifications;
    setNotifications(nextNotifications);
    try {
      localStorage.setItem('morningstar_notifications', JSON.stringify(nextNotifications));
    } catch (e) {}
    syncNotificationsToBackend(nextNotifications);
    return nextNotifications;
  };

  const savePlans = (newPlansOrUpdater: PursuitPlan[] | ((prev: PursuitPlan[]) => PursuitPlan[])) => {
    const nextPlans = typeof newPlansOrUpdater === 'function' ? newPlansOrUpdater(plansRef.current) : newPlansOrUpdater;
    plansRef.current = nextPlans;
    setPlans(nextPlans);
    try {
      localStorage.setItem('morningstar_plans', JSON.stringify(nextPlans));
    } catch (e) {}
    syncPlansToBackend(nextPlans);
    return nextPlans;
  };

  const saveAllUsers = (newUsersOrUpdater: UserProfile[] | ((prev: UserProfile[]) => UserProfile[])) => {
    const nextUsers = typeof newUsersOrUpdater === 'function' ? newUsersOrUpdater(allUsersRef.current) : newUsersOrUpdater;
    allUsersRef.current = nextUsers;
    setAllUsers(nextUsers);
    try {
      localStorage.setItem('morningstar_registered_users', JSON.stringify(nextUsers));
    } catch (e) {}
    syncUsersToBackend(nextUsers);
    return nextUsers;
  };

  // Update active user profile and atomically persist to allUsers & backend DB
  const updateCurrentUserAndSync = (updater: (prev: UserProfile) => UserProfile): UserProfile => {
    const updatedUser = updater(userRef.current);
    userRef.current = updatedUser;
    setUser(updatedUser);
    try {
      sessionStorage.setItem('morningstar_current_user', JSON.stringify(updatedUser));
      localStorage.setItem(getUserStorageKey(updatedUser.id, 'profile'), JSON.stringify(updatedUser));
    } catch (e) {}
    saveAllUsers((prevUsers) => {
      const exists = prevUsers.some((u) => u.id === updatedUser.id);
      return exists
        ? prevUsers.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
        : [updatedUser, ...prevUsers];
    });
    return updatedUser;
  };

  const handleUpdateSiteSettings = (
    newSettingsOrUpdater: SiteSettings | ((prev: SiteSettings) => SiteSettings)
  ) => {
    lastSettingsModifiedAtRef.current = Date.now();
    const nextSettings =
      typeof newSettingsOrUpdater === 'function'
        ? newSettingsOrUpdater(siteSettingsRef.current)
        : newSettingsOrUpdater;
    siteSettingsRef.current = nextSettings;
    setSiteSettings(nextSettings);
    try {
      localStorage.setItem('morningstar_site_settings', JSON.stringify(nextSettings));
    } catch (e) {}
    syncSettingsToBackend(nextSettings).catch((err) => {
      console.error('Failed to sync site settings to backend:', err);
    });
  };

  const syncUserJoinedPlansStorage = (userId: string, updatedPlans: PursuitPlan[]) => {
    try {
      const memberPlanIds = updatedPlans
        .filter((p) => (p.members || []).some((m) => m.userId === userId))
        .map((p) => p.id);
      localStorage.setItem(getUserStorageKey(userId, 'joined_plans'), JSON.stringify(memberPlanIds));
      if (userId === userRef.current.id) {
        setJoinedPlanIds(memberPlanIds);
        setSelectedPlanId((prev) => {
          return memberPlanIds.includes(prev) ? prev : memberPlanIds[0] || '';
        });
      }
    } catch (e) {}
  };

  // Authoritative plan membership:
  // Strictly plans where user is a member in plan.members (applies equally to admins and regular saints)
  // Admins only see pursuit plans they have actually joined in their personal pursuit view
  const userJoinedPlans = plans
    .filter((p) => (p.members || []).some((m) => m.userId === user.id))
    .map((p) => getUserPlan(p, user.id));
  const userJoinedPlanTitles = userJoinedPlans.map((p) => p.title);

  // Current active plan with per-user independent progress
  const rawCurrentPlan = (() => {
    if (selectedPlanId) {
      const found = plans.find((p) => p.id === selectedPlanId);
      if (found && (found.members || []).some((m) => m.userId === user.id)) {
        return found;
      }
    }
    return userJoinedPlans.length > 0
      ? plans.find((p) => p.id === userJoinedPlans[0].id) || null
      : null;
  })();

  const currentPlan = rawCurrentPlan ? getUserPlan(rawCurrentPlan, user.id) : null;

  // Per-plan per-user todayCompleted status (isolated per pursuit plan and per user, strictly anchored to UTC+8 current date)
  const currentUtc8Date = getUTC8DateString();
  const currentSelfMember = rawCurrentPlan?.members?.find((m) => m.userId === user.id);
  const isCurrentPlanCompletedToday = currentSelfMember
    ? Boolean(currentSelfMember.todayCompleted) && (!currentSelfMember.lastCompletedDate || currentSelfMember.lastCompletedDate === currentUtc8Date)
    : false;

  // Filter posts to all joined pursuit plans of the current user (plus currentPlan)
  const feedPosts = useMemo(() => {
    if (user.role !== 'admin' && userJoinedPlans.length === 0) return [];
    const joinedIds = new Set(userJoinedPlans.map((p) => p.id));
    if (currentPlan?.id) joinedIds.add(currentPlan.id);
    return posts.filter((post) => {
      if (post.planId && joinedIds.has(post.planId)) return true;
      if (!post.planId && currentPlan?.title && post.planTitle === currentPlan.title) return true;
      return false;
    });
  }, [posts, user.role, userJoinedPlans, currentPlan?.id, currentPlan?.title]);

  const visiblePosts = useMemo(() => {
    if (!currentPlan || (user.role !== 'admin' && userJoinedPlans.length === 0)) return [];
    return posts.filter((post) => {
      if (post.planId && currentPlan.id) {
        return post.planId === currentPlan.id;
      }
      return post.planTitle === currentPlan.title;
    });
  }, [posts, currentPlan, user.role, userJoinedPlans.length]);

  // Derive companions strictly from rawCurrentPlan.members with per-user independent progress
  const currentCompanions: Companion[] = (() => {
    if (!rawCurrentPlan || !currentPlan) return [];

    const members = [...(rawCurrentPlan.members || [])];

    return members.map((m) => {
      const isSelf = m.userId === user.id;
      const matchedUser = isSelf ? user : allUsers.find((u) => u.id === m.userId);
      const completed = Boolean(m.todayCompleted);
      const streak = matchedUser ? matchedUser.streakDays : m.streakDays;
      const avatar = matchedUser ? matchedUser.avatar : m.avatar;
      const name = matchedUser ? matchedUser.name : m.name;

      // Calculate each member's independent progress within this theme
      const memberPlan = getUserPlan(rawCurrentPlan, m.userId);
      const memberCompletedUnits = memberPlan.completedUnits;
      const memberTotalUnits = memberPlan.totalUnits || rawCurrentPlan.totalUnits;
      const memberUnitName =
        memberPlan.unitName ||
        (rawCurrentPlan.category === 'bible' || rawCurrentPlan.category.includes('nt') ? '章' : '篇');
      const memberCurrentUnitTitle = memberPlan.currentUnitTitle;

      return {
        id: m.userId,
        name,
        role: '同伴',
        avatar,
        todayCompleted: completed,
        streakDays: streak,
        lastActive: completed ? '今日已完成' : isSelf ? '追求中' : m.lastActive,
        currentPlanTitle: rawCurrentPlan.title,
        encouragedToday: m.encouragedToday,
        completedUnits: memberCompletedUnits,
        totalUnits: memberTotalUnits,
        unitName: memberUnitName,
        currentUnitTitle: memberCurrentUnitTitle,
      };
    });
  })();

  // Auth & Personal Settings Handlers
  const handleLogin = (newUser: UserProfile, isNewRegistration?: boolean) => {
    try {
      // Find authoritative user profile from allUsers to guarantee admin roles are not reverted
      const authoritative = allUsersRef.current.find(
        (u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()
      );
      const userToProcess = authoritative
        ? { ...authoritative, ...newUser, role: authoritative.role || newUser.role }
        : newUser;

      const { activeProfile, activeJoinedIds, completedToday } = loadUserData(
        userToProcess,
        plansRef.current
      );

      sessionStorage.setItem('morningstar_is_logged_in', 'true');
      sessionStorage.setItem('morningstar_current_user', JSON.stringify(activeProfile));
      localStorage.setItem('morningstar_is_logged_in', 'true');
      localStorage.setItem('morningstar_current_user', JSON.stringify(activeProfile));

      userRef.current = activeProfile;
      setUser(activeProfile);
      setIsLoggedIn(true);
      if (activeProfile.role !== 'admin') {
        setIsAdminMode(false);
      }
      setJoinedPlanIds(activeJoinedIds);
      setIsCompletedToday(completedToday);
      setDailyPursuitHistory(loadUserDailyHistory(activeProfile));
      if (activeProfile.role === 'admin') {
        setSelectedPlanId(activeJoinedIds[0] || plansRef.current[0]?.id || '');
      } else if (activeJoinedIds.length > 0) {
        setSelectedPlanId(activeJoinedIds[0]);
      } else {
        setSelectedPlanId('');
      }

      if (isNewRegistration) {
        saveAllUsers((prevUsers) => {
          const exists = prevUsers.some((u) => u.id === activeProfile.id);
          return exists
            ? prevUsers.map((u) => (u.id === activeProfile.id ? { ...u, ...activeProfile } : u))
            : [activeProfile, ...prevUsers];
        });
        showToast(`🎉 註冊成功！歡迎【${activeProfile.name}】，已為您建立全新空白獨立追求檔案！`);
      } else {
        showToast(`✨ 歡迎，${activeProfile.name}！已為您載入個人專屬獨立追求進度。`);
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsAuthModalOpen(false);
    setIsLoggedIn(false);
    setIsAdminMode(false);
    setJoinedPlanIds([]);
    setIsCompletedToday(false);
    setSelectedPlanId('');
    try {
      sessionStorage.setItem('morningstar_is_logged_in', 'false');
      sessionStorage.removeItem('morningstar_current_user');
      localStorage.setItem('morningstar_is_logged_in', 'false');
      localStorage.removeItem('morningstar_current_user');
    } catch (e) {}
    showToast('👋 已登出當前身份並退回登入頁。');
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    updateCurrentUserAndSync(() => updatedUser);

    // Sync member name & avatar across all plans
    const updatedPlans = plansRef.current.map((p) => ({
      ...p,
      adminName: p.adminId === updatedUser.id ? updatedUser.name : p.adminName,
      members: (p.members || []).map((m) =>
        m.userId === updatedUser.id
          ? {
              ...m,
              name: updatedUser.name,
              avatar: updatedUser.avatar,
              locality: updatedUser.locality,
            }
          : m
      ),
    }));
    savePlans(updatedPlans);
    showToast('✨ 個人設定（顯示模式、名字、信箱與密碼）已儲存更新！');
  };

  // Join by 6-Emoji Invite Code
  const handleJoinByCodeSuccess = (targetPlan: PursuitPlan) => {
    if (!siteSettingsRef.current.allowJoinByInviteCode && user.role !== 'admin') {
      showToast('🔒 目前管理員已關閉邀請碼自助加入功能，請聯繫管理員為您指派追求主題。');
      return;
    }
    const latestPlan = plansRef.current.find((p) => p.id === targetPlan.id) || targetPlan;
    const isMember = (latestPlan.members || []).some((m) => m.userId === user.id);
    const planUnit =
      latestPlan.unitName ||
      (latestPlan.category === 'bible' || latestPlan.category.includes('nt') ? '章' : '篇');

    let updatedPlan = latestPlan;
    if (!isMember) {
      const newMember: ThematicMember = {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        locality: user.locality,
        joinedAt: getUTC8DateString(),
        todayCompleted: false,
        streakDays: user.streakDays,
        completedUnits: 0,
        currentUnitTitle: `第 1 ${planUnit}`,
        lastActive: '剛剛加入',
        encouragedToday: false,
      };
      updatedPlan = {
        ...latestPlan,
        members: [...(latestPlan.members || []), newMember],
      };
    }

    const currentPlans = plansRef.current;
    const existsInState = currentPlans.some((p) => p.id === updatedPlan.id);
    const updatedPlans = existsInState
      ? currentPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      : [updatedPlan, ...currentPlans];
    savePlans(updatedPlans);
    syncUserJoinedPlansStorage(user.id, updatedPlans);
    setSelectedPlanId(updatedPlan.id);

    showToast(`🎉 成功加入《${updatedPlan.title}》！已與小組同伴連線共行！`);
  };

  // Copy Invite Code helper
  const handleCopyInvite = (code: string, title: string) => {
    const text = `【晨星共行】邀請您一同追求《${title}》！請在網站首頁點選 6-Emoji 邀請碼：${code}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast(`📋 已複製 6-Emoji 邀請碼【${code}】與邀請訊息，可直接發送至通訊群組！`);
  };

  // Admin: Create / Edit / Delete Plan
  const handleCreateThematicPlan = (newPlan: PursuitPlan) => {
    const cleanNewPlan: PursuitPlan = {
      ...newPlan,
      completedUnits: 0,
    };
    const updated = [cleanNewPlan, ...plansRef.current];
    savePlans(updated);
    syncUserJoinedPlansStorage(user.id, updated);
    setSelectedPlanId(cleanNewPlan.id);
    showToast(`✨ 成功開啟主題追求《${cleanNewPlan.title}》！專屬 6-Emoji 邀請碼：${cleanNewPlan.inviteCode}`);
  };

  const handleSaveCurrentPlan = (updatedPlan: PursuitPlan) => {
    const updated = plansRef.current.map((p) => {
      if (p.id === updatedPlan.id) {
        // 編輯主題設定時，嚴格保留所有成員陣列與各人獨立進度，絕不讓主題共用欄位覆蓋個人進度
        return {
          ...updatedPlan,
          completedUnits: 0,
          members: p.members || updatedPlan.members || [],
        };
      }
      return p;
    });
    savePlans(updated);

    // If title changed, also sync post.planTitle for posts belonging to this plan
    const currentPosts = postsRef.current;
    const updatedPosts = currentPosts.map((post) => {
      if (post.planId === updatedPlan.id) {
        return { ...post, planTitle: updatedPlan.title };
      }
      return post;
    });
    if (updatedPosts.some((p, i) => p.planTitle !== currentPosts[i]?.planTitle)) {
      savePosts(updatedPosts);
    }

    setEditingPlan(null);
    showToast(`📖 已成功儲存追求主題《${updatedPlan.title}》的內容與設定！`);
  };

  const handleDeletePlan = (planId: string, planTitle: string) => {
    const currentPlans = plansRef.current;
    const planIndex = currentPlans.findIndex((p) => p.id === planId);
    const planToDelete = currentPlans[planIndex];
    if (!planToDelete) return;

    const remainingPlans = currentPlans.filter((p) => p.id !== planId);
    savePlans(remainingPlans);
    deletePlanFromBackend(planId);

    // 級聯刪除該追求主題的所有貼文
    const currentPosts = postsRef.current;
    const deletedPostsForPlan = currentPosts.filter((p) => p.planId === planId);
    const remainingPosts = currentPosts.filter((p) => p.planId !== planId);
    savePosts(remainingPosts);

    // 級聯刪除該追求主題的所有小鈴鐺提醒
    const currentNotifs = notificationsRef.current;
    const deletedNotifsForPlan = currentNotifs.filter((n) => n.planId === planId);
    const remainingNotifs = currentNotifs.filter((n) => n.planId !== planId);
    saveNotifications(remainingNotifs);

    // Sync joined plans for all users
    allUsersRef.current.forEach((u) => {
      syncUserJoinedPlansStorage(u.id, remainingPlans);
    });
    syncUserJoinedPlansStorage(user.id, remainingPlans);

    const prevSelectedPlanId = selectedPlanId;
    if (selectedPlanId === planId) {
      setSelectedPlanId(remainingPlans[0]?.id || '');
    }

    showToastWithAction(
      `🗑️ 已刪除追求主題《${planTitle}》`,
      '↺ 立即復原',
      () =>
        handleRestorePlan(
          planToDelete,
          planIndex,
          deletedPostsForPlan,
          deletedNotifsForPlan,
          prevSelectedPlanId
        )
    );
  };

  const handleBatchDeletePlans = (planIds: string[]) => {
    if (planIds.length === 0) return;
    const planIdSet = new Set(planIds);
    const remainingPlans = plansRef.current.filter((p) => !planIdSet.has(p.id));
    savePlans(remainingPlans);

    // Delete from backend database
    planIds.forEach((pid) => deletePlanFromBackend(pid));

    // Cascade delete posts
    const remainingPosts = postsRef.current.filter((p) => !p.planId || !planIdSet.has(p.planId));
    savePosts(remainingPosts);

    // Cascade delete notifications
    const remainingNotifs = notificationsRef.current.filter((n) => !n.planId || !planIdSet.has(n.planId));
    saveNotifications(remainingNotifs);

    // Sync joined plans for all users
    allUsersRef.current.forEach((u) => {
      syncUserJoinedPlansStorage(u.id, remainingPlans);
    });
    syncUserJoinedPlansStorage(user.id, remainingPlans);

    if (planIdSet.has(selectedPlanId)) {
      setSelectedPlanId(remainingPlans[0]?.id || '');
    }

    showToast(`🗑️ 已批量刪除 ${planIds.length} 個追求主題`);
  };

  const handleRestorePlan = (
    plan: PursuitPlan,
    index: number,
    restoredPosts: SharingPost[],
    restoredNotifs: AppNotification[],
    prevSelectedId: string
  ) => {
    const currentPlans = plansRef.current;
    if (currentPlans.some((p) => p.id === plan.id)) return;
    const next = [...currentPlans];
    const insertAt = Math.min(Math.max(0, index), next.length);
    next.splice(insertAt, 0, plan);
    savePlans(next);
    allUsersRef.current.forEach((u) => {
      syncUserJoinedPlansStorage(u.id, next);
    });
    syncUserJoinedPlansStorage(user.id, next);

    if (restoredPosts.length > 0) {
      const currentPosts = postsRef.current;
      const nextPosts = [...restoredPosts.filter((rp) => !currentPosts.some((cp) => cp.id === rp.id)), ...currentPosts];
      savePosts(nextPosts);
    }

    if (restoredNotifs.length > 0) {
      const currentNotifs = notificationsRef.current;
      const nextNotifs = [...restoredNotifs.filter((rn) => !currentNotifs.some((cn) => cn.id === rn.id)), ...currentNotifs];
      saveNotifications(nextNotifs);
    }

    if (prevSelectedId === plan.id) {
      setSelectedPlanId(plan.id);
    }

    showToast(`✨ 已成功復原追求主題《${plan.title}》與相關資料！`);
  };

  // Admin: Add / Remove User from Plan
  const handleAddUserToPlan = (planId: string, targetUser: UserProfile) => {
    const todayStr = getUTC8DateString();
    let targetPlanTitle = '';
    const updated = plansRef.current.map((p) => {
      if (p.id === planId) {
        targetPlanTitle = p.title;
        const alreadyMember = (p.members || []).some((m) => m.userId === targetUser.id);
        if (alreadyMember) return p;
        const planUnit = p.unitName || (p.category === 'bible' || p.category.includes('nt') ? '章' : '篇');
        return {
          ...p,
          members: [
            ...(p.members || []),
            {
              userId: targetUser.id,
              name: targetUser.name,
              avatar: targetUser.avatar,
              locality: targetUser.locality,
              joinedAt: todayStr,
              todayCompleted: false,
              streakDays: targetUser.streakDays || 0,
              completedUnits: 0,
              currentUnitTitle: `第 1 ${planUnit}`,
              lastActive: '今日加入',
              encouragedToday: false,
            },
          ],
        };
      }
      return p;
    });
    savePlans(updated);
    syncUserJoinedPlansStorage(targetUser.id, updated);
    showToast(`✨ 已使【${targetUser.name}】加入《${targetPlanTitle}》追求！`);
  };

  const handleRemoveUserFromPlan = (planId: string, userId: string, userName: string) => {
    const currentPlans = plansRef.current;
    const targetPlan = currentPlans.find((p) => p.id === planId);
    const targetPlanTitle = targetPlan?.title || '';
    const removedMember = targetPlan?.members.find((m) => m.userId === userId);

    const updated = currentPlans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          members: (p.members || []).filter((m) => m.userId !== userId),
        };
      }
      return p;
    });
    savePlans(updated);
    syncUserJoinedPlansStorage(userId, updated);

    if (removedMember) {
      showToastWithAction(
        `👋 已使【${userName}】退出《${targetPlanTitle}》追求`,
        '↺ 復原加入',
        () => handleRestoreUserToPlan(planId, removedMember, targetPlanTitle)
      );
    } else {
      showToast(`👋 已使【${userName}】退出《${targetPlanTitle}》追求。`);
    }
  };

  const handleRestoreUserToPlan = (planId: string, member: ThematicMember, planTitle: string) => {
    const updated = plansRef.current.map((p) => {
      if (p.id === planId) {
        if ((p.members || []).some((m) => m.userId === member.userId)) return p;
        return {
          ...p,
          members: [...(p.members || []), member],
        };
      }
      return p;
    });
    savePlans(updated);
    syncUserJoinedPlansStorage(member.userId, updated);
    showToast(`✨ 已成功將【${member.name}】重新加入《${planTitle}》追求！`);
  };

  // Admin: Batch Operations (批量處理)
  const handleBatchAddUsersToPlan = (planId: string, targetUsers: UserProfile[]) => {
    if (!targetUsers.length) return;
    const currentPlans = plansRef.current;
    const targetPlan = currentPlans.find((p) => p.id === planId);
    const targetPlanTitle = targetPlan?.title || '';
    const todayStr = getUTC8DateString();

    const updated = currentPlans.map((p) => {
      if (p.id === planId) {
        const existingIds = new Set((p.members || []).map((m) => m.userId));
        const planUnit = p.unitName || (p.category === 'bible' || p.category.includes('nt') ? '章' : '篇');
        const newMembers: ThematicMember[] = targetUsers
          .filter((u) => !existingIds.has(u.id))
          .map((u) => ({
            userId: u.id,
            name: u.name,
            avatar: u.avatar,
            locality: u.locality,
            joinedAt: todayStr,
            todayCompleted: false,
            streakDays: u.streakDays || 0,
            completedUnits: 0,
            currentUnitTitle: `第 1 ${planUnit}`,
            lastActive: '批量加入',
            encouragedToday: false,
          }));
        return {
          ...p,
          members: [...(p.members || []), ...newMembers],
        };
      }
      return p;
    });
    savePlans(updated);
    targetUsers.forEach((u) => syncUserJoinedPlansStorage(u.id, updated));
    showToast(`✨ 已成功將 ${targetUsers.length} 位聖徒批量加入《${targetPlanTitle}》！`);
  };

  const handleBatchRemoveUsersFromPlan = (planId: string, userIds: string[]) => {
    if (!userIds.length) return;
    const currentPlans = plansRef.current;
    const targetPlan = currentPlans.find((p) => p.id === planId);
    const targetPlanTitle = targetPlan?.title || '';
    const removeSet = new Set(userIds);

    const updated = currentPlans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          members: (p.members || []).filter((m) => !removeSet.has(m.userId)),
        };
      }
      return p;
    });
    savePlans(updated);
    userIds.forEach((uid) => syncUserJoinedPlansStorage(uid, updated));
    showToast(`👋 已將 ${userIds.length} 位聖徒批量移出《${targetPlanTitle}》追求。`);
  };

  const handleBatchResetUserProgress = (userIds: string[]) => {
    if (!userIds.length) return;
    const idSet = new Set(userIds);

    const nextUsers = allUsersRef.current.map((u) => {
      if (idSet.has(u.id)) {
        const resetU = { ...u, streakDays: 0, totalChaptersRead: 0 };
        try {
          localStorage.setItem(getUserStorageKey(u.id, 'profile'), JSON.stringify(resetU));
          localStorage.setItem(getUserStorageKey(u.id, 'completed_today'), JSON.stringify(false));
          localStorage.setItem(getUserStorageKey(u.id, 'daily_units_history'), JSON.stringify({}));
          plansRef.current.forEach((pl) => {
            try {
              localStorage.removeItem(getUserStorageKey(u.id, `plan_${pl.id}_completed_units`));
              localStorage.removeItem(getUserStorageKey(u.id, `plan_${pl.id}_completed_today`));
            } catch (e) {}
          });
        } catch (e) {}
        return resetU;
      }
      return u;
    });

    saveAllUsers(nextUsers);

    const updatedPlans = plansRef.current.map((p) => ({
      ...p,
      members: (p.members || []).map((m) =>
        idSet.has(m.userId)
          ? {
              ...m,
              streakDays: 0,
              todayCompleted: false,
              completedUnits: 0,
              currentUnitTitle: '第 1 篇',
              encouragedToday: false,
            }
          : m
      ),
    }));
    savePlans(updatedPlans);

    if (idSet.has(user.id)) {
      setUser((prev) => ({ ...prev, streakDays: 0, totalChaptersRead: 0 }));
      setIsCompletedToday(false);
      setDailyPursuitHistory({});
      try {
        sessionStorage.setItem('morningstar_current_user', JSON.stringify({ ...user, streakDays: 0, totalChaptersRead: 0 }));
      } catch (e) {}
    }

    showToast(`↺ 已成功將 ${userIds.length} 位聖徒的追求進度與追求地圖批量重設歸零！`);
  };

  const handleBatchToggleUserAdminRole = (userIds: string[], nextRole: UserRole) => {
    if (!userIds.length) return;
    const idSet = new Set(userIds);

    let changedCount = 0;
    let protectedAdminCount = 0;

    const nextUsers = allUsersRef.current.map((u) => {
      if (idSet.has(u.id)) {
        // 就算全選轉為一般聖徒，管理員身分也不能被更改！
        if (nextRole === 'user' && u.role === 'admin') {
          protectedAdminCount++;
          return u;
        }
        changedCount++;
        const updated = { ...u, role: nextRole };
        try {
          localStorage.setItem(getUserStorageKey(u.id, 'profile'), JSON.stringify(updated));
        } catch (e) {}
        return updated;
      }
      return u;
    });

    saveAllUsers(nextUsers);

    if (idSet.has(user.id)) {
      if (!(nextRole === 'user' && user.role === 'admin')) {
        setUser((prev) => ({ ...prev, role: nextRole }));
        if (nextRole !== 'admin') {
          setIsAdminMode(false);
        }
      }
    }

    showToast(
      nextRole === 'admin'
        ? `🛡️ 已將 ${changedCount} 位聖徒批量設為管理員！`
        : protectedAdminCount > 0
        ? `已將 ${changedCount} 位聖徒轉為一般追求聖徒（依安全原則，${protectedAdminCount} 位管理員身分受保護未被更改）。`
        : `已將 ${changedCount} 位聖徒批量轉為一般追求聖徒。`
    );
  };

  const handleBatchDeleteUsers = (userIds: string[]) => {
    const toDelete = userIds.filter((id) => id !== user.id);
    if (!toDelete.length) {
      showToast('⚠️ 無法刪除當前登入之管理員本人帳號。');
      return;
    }
    const delSet = new Set(toDelete);
    const nextUsers = allUsersRef.current.filter((u) => !delSet.has(u.id));
    saveAllUsers(nextUsers);

    // Call backend API for persistent deletion
    toDelete.forEach((uid) => deleteUserFromBackend(uid));

    try {
      toDelete.forEach((uid) => {
        try {
          localStorage.removeItem(getUserStorageKey(uid, 'profile'));
          localStorage.removeItem(getUserStorageKey(uid, 'joined_plans'));
          localStorage.removeItem(getUserStorageKey(uid, 'completed_today'));
          localStorage.removeItem(getUserStorageKey(uid, 'daily_units_history'));
        } catch (e) {}
      });
    } catch (e) {}

    const updatedPlans = plansRef.current.map((p) => ({
      ...p,
      members: (p.members || []).filter((m) => !delSet.has(m.userId)),
    }));
    savePlans(updatedPlans);

    showToast(`🗑️ 已成功批量刪除 ${toDelete.length} 個帳號！`);
  };

  // Admin: Create Admin / Toggle Admin Role / Delete User
  const handleToggleUserAdminRole = async (userId: string, nextRole: UserRole, userName: string) => {
    const currentUsers = allUsersRef.current;
    const target = currentUsers.find((u) => u.id === userId);
    if (!target) return;

    const updatedTarget: UserProfile = { ...target, role: nextRole };
    const nextUsers = currentUsers.map((u) => (u.id === userId ? updatedTarget : u));
    saveAllUsers(nextUsers);

    try {
      localStorage.setItem(getUserStorageKey(userId, 'profile'), JSON.stringify(updatedTarget));

      if (userId === user.id) {
        setUser(updatedTarget);
        localStorage.setItem('morningstar_current_user', JSON.stringify(updatedTarget));
        sessionStorage.setItem('morningstar_current_user', JSON.stringify(updatedTarget));
        if (nextRole !== 'admin') {
          setIsAdminMode(false);
        }
      }
    } catch (e) {}

    if (nextRole === 'admin') {
      showToast(`🛡️ 已將【${userName}】設為管理員！`);
    } else {
      showToast(`已解除【${userName}】的管理員權限，轉為一般聖徒。`);
    }
  };

  const handleCreateUser = (newUser: UserProfile) => {
    const currentUsers = allUsersRef.current;
    const nextUsers = [newUser, ...currentUsers.filter((u) => u.email !== newUser.email && u.id !== newUser.id)];
    saveAllUsers(nextUsers);

    try {
      localStorage.setItem(getUserStorageKey(newUser.id, 'profile'), JSON.stringify(newUser));
      localStorage.setItem(getUserStorageKey(newUser.id, 'joined_plans'), JSON.stringify(newUser.joinedInviteCodes || []));
    } catch (e) {}

    const roleName = newUser.role === 'admin' ? '管理員' : '聖徒人員';
    showToast(`✨ 已成功新增${roleName}【${newUser.name}】（${newUser.email}）！`);
  };
  const handleCreateAdminUser = handleCreateUser;

  const handleDeleteRegisteredUser = (userId: string, userName: string) => {
    const currentUsers = allUsersRef.current;
    const userToDelete = currentUsers.find((u) => u.id === userId);
    if (!userToDelete) return;

    const currentPlans = plansRef.current;
    const deletedUserMemberships: { planId: string; member: ThematicMember }[] = [];
    currentPlans.forEach((p) => {
      const m = (p.members || []).find((mem) => mem.userId === userId);
      if (m) {
        deletedUserMemberships.push({ planId: p.id, member: m });
      }
    });

    const prevProfileStr = typeof window !== 'undefined' ? localStorage.getItem(getUserStorageKey(userId, 'profile')) : null;
    const prevJoinedPlansStr = typeof window !== 'undefined' ? localStorage.getItem(getUserStorageKey(userId, 'joined_plans')) : null;
    const prevCompletedTodayStr = typeof window !== 'undefined' ? localStorage.getItem(getUserStorageKey(userId, 'completed_today')) : null;
    const prevDailyHistoryStr = typeof window !== 'undefined' ? localStorage.getItem(getUserStorageKey(userId, 'daily_units_history')) : null;

    const nextUsers = currentUsers.filter((u) => u.id !== userId);
    saveAllUsers(nextUsers);
    deleteUserFromBackend(userId);

    try {
      localStorage.removeItem(getUserStorageKey(userId, 'profile'));
      localStorage.removeItem(getUserStorageKey(userId, 'joined_plans'));
      localStorage.removeItem(getUserStorageKey(userId, 'completed_today'));
      localStorage.removeItem(getUserStorageKey(userId, 'daily_units_history'));
    } catch (e) {}

    const updatedPlans = currentPlans.map((p) => ({
      ...p,
      members: (p.members || []).filter((m) => m.userId !== userId),
    }));
    savePlans(updatedPlans);

    showToastWithAction(
      `🗑️ 已刪除人員【${userName}】`,
      '↺ 立即復原',
      () =>
        handleRestoreDeletedUser(
          userToDelete,
          deletedUserMemberships,
          prevProfileStr,
          prevJoinedPlansStr,
          prevCompletedTodayStr,
          prevDailyHistoryStr
        )
    );
  };

  const handleRestoreDeletedUser = (
    userToRestore: UserProfile,
    memberships: { planId: string; member: ThematicMember }[],
    profileStr: string | null,
    joinedPlansStr: string | null,
    completedTodayStr: string | null,
    dailyHistoryStr: string | null = null
  ) => {
    try {
      const delStr = localStorage.getItem('morningstar_deleted_user_ids');
      if (delStr) {
        const delIds: string[] = JSON.parse(delStr);
        const nextDel = delIds.filter((id) => id !== userToRestore.id);
        localStorage.setItem('morningstar_deleted_user_ids', JSON.stringify(nextDel));
      }

      const regStr = localStorage.getItem('morningstar_registered_users');
      const regList: UserProfile[] = regStr ? JSON.parse(regStr) : [];
      if (!regList.some((u) => u.id === userToRestore.id)) {
        regList.push(userToRestore);
      }
      localStorage.setItem('morningstar_registered_users', JSON.stringify(regList));

      if (profileStr) {
        localStorage.setItem(getUserStorageKey(userToRestore.id, 'profile'), profileStr);
      } else {
        localStorage.setItem(
          getUserStorageKey(userToRestore.id, 'profile'),
          JSON.stringify(userToRestore)
        );
      }
      if (joinedPlansStr) {
        localStorage.setItem(getUserStorageKey(userToRestore.id, 'joined_plans'), joinedPlansStr);
      }
      if (completedTodayStr) {
        localStorage.setItem(
          getUserStorageKey(userToRestore.id, 'completed_today'),
          completedTodayStr
        );
      }
      if (dailyHistoryStr) {
        localStorage.setItem(
          getUserStorageKey(userToRestore.id, 'daily_units_history'),
          dailyHistoryStr
        );
      }
    } catch (e) {}

    const updatedPlans = plansRef.current.map((p) => {
      const memRecord = memberships.find((m) => m.planId === p.id);
      if (memRecord && !(p.members || []).some((m) => m.userId === userToRestore.id)) {
        return {
          ...p,
          members: [...(p.members || []), memRecord.member],
        };
      }
      return p;
    });
    savePlans(updatedPlans);

    const currentUsers = allUsersRef.current;
    const nextAll = currentUsers.some((u) => u.id === userToRestore.id)
      ? currentUsers
      : [...currentUsers, userToRestore];
    saveAllUsers(nextAll);
    showToast(`✨ 已成功復原人員【${userToRestore.name}】！`);
  };

  // Admin: Generate 10-character random temporary password for user who requested forgot password
  const handleResetUserPassword = async (userId: string, userName: string): Promise<string> => {
    try {
      const currentUsers = allUsersRef.current;
      const target = currentUsers.find((u) => u.id === userId);
      if (!target) return '';

      const tempCode = generateRandomTempPassword(10);
      const defaultHashed = await hashPasswordWeb(tempCode);
      const updatedTarget: UserProfile = {
        ...target,
        password: defaultHashed,
        tempPassword: tempCode,
        mustChangePassword: true,
        passwordResetRequested: true,
      };

      // 1. Update individual user profile storage
      localStorage.setItem(getUserStorageKey(userId, 'profile'), JSON.stringify(updatedTarget));

      // 2. Update morningstar_registered_users & backend
      const nextUsers = currentUsers.map((u) => (u.id === userId ? updatedTarget : u));
      if (!nextUsers.some((u) => u.id === userId)) {
        nextUsers.push(updatedTarget);
      }
      saveAllUsers(nextUsers);

      // 3. If current logged-in user is target, update active user state
      if (userId === user.id) {
        setUser(updatedTarget);
        sessionStorage.setItem('morningstar_current_user', JSON.stringify(updatedTarget));
      }

      showToast(`🔑 已為【${userName}】產生 10 位臨時密碼並已複製！`);
      return tempCode;
    } catch (e) {
      console.error('Failed to reset user password to temp code:', e);
      return '';
    }
  };

  // Admin: Reset user's pursuit progress back to zero
  const handleResetUserProgress = (userId: string, userName: string) => {
    const currentUsers = allUsersRef.current;
    const target = currentUsers.find((u) => u.id === userId);
    if (!target) return;

    // Save snapshot before reset
    const prevStreakDays = target.streakDays;
    const prevTotalChaptersRead = target.totalChaptersRead;
    const prevCompletedToday = (() => {
      try {
        const str = localStorage.getItem(getUserStorageKey(userId, 'completed_today'));
        return str ? JSON.parse(str) : false;
      } catch (e) {
        return false;
      }
    })();
    const prevDailyUnitsHistory = (() => {
      try {
        const str = localStorage.getItem(getUserStorageKey(userId, 'daily_units_history'));
        return str ? JSON.parse(str) : {};
      } catch (e) {
        return {};
      }
    })();

    const prevPlanProgress: {
      planId: string;
      completedUnits: number;
      currentUnitTitle: string;
      memberState?: ThematicMember;
    }[] = [];

    const currentPlans = plansRef.current;
    currentPlans.forEach((p) => {
      const m = (p.members || []).find((mem) => mem.userId === userId);
      if (m) {
        prevPlanProgress.push({
          planId: p.id,
          completedUnits: p.completedUnits,
          currentUnitTitle: p.currentUnitTitle,
          memberState: { ...m },
        });
      }
    });

    const updatedTarget: UserProfile = {
      ...target,
      streakDays: 0,
      totalChaptersRead: 0,
    };

    const nextUsers = currentUsers.map((u) => (u.id === userId ? updatedTarget : u));
    saveAllUsers(nextUsers);

    try {
      localStorage.setItem(getUserStorageKey(userId, 'profile'), JSON.stringify(updatedTarget));
      localStorage.setItem(getUserStorageKey(userId, 'completed_today'), JSON.stringify(false));
      localStorage.setItem(getUserStorageKey(userId, 'daily_units_history'), JSON.stringify({}));
    } catch (e) {}

    if (userId === user.id) {
      setUser(updatedTarget);
      setIsCompletedToday(false);
      setDailyPursuitHistory({});
      try {
        sessionStorage.setItem('morningstar_current_user', JSON.stringify(updatedTarget));
      } catch (e) {}
    }

    // Reset members in all plans
    const updatedPlans = currentPlans.map((p) => {
      const hasMember = (p.members || []).some((m) => m.userId === userId);
      if (!hasMember) return p;

      const updatedMembers = p.members.map((m) => {
        if (m.userId === userId) {
          try {
            localStorage.removeItem(getUserStorageKey(userId, `plan_${p.id}_completed_units`));
            localStorage.removeItem(getUserStorageKey(userId, `plan_${p.id}_completed_today`));
          } catch (e) {}
          return {
            ...m,
            todayCompleted: false,
            streakDays: 0,
            completedUnits: 0,
            currentUnitTitle: '第 1 篇',
            encouragedToday: false,
          };
        }
        return m;
      });

      return {
        ...p,
        members: updatedMembers,
      };
    });

    savePlans(updatedPlans);

    showToastWithAction(
      `↺ 已重設【${userName}】的追求進度與追求地圖`,
      '↺ 復原重設',
      () =>
        handleRestoreUserProgress(
          userId,
          userName,
          prevStreakDays,
          prevTotalChaptersRead,
          prevCompletedToday,
          prevPlanProgress,
          prevDailyUnitsHistory
        )
    );
  };

  const handleRestoreUserProgress = (
    userId: string,
    userName: string,
    prevStreak: number,
    prevChapters: number,
    prevCompletedToday: boolean,
    prevPlanProgress: {
      planId: string;
      completedUnits: number;
      currentUnitTitle: string;
      memberState?: ThematicMember;
    }[],
    prevDailyHistory: Record<string, number> = {}
  ) => {
    const currentUsers = allUsersRef.current;
    const target = currentUsers.find((u) => u.id === userId) || user;
    const restoredTarget: UserProfile = {
      ...target,
      streakDays: prevStreak,
      totalChaptersRead: prevChapters,
    };

    const nextAll = currentUsers.map((u) => (u.id === userId ? restoredTarget : u));
    saveAllUsers(nextAll);

    try {
      localStorage.setItem(getUserStorageKey(userId, 'profile'), JSON.stringify(restoredTarget));
      localStorage.setItem(
        getUserStorageKey(userId, 'completed_today'),
        JSON.stringify(prevCompletedToday)
      );
      localStorage.setItem(
        getUserStorageKey(userId, 'daily_units_history'),
        JSON.stringify(prevDailyHistory)
      );
    } catch (e) {}

    if (userId === user.id) {
      setUser(restoredTarget);
      setIsCompletedToday(prevCompletedToday);
      setDailyPursuitHistory(prevDailyHistory);
      try {
        sessionStorage.setItem('morningstar_current_user', JSON.stringify(restoredTarget));
      } catch (e) {}
    }

    const updatedPlans = plansRef.current.map((p) => {
      const savedProgress = prevPlanProgress.find((pp) => pp.planId === p.id);
      if (!savedProgress) return p;

      const updatedMembers = p.members.map((m) => {
        if (m.userId === userId && savedProgress.memberState) {
          return { ...savedProgress.memberState };
        }
        return m;
      });

      return {
        ...p,
        completedUnits: savedProgress.completedUnits,
        currentUnitTitle: savedProgress.currentUnitTitle,
        members: updatedMembers,
      };
    });

    savePlans(updatedPlans);
    showToast(`✨ 已成功復原【${userName}】的追求進度與追求地圖！`);
  };

  const handleInAppForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInAppChangeError(null);

    if (!inAppNewPassword || inAppNewPassword.length < 6) {
      setInAppChangeError('新密碼長度請至少設定 6 位字元。');
      return;
    }
    if (inAppNewPassword !== inAppConfirmPassword) {
      setInAppChangeError('兩次輸入的新密碼不一致，請重新確認。');
      return;
    }

    const hashedPassword = await hashPasswordWeb(inAppNewPassword);
    const updatedUser: UserProfile = {
      ...user,
      password: hashedPassword,
      tempPassword: undefined,
      mustChangePassword: false,
      passwordResetRequested: false,
    };

    handleUpdateProfile(updatedUser);
    showToast('🔑 新密碼設定成功！已為您解除強制重設鎖定。');
    setInAppNewPassword('');
    setInAppConfirmPassword('');
  };

  // Check-in toggle (per-plan, per-user isolated)
  const handleToggleComplete = () => {
    const activePlanId = rawCurrentPlan?.id || selectedPlanId;
    const rawTargetPlan = plansRef.current.find((p) => p.id === activePlanId);
    const currentMember = rawTargetPlan?.members?.find((m) => m.userId === user.id);
    const prevPlanCompleted = currentMember ? Boolean(currentMember.todayCompleted) : isCompletedToday;
    const nextState = !prevPlanCompleted;

    setIsCompletedToday(nextState);
    try {
      localStorage.setItem(getUserStorageKey(user.id, 'completed_today'), JSON.stringify(nextState));
    } catch (e) {}

    let chapterDelta = 1;

    // Update in plan members as well (per-user independent progress)
    if (activePlanId) {
      const updatedPlans = plansRef.current.map((p) => {
        if (p.id === activePlanId) {
          const currentMemberUnits = getUserPlan(p, user.id).completedUnits;

          const isNT = p.category === 'nt-half-year';
          const isNTSpeed = p.category === 'nt-speed-reading';
          let increment = 1;
          if (isNT) {
            increment = 2;
          } else if (isNTSpeed) {
            const pace = calculateNTSpeedPace(p.startDate, p.endDate, currentMemberUnits);
            increment = Math.max(1, Math.round(pace.dailyTargetChapters));
          }

          const newCompleted = nextState
            ? (isNTSpeed ? currentMemberUnits + increment : Math.min(currentMemberUnits + increment, p.totalUnits))
            : Math.max(0, currentMemberUnits - increment);

          chapterDelta = nextState
            ? newCompleted - currentMemberUnits
            : currentMemberUnits - newCompleted;

          const nextUnitNum = isNTSpeed
            ? (newCompleted % 260) + 1
            : Math.min(newCompleted + 1, p.totalUnits);
          const pUnit = p.unitName || (p.category === 'bible' || isNT || isNTSpeed ? '章' : '篇');
          let currentUnitTitle = `第 ${nextUnitNum} ${pUnit}`;
          let currentVerses = p.currentVerses;
          if (isNT) {
            currentUnitTitle = getTodayNTSchedule(newCompleted).schedule.displayText;
            currentVerses = currentUnitTitle;
          } else if (isNTSpeed) {
            const loc = getNTChapterLocation((newCompleted % 260) + 1);
            currentUnitTitle = `第 ${Math.floor(newCompleted / 260) + 1} 遍 · ${loc.displayText}`;
            currentVerses = loc.displayText;
          }

          const toggleDateStr = getUTC8DateString();
          let updatedMembers = (p.members || []).map((m) =>
            m.userId === user.id
              ? {
                  ...m,
                  todayCompleted: nextState,
                  lastCompletedDate: nextState ? toggleDateStr : undefined,
                  completedUnits: newCompleted,
                  currentUnitTitle,
                  currentVerses,
                  lastActive: '今日 剛剛',
                }
              : m
          );
          if (!updatedMembers.some((m) => m.userId === user.id)) {
            updatedMembers.push({
              userId: user.id,
              name: user.name,
              avatar: user.avatar,
              locality: user.locality,
              joinedAt: toggleDateStr,
              todayCompleted: nextState,
              lastCompletedDate: nextState ? toggleDateStr : undefined,
              streakDays: user.streakDays,
              lastActive: '今日 剛剛',
              encouragedToday: false,
              completedUnits: newCompleted,
              currentUnitTitle,
              currentVerses,
            });
          }

          try {
            localStorage.setItem(getUserStorageKey(user.id, `plan_${p.id}_completed_units`), JSON.stringify(newCompleted));
            localStorage.setItem(getUserStorageKey(user.id, `plan_${p.id}_completed_today`), JSON.stringify(nextState));
            localStorage.setItem(getUserStorageKey(user.id, 'completed_today_date'), toggleDateStr);
          } catch (e) {}

          return {
            ...p,
            members: updatedMembers,
          };
        }
        return p;
      });
      savePlans(updatedPlans);
    }

    const todayStr = getUTC8DateString();
    setDailyPursuitHistory((prev) => {
      const cur = prev[todayStr] || 0;
      const nextVal = nextState ? cur + (chapterDelta || 1) : Math.max(0, cur - (chapterDelta || 1));
      const updated = { ...prev, [todayStr]: nextVal };
      try {
        localStorage.setItem(getUserStorageKey(user.id, 'daily_units_history'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (nextState) {
      updateCurrentUserAndSync((prev) => ({
        ...prev,
        streakDays: prev.streakDays + 1,
        totalChaptersRead: prev.totalChaptersRead + (chapterDelta || 1),
      }));
      showToast('✨ 今日追求完成！晨星在心裡出現，追求帳幕已累積屬靈信物！');
    } else {
      updateCurrentUserAndSync((prev) => ({
        ...prev,
        streakDays: Math.max(0, prev.streakDays - 1),
        totalChaptersRead: Math.max(0, prev.totalChaptersRead - (chapterDelta || 1)),
      }));
      showToastWithAction(
        '已取消今日打卡狀態',
        '↺ 復原打卡',
        () => handleToggleComplete()
      );
    }
  };

  // Set reading progress up to targetChapter (一次設定讀到第幾篇/章，只可往前推進，提供 10 秒即時復原，時間到鎖定不可往回修改)
  const handleSetProgressBatch = (targetChapter: number) => {
    const activePlanId = rawCurrentPlan?.id || selectedPlanId;
    if (!activePlanId) return;
    const rawTargetPlan = plansRef.current.find((p) => p.id === activePlanId);
    if (!rawTargetPlan) return;
    const targetPlan = getUserPlan(rawTargetPlan, user.id);
    const prevPlanCompleted = Boolean(rawTargetPlan.members?.find((m) => m.userId === user.id)?.todayCompleted);

    const isNT = targetPlan.category === 'nt-half-year';
    const isNTSpeed = targetPlan.category === 'nt-speed-reading';
    const planUnit = targetPlan.unitName || (targetPlan.category === 'bible' || isNT || isNTSpeed ? '章' : '篇');

    if (targetChapter <= targetPlan.completedUnits) {
      showToast(`⚠️ 追求進度只能往前推進，不可往回修改（目前已完成第 ${targetPlan.completedUnits} ${planUnit}）。`);
      return;
    }

    const boundedChapter = isNTSpeed ? targetChapter : Math.min(targetChapter, targetPlan.totalUnits);
    const deltaChapters = boundedChapter - targetPlan.completedUnits;
    const nextUnitNum = isNTSpeed
      ? (boundedChapter % 260) + 1
      : Math.min(boundedChapter + 1, targetPlan.totalUnits);
    let nextUnitTitle = `第 ${nextUnitNum} ${planUnit}`;
    let nextVerses = targetPlan.currentVerses;
    if (isNT) {
      nextUnitTitle = getTodayNTSchedule(boundedChapter).schedule.displayText;
      nextVerses = nextUnitTitle;
    } else if (isNTSpeed) {
      const loc = getNTChapterLocation((boundedChapter % 260) + 1);
      nextUnitTitle = `第 ${Math.floor(boundedChapter / 260) + 1} 遍 · ${loc.displayText}`;
      nextVerses = loc.displayText;
    }

    const snapshot: ProgressUndoSnapshot = {
      planId: targetPlan.id,
      planTitle: targetPlan.title,
      unitName: planUnit,
      prevCompletedUnits: targetPlan.completedUnits,
      prevCurrentUnitTitle: targetPlan.currentUnitTitle,
      prevTotalChaptersRead: user.totalChaptersRead,
      prevTodayCompleted: prevPlanCompleted,
      newCompletedUnits: boundedChapter,
      secondsRemaining: 10,
    };

    const batchDateStr = getUTC8DateString();
    // Update plans (per-user independent progress)
    const updatedPlans = plansRef.current.map((p) => {
      if (p.id === activePlanId) {
        let updatedMembers = (p.members || []).map((m) =>
          m.userId === user.id
            ? {
                ...m,
                todayCompleted: true,
                lastCompletedDate: batchDateStr,
                completedUnits: boundedChapter,
                currentUnitTitle: nextUnitTitle,
                currentVerses: nextVerses,
                lastActive: '今日 剛剛',
              }
            : m
        );
        if (!updatedMembers.some((m) => m.userId === user.id)) {
          updatedMembers.push({
            userId: user.id,
            name: user.name,
            avatar: user.avatar,
            locality: user.locality,
            joinedAt: batchDateStr,
            todayCompleted: true,
            lastCompletedDate: batchDateStr,
            streakDays: user.streakDays,
            lastActive: '今日 剛剛',
            encouragedToday: false,
            completedUnits: boundedChapter,
            currentUnitTitle: nextUnitTitle,
            currentVerses: nextVerses,
          });
        }
        return {
          ...p,
          members: updatedMembers,
        };
      }
      return p;
    });
    savePlans(updatedPlans);

    try {
      localStorage.setItem(getUserStorageKey(user.id, `plan_${activePlanId}_completed_units`), JSON.stringify(boundedChapter));
      localStorage.setItem(getUserStorageKey(user.id, `plan_${activePlanId}_completed_today`), JSON.stringify(true));
      localStorage.setItem(getUserStorageKey(user.id, 'completed_today_date'), batchDateStr);
    } catch (e) {}

    // Update user and sync to backend
    updateCurrentUserAndSync((prev) => ({
      ...prev,
      totalChaptersRead: prev.totalChaptersRead + deltaChapters,
      streakDays: prevPlanCompleted ? prev.streakDays : prev.streakDays + 1,
    }));

    const todayStr = getUTC8DateString();
    setDailyPursuitHistory((prev) => {
      const cur = prev[todayStr] || 0;
      const updated = { ...prev, [todayStr]: cur + deltaChapters };
      try {
        localStorage.setItem(getUserStorageKey(user.id, 'daily_units_history'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setIsCompletedToday(true);
    setProgressUndo(snapshot);

    showToastWithAction(
      `📖 已設定《${targetPlan.title}》進度至第 ${boundedChapter} ${planUnit}（推進 ${deltaChapters} ${planUnit}，10秒內可復原）`,
      '↺ 立即復原',
      () => handleUndoProgress(snapshot)
    );
  };

  // Undo progress change
  const handleUndoProgress = (snapshotOverride?: ProgressUndoSnapshot) => {
    const snap = snapshotOverride || progressUndo;
    if (!snap) return;

    const snapUnit = snap.unitName || '篇';

    const updatedPlans = plansRef.current.map((p) => {
      if (p.id === snap.planId) {
        const updatedMembers = (p.members || []).map((m) =>
          m.userId === user.id
            ? {
                ...m,
                todayCompleted: snap.prevTodayCompleted,
                completedUnits: snap.prevCompletedUnits,
                currentUnitTitle: snap.prevCurrentUnitTitle || `第 ${Math.min(snap.prevCompletedUnits + 1, p.totalUnits)} ${snapUnit}`,
              }
            : m
        );
        return {
          ...p,
          members: updatedMembers,
        };
      }
      return p;
    });
    savePlans(updatedPlans);
    try {
      localStorage.setItem(getUserStorageKey(user.id, `plan_${snap.planId}_completed_units`), JSON.stringify(snap.prevCompletedUnits));
      localStorage.setItem(getUserStorageKey(user.id, `plan_${snap.planId}_completed_today`), JSON.stringify(snap.prevTodayCompleted));
    } catch (e) {}

    const deltaRevert = snap.newCompletedUnits - snap.prevCompletedUnits;
    updateCurrentUserAndSync((prev) => ({
      ...prev,
      totalChaptersRead: Math.max(0, prev.totalChaptersRead - deltaRevert),
      streakDays: !snap.prevTodayCompleted ? Math.max(0, prev.streakDays - 1) : prev.streakDays,
    }));

    const todayStr = getUTC8DateString();
    setDailyPursuitHistory((prev) => {
      const cur = prev[todayStr] || 0;
      const updated = { ...prev, [todayStr]: Math.max(0, cur - deltaRevert) };
      try {
        localStorage.setItem(getUserStorageKey(user.id, 'daily_units_history'), JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setIsCompletedToday(snap.prevTodayCompleted);
    setProgressUndo(null);
    showToast(`✨ 已成功復原《${snap.planTitle}》進度至第 ${snap.prevCompletedUnits} ${snapUnit}！`);
  };

  // Advance progress for extra chapters read today (strictly using current user's independent progress)
  const handleAdvanceProgress = () => {
    const activePlanId = rawCurrentPlan?.id || selectedPlanId;
    if (!activePlanId) return;
    const rawTargetPlan = plansRef.current.find((p) => p.id === activePlanId);
    if (!rawTargetPlan) return;
    const targetPlan = getUserPlan(rawTargetPlan, user.id);
    const isNTSpeed = targetPlan.category === 'nt-speed-reading';
    if (!isNTSpeed && targetPlan.completedUnits >= targetPlan.totalUnits) {
      showToast('🎉 本主題所有篇目已追求完成！');
      return;
    }
    const isNT = targetPlan.category === 'nt-half-year';
    const increment = isNT ? 2 : 1;
    handleSetProgressBatch(
      isNTSpeed
        ? targetPlan.completedUnits + increment
        : Math.min(targetPlan.totalUnits, targetPlan.completedUnits + increment)
    );
  };

  // Publish Light
  const handlePublishLight = (
    newPostData: Omit<SharingPost, 'id' | 'createdAt' | 'reactions' | 'comments'>
  ) => {
    if (!siteSettingsRef.current.allowSharingPosts) {
      showToast('🔒 目前全站發表摸著與亮光分享功能已暫時停用');
      return;
    }
    const newPost: SharingPost = {
      ...newPostData,
      authorId: user.id,
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
      reactions: {
        amenCount: 0,
        amenUserIds: [],
        amenUserNames: [],
      },
      comments: [],
    };

    const updatedPosts = [newPost, ...postsRef.current];
    savePosts(updatedPosts);

    // 分享篇數與追求進度篇數同步
    const unitMatch = newPostData.unitTitle.match(/第\s*(\d+)\s*篇/) || newPostData.unitTitle.match(/(\d+)/);
    const sharedUnitNum = unitMatch ? parseInt(unitMatch[1], 10) : null;
    const wasPlanCompletedToday = Boolean(rawCurrentPlan?.members?.find((m) => m.userId === user.id)?.todayCompleted);

    if (newPostData.planId) {
      const updatedPlans = plansRef.current.map((p) => {
        if (p.id === newPostData.planId) {
          const isNT = p.category === 'nt-half-year';
          const isNTSpeed = p.category === 'nt-speed-reading';
          const pUnit = p.unitName || (p.category === 'bible' || isNT || isNTSpeed ? '章' : '篇');
          const currentMemberUnits = getUserPlan(p, user.id).completedUnits;
          const nextCompleted = sharedUnitNum !== null
            ? (isNTSpeed ? Math.max(currentMemberUnits, sharedUnitNum) : Math.min(Math.max(currentMemberUnits, sharedUnitNum), p.totalUnits))
            : (isNTSpeed ? currentMemberUnits : Math.min(currentMemberUnits, p.totalUnits));
          const nextUnitNum = isNTSpeed
            ? (nextCompleted % 260) + 1
            : Math.min(nextCompleted + 1, p.totalUnits);
          let calculatedUnitTitle = `第 ${nextUnitNum} ${pUnit}`;
          let calculatedVerses = p.currentVerses;
          if (isNT) {
            calculatedUnitTitle = getTodayNTSchedule(nextCompleted).schedule.displayText;
            calculatedVerses = calculatedUnitTitle;
          } else if (isNTSpeed) {
            const loc = getNTChapterLocation((nextCompleted % 260) + 1);
            calculatedUnitTitle = `第 ${Math.floor(nextCompleted / 260) + 1} 遍 · ${loc.displayText}`;
            calculatedVerses = loc.displayText;
          }

          let updatedMembers = (p.members || []).map((m) =>
            m.userId === user.id
              ? {
                  ...m,
                  todayCompleted: true,
                  completedUnits: nextCompleted,
                  currentUnitTitle: calculatedUnitTitle,
                  currentVerses: calculatedVerses,
                  lastActive: '今日 剛剛',
                }
              : m
          );
          if (!updatedMembers.some((m) => m.userId === user.id)) {
            updatedMembers.push({
              userId: user.id,
              name: user.name,
              avatar: user.avatar,
              locality: user.locality,
              joinedAt: getUTC8DateString(),
              todayCompleted: true,
              streakDays: user.streakDays,
              lastActive: '今日 剛剛',
              encouragedToday: false,
              completedUnits: nextCompleted,
              currentUnitTitle: calculatedUnitTitle,
              currentVerses: calculatedVerses,
            });
          }
          try {
            localStorage.setItem(getUserStorageKey(user.id, `plan_${p.id}_completed_units`), JSON.stringify(nextCompleted));
            localStorage.setItem(getUserStorageKey(user.id, `plan_${p.id}_completed_today`), JSON.stringify(true));
          } catch (e) {}
          return {
            ...p,
            members: updatedMembers,
          };
        }
        return p;
      });
      savePlans(updatedPlans);
    }

    setIsCompletedToday(true);
    try {
      localStorage.setItem(getUserStorageKey(user.id, 'completed_today'), JSON.stringify(true));
    } catch (e) {}

    updateCurrentUserAndSync((prev) => ({
      ...prev,
      totalSharesCount: prev.totalSharesCount + 1,
      streakDays: wasPlanCompletedToday ? prev.streakDays : prev.streakDays + 1,
      totalChaptersRead:
        sharedUnitNum !== null
          ? Math.max(prev.totalChaptersRead, sharedUnitNum)
          : prev.totalChaptersRead + 1,
    }));

    showToast('🌟 亮光分享已發布！同伴們能看見並同聲阿們！');
  };

  const handleToggleAmen = (postId: string) => {
    if (!siteSettingsRef.current.allowMutualAmens) {
      showToast('🔒 目前全站同聲阿們互動功能已暫時停用');
      return;
    }
    let targetPost: SharingPost | null = null;
    let addedAmen = false;

    const currentPosts = postsRef.current;
    const updated = currentPosts.map((p) => {
      if (p.id === postId) {
        targetPost = p;
        const currentIds = p.reactions.amenUserIds || [];
        const hasReacted = currentIds.includes(user.id);
        addedAmen = !hasReacted;
        const nextIds = hasReacted
          ? currentIds.filter((uid) => uid !== user.id)
          : [...currentIds, user.id];
        const nextNames = hasReacted
          ? (p.reactions.amenUserNames || []).filter((n) => n !== user.name)
          : [...(p.reactions.amenUserNames || []).filter((n) => n !== user.name), user.name];

        return {
          ...p,
          reactions: {
            ...p.reactions,
            amenCount: hasReacted ? Math.max(0, p.reactions.amenCount - 1) : p.reactions.amenCount + 1,
            userReactedAmen: !hasReacted,
            amenUserIds: nextIds,
            amenUserNames: nextNames,
          },
        };
      }
      return p;
    });
    savePosts(updated);

    if (addedAmen && targetPost) {
      const postObj = targetPost as SharingPost;
      // 找出貼文真實作者 ID（優先取 authorId，若無則從 allUsers 中比對作者姓名）
      const authorUserId =
        postObj.authorId ||
        allUsersRef.current.find((u) => u.name === postObj.authorName)?.id;

      // 自己對自己的分享點按阿們，不產生通知提醒自己
      if (authorUserId && authorUserId !== user.id) {
        const cleanPlanTitle = (postObj.planTitle || '').replace(/^主題：/, '').trim();
        const cleanUnitTitle = (postObj.unitTitle || '').trim();

        let targetDesc = '';
        if (cleanPlanTitle && cleanUnitTitle) {
          targetDesc = `《${cleanPlanTitle}》【${cleanUnitTitle}】亮光分享`;
        } else if (cleanUnitTitle) {
          targetDesc = `【${cleanUnitTitle}】亮光分享`;
        } else if (cleanPlanTitle) {
          targetDesc = `《${cleanPlanTitle}》亮光分享`;
        } else {
          targetDesc = '亮光分享';
        }

        const newNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'post_amen',
          actorName: user.name,
          actorAvatar: user.avatar,
          recipientUserId: authorUserId,
          targetTitle: targetDesc,
          planId: postObj.planId,
          createdAt: new Date().toISOString(),
          read: false,
        };
        saveNotifications([newNotif, ...notificationsRef.current]);
      }
    }
  };


  const handleAddComment = (postId: string, content: string) => {
    if (!siteSettingsRef.current.allowComments) {
      showToast('🔒 目前全站留言回應功能已暫時停用');
      return;
    }
    let targetPost: SharingPost | null = null;
    const currentPosts = postsRef.current;
    const updated = currentPosts.map((p) => {
      if (p.id === postId) {
        targetPost = p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c-${Date.now()}`,
              authorName: user.name,
              authorAvatar: user.avatar,
              content,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return p;
    });
    savePosts(updated);

    if (targetPost) {
      const postObj = targetPost as SharingPost;
      // 找出貼文作者（相容舊版資料與名稱比對）
      const recipientId =
        postObj.authorId ||
        allUsersRef.current.find((u) => u.name === postObj.authorName)?.id;

      // 自己在自己的貼文下方留言不通知自己；同伴留言則產生通知提醒作者
      if (recipientId && recipientId !== user.id) {
        const preview = content.trim().slice(0, 28);
        const snippet = `${preview}${content.trim().length > 28 ? '...' : ''}`;
        const cleanPlanTitle = (postObj.planTitle || '').replace(/^主題：/, '').trim();
        const cleanUnitTitle = (postObj.unitTitle || '').trim();

        let targetDesc = '';
        if (cleanPlanTitle && cleanUnitTitle) {
          targetDesc = `《${cleanPlanTitle}》【${cleanUnitTitle}】亮光分享`;
        } else if (cleanUnitTitle) {
          targetDesc = `【${cleanUnitTitle}】亮光分享`;
        } else if (cleanPlanTitle) {
          targetDesc = `《${cleanPlanTitle}》亮光分享`;
        } else {
          targetDesc = '亮光分享';
        }

        const newNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          type: 'post_comment',
          actorName: user.name,
          actorAvatar: user.avatar,
          recipientUserId: recipientId,
          targetTitle: `${targetDesc}：「${snippet}」`,
          planId: postObj.planId,
          createdAt: new Date().toISOString(),
          read: false,
        };
        saveNotifications([newNotif, ...notificationsRef.current]);
        showToast('💬 留言已送出');
        return;
      }
    }

    showToast('💬 留言已送出');
  };

  const handleEditPost = (postId: string, newReflection: string, newUnitTitle?: string) => {
    let targetPost: SharingPost | null = null;
    const currentPosts = postsRef.current;
    const updated = currentPosts.map((p) => {
      if (p.id === postId) {
        targetPost = p;
        return {
          ...p,
          keyVerse: '',
          reflection: newReflection,
          unitTitle: newUnitTitle ? newUnitTitle : p.unitTitle,
        };
      }
      return p;
    });
    savePosts(updated);

    // 若使用者修改了分享篇數，同步更新該主題之追求進度
    if (newUnitTitle && targetPost) {
      const targetPlanId = (targetPost as SharingPost).planId;
      const authorId = (targetPost as SharingPost).authorId;
      const unitMatch = newUnitTitle.match(/第\s*(\d+)\s*篇/) || newUnitTitle.match(/(\d+)/);
      const editedUnitNum = unitMatch ? parseInt(unitMatch[1], 10) : null;
      if (editedUnitNum !== null && targetPlanId) {
        const updatedPlans = plansRef.current.map((p) => {
          if (p.id === targetPlanId) {
            const isNT = p.category === 'nt-half-year';
            const isNTSpeed = p.category === 'nt-speed-reading';
            const pUnit = p.unitName || (p.category === 'bible' || isNT || isNTSpeed ? '章' : '篇');
            const currentMemberUnits = getUserPlan(p, authorId).completedUnits;
            const nextCompleted = isNTSpeed
              ? Math.max(currentMemberUnits, editedUnitNum)
              : Math.min(Math.max(currentMemberUnits, editedUnitNum), p.totalUnits);
            const nextUnitNum = isNTSpeed
              ? (nextCompleted % 260) + 1
              : Math.min(nextCompleted + 1, p.totalUnits);
            let calculatedUnitTitle = `第 ${nextUnitNum} ${pUnit}`;
            let calculatedVerses = p.currentVerses;
            if (isNT) {
              calculatedUnitTitle = getTodayNTSchedule(nextCompleted).schedule.displayText;
              calculatedVerses = calculatedUnitTitle;
            } else if (isNTSpeed) {
              const loc = getNTChapterLocation((nextCompleted % 260) + 1);
              calculatedUnitTitle = `第 ${Math.floor(nextCompleted / 260) + 1} 遍 · ${loc.displayText}`;
              calculatedVerses = loc.displayText;
            }

            const updatedMembers = (p.members || []).map((m) =>
              m.userId === authorId
                ? {
                    ...m,
                    completedUnits: nextCompleted,
                    currentUnitTitle: calculatedUnitTitle,
                    currentVerses: calculatedVerses,
                  }
                : m
            );
            try {
              localStorage.setItem(getUserStorageKey(authorId, `plan_${p.id}_completed_units`), JSON.stringify(nextCompleted));
            } catch (e) {}
            return {
              ...p,
              members: updatedMembers,
            };
          }
          return p;
        });
        savePlans(updatedPlans);
      }
    }

    showToast('✨ 已更新您的分享內容與篇數，進度已同步！');
  };

  const handleDeletePost = (postId: string) => {
    const currentPosts = postsRef.current;
    const postIndex = currentPosts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;
    const postToDelete = currentPosts[postIndex];
    const isAuthor = postToDelete.authorId === user.id || postToDelete.authorName === user.name;
    const next = currentPosts.filter((p) => p.id !== postId);
    savePosts(next);
    deletePostFromBackend(postId);

    if (isAuthor) {
      updateCurrentUserAndSync((prev) => ({
        ...prev,
        totalSharesCount: Math.max(0, (prev.totalSharesCount || 0) - 1),
      }));
    }

    const snippet =
      postToDelete.reflection.length > 18
        ? `${postToDelete.reflection.slice(0, 18)}...`
        : postToDelete.reflection;

    showToastWithAction(
      `已刪除 ${postToDelete.authorName} 的分享：「${snippet}」`,
      '↺ 立即復原',
      () => handleRestorePost(postToDelete, postIndex, isAuthor)
    );
  };

  const handleRestorePost = (postToRestore: SharingPost, index: number, isAuthor: boolean) => {
    const currentPosts = postsRef.current;
    if (currentPosts.some((p) => p.id === postToRestore.id)) return;
    const next = [...currentPosts];
    const insertAt = Math.min(Math.max(0, index), next.length);
    next.splice(insertAt, 0, postToRestore);
    savePosts(next);

    if (isAuthor) {
      updateCurrentUserAndSync((prev) => ({
        ...prev,
        totalSharesCount: (prev.totalSharesCount || 0) + 1,
      }));
    }

    showToast('✨ 已成功復原該則亮光分享！');
  };

  const handleEditComment = (postId: string, commentId: string, newContent: string) => {
    const currentPosts = postsRef.current;
    const updated = currentPosts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map((c) =>
            c.id === commentId ? { ...c, content: newContent } : c
          ),
        };
      }
      return p;
    });
    savePosts(updated);
    showToast('✨ 已更新您的留言！');
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    const currentPosts = postsRef.current;
    const targetPost = currentPosts.find((p) => p.id === postId);
    if (!targetPost) return;

    const commentIndex = targetPost.comments.findIndex((c) => c.id === commentId);
    const commentToDelete = targetPost.comments[commentIndex];
    if (!commentToDelete) return;

    const updated = currentPosts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.filter((c) => c.id !== commentId),
        };
      }
      return p;
    });
    savePosts(updated);

    const record: DeletedCommentRecord = {
      postId,
      comment: commentToDelete,
      index: commentIndex,
    };
    const snippet = commentToDelete.content.length > 16
      ? `${commentToDelete.content.slice(0, 16)}...`
      : commentToDelete.content;

    showToastWithAction(
      `已刪除 ${commentToDelete.authorName} 的留言：「${snippet}」`,
      '↺ 立即復原',
      () => handleRestoreComment(record)
    );
  };

  const handleRestoreComment = (recordToRestore?: DeletedCommentRecord | null) => {
    const target = recordToRestore || recentlyDeletedComment;
    if (!target) return;

    const currentPosts = postsRef.current;
    const updated = currentPosts.map((p) => {
      if (p.id === target.postId) {
        const nextComments = [...p.comments];
        const insertAt = Math.min(Math.max(0, target.index), nextComments.length);
        nextComments.splice(insertAt, 0, target.comment);
        return {
          ...p,
          comments: nextComments,
        };
      }
      return p;
    });
    savePosts(updated);

    setRecentlyDeletedComment(null);
    showToast('✨ 已成功復原留言！');
  };

  const handleRemindMember = (planId: string, memberId: string, memberName: string) => {
    const updated = plansRef.current.map((p) => {
      if (p.id === planId) {
        const updatedMembers = (p.members || []).map((m) =>
          m.userId === memberId ? { ...m, encouragedToday: true } : m
        );
        return { ...p, members: updatedMembers };
      }
      return p;
    });
    savePlans(updated);
    showToast(`🔔 已向 ${memberName} 送出晨更溫馨提醒！`);
  };

  const handleSaveSanctuary = (newConfig: SanctuaryConfig) => {
    updateCurrentUserAndSync((prev) => ({
      ...prev,
      sanctuary: newConfig,
    }));
    showToast('✨ 追求帳幕佈置已更新！已保存至您的專屬天地。');
  };

  const handleAmenCompanion = (companionId: string, companionName: string) => {
    setCompanionAmenMap((prev) => ({ ...prev, [companionId]: true }));
    updateCurrentUserAndSync((prev) => ({
      ...prev,
      totalAmenReceived: prev.totalAmenReceived + 1,
    }));

    if (companionId && companionId !== user.id) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        type: 'sanctuary_amen',
        actorName: user.name,
        actorAvatar: user.avatar,
        recipientUserId: companionId,
        targetTitle: '造訪了您的「追求帳幕」並按了「✨ 阿們」互勉',
        planId: selectedPlanId || undefined,
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotifications([newNotif, ...notificationsRef.current]);
    }

    showToast(`🕊️ 已為 ${companionName} 的追求生活阿們！同心在主愛中奔跑！`);
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notificationsRef.current.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleClearNotifications = () => {
    const prevNotifications = [...notificationsRef.current];
    saveNotifications([]);
    clearNotificationsFromBackend(user.id);
    showToastWithAction(
      '🧹 已清空通知提醒列表',
      '↺ 立即復原',
      () => handleRestoreNotifications(prevNotifications)
    );
  };

  const handleRestoreNotifications = (restored: AppNotification[]) => {
    saveNotifications(restored);
    showToast('✨ 已成功復原通知提醒！');
  };

  // Filter notifications: only show notifications directed to current user, excluding actions made by oneself
  const visibleNotifications = notifications.filter((n) => {
    // 過濾假資料或測試通知
    if (
      n.id === 'notif-1' ||
      n.id === 'notif-2' ||
      n.actorName === '測試聖徒 1' ||
      n.actorName === '測試聖徒 2'
    ) {
      return false;
    }
    // 不顯示自己觸發的通知
    if (n.actorName === user.name) return false;
    // 若有指定接收者，只要接收者為目前使用者（相容舊版 user-me）即顯示
    if (n.recipientUserId) {
      return (
        n.recipientUserId === user.id ||
        (user.id === 'user-chen-guang' && n.recipientUserId === 'user-me')
      );
    }
    // 嚴格防止群組廣播：只有真正發給自己的通知才顯示，不再以 planId 廣播
    return false;
  });

  const viewingCompanionSanctuary = viewingCompanion
    ? allUsers.find((u) => u.id === viewingCompanion.id)?.sanctuary || DEFAULT_SANCTUARY_CONFIG
    : DEFAULT_SANCTUARY_CONFIG;

  const viewingCompanionUser = viewingCompanion
    ? allUsers.find((u) => u.id === viewingCompanion.id) || {
        id: viewingCompanion.id,
        name: viewingCompanion.name,
        email: '',
        streakDays: viewingCompanion.streakDays || 0,
        totalChaptersRead: viewingCompanion.completedUnits || 0,
        totalSharesCount: 0,
        totalAmenReceived: 0,
        avatar: viewingCompanion.avatar,
      }
    : null;

  const viewingCompanionDailyHistory = viewingCompanionUser
    ? loadUserDailyHistory(viewingCompanionUser)
    : {};

  const displayThemeClass =
    user.displayMode === 'warm'
      ? 'theme-warm bg-[#f4eee1] text-stone-900'
      : user.displayMode === 'dark'
      ? 'theme-dark bg-slate-950 text-stone-100'
      : 'theme-light bg-[#fafaf9] text-stone-900';

  const planForEditModal = editingPlan || currentPlan;

  // Prevent flash of defaultUser (晨光弟兄) on page refresh before client storage resolves
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-150">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center animate-pulse text-xl shadow-xs">
            ✨
          </div>
          <span className="text-xs text-stone-400 font-medium tracking-wide">載入追求生活...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage allUsers={allUsers} siteSettings={siteSettings} onLoginSuccess={handleLogin} />
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-stone-700/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[90vw]">
            <span className="truncate">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={toast.action.onClick}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 flex-shrink-0"
              >
                <span>{toast.action.label}</span>
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col pb-20 md:pb-12 transition-colors duration-300 ${displayThemeClass}`}>
      {/* Top Header with Admin Mode Switcher and Notification Bell */}
      <Header
        user={user}
        isLoggedIn={isLoggedIn}
        isAdminMode={isAdminMode}
        hasJoinedPlans={userJoinedPlans.length > 0}
        allowJoinByInviteCode={siteSettings.allowJoinByInviteCode}
        notifications={visibleNotifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onToggleAdminMode={() => setIsAdminMode((prev) => !prev)}
        onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenPlanSelector={() => setIsThemesDrawerOpen(true)}
        onOpenDrawer={() => setIsThemesDrawerOpen(true)}
        onToggleDrawer={() => setIsThemesDrawerOpen((prev) => !prev)}
        isDrawerOpen={isThemesDrawerOpen}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      {/* Fixed Header Height Placeholder */}
      <div className="h-16 flex-shrink-0" aria-hidden="true" />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoggedIn && user.role === 'admin' && isAdminMode ? (
          /* In-Page Admin Workbench */
          <AdminPanel
            adminUser={user}
            plans={plans}
            allUsers={allUsers}
            siteSettings={siteSettings}
            onUpdateSiteSettings={handleUpdateSiteSettings}
            builtinUserIds={demoUsers.map((u) => u.id)}
            onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
            onEditPlan={(plan) => {
              setEditingPlan(plan);
              setIsEditPursuitOpen(true);
            }}
            onDeletePlan={handleDeletePlan}
            onRemindMember={(planId, memberId, memberName) =>
              handleRemindMember(planId, memberId, memberName)
            }
            onAddUserToPlan={handleAddUserToPlan}
            onRemoveUserFromPlan={handleRemoveUserFromPlan}
            onToggleUserAdminRole={handleToggleUserAdminRole}
            onCreateAdminUser={handleCreateUser}
            onCreateUser={handleCreateUser}
            onDeleteRegisteredUser={handleDeleteRegisteredUser}
            onResetUserPassword={handleResetUserPassword}
            onResetUserProgress={handleResetUserProgress}
            onBatchAddUsersToPlan={handleBatchAddUsersToPlan}
            onBatchRemoveUsersFromPlan={handleBatchRemoveUsersFromPlan}
            onBatchResetProgress={handleBatchResetUserProgress}
            onBatchToggleRole={handleBatchToggleUserAdminRole}
            onBatchDeleteUsers={handleBatchDeleteUsers}
            onBatchDeletePlans={handleBatchDeletePlans}
            onCopyInvite={handleCopyInvite}
            onSwitchToUserMode={() => setIsAdminMode(false)}
          />
        ) : userJoinedPlans.length === 0 && !isAdminMode && user.role !== 'admin' ? (
          /* Empty Pursuits: Centered Join By Code Page (一般聖徒未加入任何追求時只出現置中輸入邀請碼頁面；管理員不顯示此頁) */
          <div className="py-6 sm:py-12 flex items-center justify-center min-h-[calc(100vh-220px)]">
            <JoinByCodePage
              allPlans={plans}
              joinedPlanIds={joinedPlanIds}
              onJoinSuccess={handleJoinByCodeSuccess}
              isAdmin={false}
              allowJoinByInviteCode={siteSettings.allowJoinByInviteCode}
              onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
              onSwitchAdminMode={() => setIsAdminMode(true)}
            />
          </div>
        ) : userJoinedPlans.length === 0 && user.role === 'admin' && !isAdminMode ? (
          /* Admin Empty Joined Plans State (管理員尚未加入任何追求主題時呈現管理引導頁面，絕不呈現未加入的主題內容) */
          <div className="py-12 flex items-center justify-center min-h-[calc(100vh-220px)]">
            <div className="max-w-md w-full mx-auto p-8 rounded-3xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-3xl">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
                {plans.length === 0 ? '尚未建立追求主題' : '尚未加入任何追求主題'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 font-serif leading-relaxed">
                {plans.length === 0
                  ? '身為管理同工，請直接開啟新的追求主題，帶領聖徒同心合意竭力追求主話！'
                  : '您身為管理同工，目前尚未加入任何追求主題。您可以前往「控制台」將自己加入主題成員，或是開啟新的追求主題！'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setIsAdminMode(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>進入管理控制台</span>
                </button>
                <button
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>開啟新追求主題</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* General User Pursuit Mode (with joined pursuit plans) */
          <>
            {/* Banner Greeting */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-200/20 to-transparent border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-amber-900 tracking-wide">
                      晨更清明・靈裡火熱
                    </p>
                    <span className="text-[10px] text-stone-600 bg-white/80 px-2 py-0.5 rounded-full border border-amber-200/50">
                      個人身份：{user.name}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-serif">
                    「直等到天發亮，晨星在你們心裏出現，你們就作得好了。」（彼後一19）
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {siteSettings.allowSharingPosts && (
                  <button
                    onClick={() => {
                      if (!currentPlan) {
                        if (user.role === 'admin') {
                          showToast('💡 請先在左側「追求主題」開啟或選擇專題，即可發表摸著！');
                          setIsThemesDrawerOpen(true);
                        } else {
                          showToast('💡 請先在左側選單點選「輸入 6-Emoji 邀請碼」加入追求小組，即可發表摸著！');
                          setIsThemesDrawerOpen(true);
                        }
                      } else {
                        setIsShareModalOpen(true);
                      }
                    }}
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>發表今日摸著</span>
                  </button>
                )}
              </div>
            </div>

            {/* User Workspace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left/Center Column (7-8 cols on Desktop) */}
              <div
                className={`md:col-span-7 lg:col-span-8 space-y-6 sm:space-y-8 ${
                  mobileTab === 'today' || mobileTab === 'feed' ? 'block' : 'hidden md:block'
                }`}
              >
                {/* Today's Thematic Pursuit Card & Morning Watch Sanctuary */}
                <div className={`space-y-6 ${mobileTab === 'feed' ? 'hidden md:block' : 'block'}`}>
                  <TodayPursuitCard
                    plan={currentPlan}
                    joinedPlans={userJoinedPlans}
                    onSelectPlan={(id) => setSelectedPlanId(id)}
                    isCompletedToday={isCurrentPlanCompletedToday}
                    onToggleComplete={handleToggleComplete}
                    onAdvanceProgress={handleAdvanceProgress}
                    onOpenSetProgress={() => setIsSetProgressOpen(true)}
                    onCatchUpProgress={handleSetProgressBatch}
                    progressUndo={progressUndo}
                    onUndoProgress={() => handleUndoProgress()}
                    onOpenShareModal={() => setIsShareModalOpen(true)}
                    onOpenPlanSelector={() => setIsThemesDrawerOpen(true)}
                    onOpenEditModal={() => {
                      setEditingPlan(rawCurrentPlan || currentPlan);
                      setIsEditPursuitOpen(true);
                    }}
                    onCopyInvite={handleCopyInvite}
                    onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
                    isAdmin={isLoggedIn && user.role === 'admin'}
                    siteSettings={siteSettings}
                  />

                  {/* Personal Pursuit Sanctuary (個人追求帳幕) */}
                  <SanctuaryCard
                    user={user}
                    sanctuaryConfig={user.sanctuary || DEFAULT_SANCTUARY_CONFIG}
                    currentPlan={currentPlan}
                    joinedPlans={userJoinedPlans}
                    posts={posts}
                    onOpenCustomize={() => setIsSanctuaryCustomizeOpen(true)}
                    onOpenCollection={() => setIsRelicsCollectionOpen(true)}
                  />
                </div>

                {/* Companions Feed */}
                <div className={mobileTab === 'today' ? 'hidden md:block' : 'block'}>
                  <CompanionsFeed
                    posts={feedPosts}
                    activePlanTitle={currentPlan?.title}
                    activePlanId={currentPlan?.id}
                    joinedPlans={userJoinedPlans}
                    currentUserId={user.id}
                    currentUserName={user.name}
                    isAdmin={isLoggedIn && user.role === 'admin'}
                    onToggleAmen={handleToggleAmen}
                    onAddComment={handleAddComment}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    recentlyDeletedComment={recentlyDeletedComment}
                    onRestoreComment={handleRestoreComment}
                    hasJoinedPlans={joinedPlanIds.length > 0}
                    onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
                    siteSettings={siteSettings}
                  />
                </div>
              </div>

              {/* Right Sidebar Column (4-5 cols on Desktop) */}
              <div
                className={`md:col-span-5 lg:col-span-4 space-y-6 ${
                  mobileTab === 'companions' || mobileTab === 'stats'
                    ? 'block'
                    : 'hidden md:block'
                }`}
              >
                {/* Companions Status Panel */}
                <div className={mobileTab === 'stats' ? 'hidden md:block' : 'block'}>
                  <CompanionsStatusList
                    companions={currentCompanions}
                    currentUserId={user.id}
                    isAdmin={isLoggedIn && user.role === 'admin'}
                    allowSanctuaryVisit={siteSettings.allowSanctuaryVisit}
                    onRemindCompanion={(companionId) => {
                      if (selectedPlanId) {
                        const comp = currentCompanions.find((c) => c.id === companionId);
                        if (comp) handleRemindMember(selectedPlanId, companionId, comp.name);
                      }
                    }}
                    onViewSanctuary={(comp) => {
                      if (!siteSettings.allowSanctuaryVisit) {
                        showToast('🔒 目前全站同伴追求帳幕互訪功能已關閉');
                        return;
                      }
                      setViewingCompanion(comp);
                    }}
                  />
                </div>

                {/* Pursuit Map (追求地圖：精緻小巧版，置於右側欄位) */}
                <div className={mobileTab === 'companions' ? 'hidden md:block' : 'block'}>
                  <PursuitMap
                    userId={user.id}
                    userName={user.name}
                    unitName={
                      currentPlan?.unitName ||
                      (currentPlan?.category === 'bible' ||
                      currentPlan?.category === 'nt-half-year' ||
                      currentPlan?.category === 'nt-speed-reading'
                        ? '章'
                        : '篇')
                    }
                    dailyHistory={dailyPursuitHistory}
                    todayCompleted={isCurrentPlanCompletedToday}
                  />
                </div>

                {/* Quick Stats & Encouragement Box */}
                <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs text-stone-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {user.name} 的追求統計
                    </div>
                    <button
                      onClick={() => setIsStatsModalOpen(true)}
                      className="text-xs text-amber-800 hover:underline font-medium"
                    >
                      追求歷程
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-stone-50 rounded-2xl border border-stone-100">
                    <div>
                      <div className="text-lg font-bold text-amber-700">{user.streakDays}</div>
                      <div className="text-[10px] text-stone-500">連續天數</div>
                    </div>
                    <div className="border-x border-stone-200">
                      <div className="text-lg font-bold text-stone-800">{user.totalChaptersRead}</div>
                      <div className="text-[10px] text-stone-500">已讀篇數</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-stone-800">{user.totalSharesCount}</div>
                      <div className="text-[10px] text-stone-500">亮光分享</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 flex items-start gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      「同那清心呼求主的人，竭力追求公義、信、愛、和平。」連續追求第{' '}
                      <strong className="text-amber-700">{user.streakDays}</strong> 天！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-stone-200/60 text-center text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>晨星共行 © 2026 · 與清心呼求主的人一同竭力追求</span>
        </footer>
      </main>

      {/* Floating Action / Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-stone-700/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[90vw]">
          <span className="truncate">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={toast.action.onClick}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 flex-shrink-0"
            >
              <span>{toast.action.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation (Only visible when user has joined pursuits) */}
      {!isAdminMode && userJoinedPlans.length > 0 && (
        <BottomNav
          activeTab={mobileTab}
          onChangeTab={(tab) => setMobileTab(tab)}
          feedCount={visiblePosts.length}
        />
      )}

      {/* Modals */}
      <JoinByCodeModal
        isOpen={isJoinByCodeOpen}
        onClose={() => setIsJoinByCodeOpen(false)}
        allPlans={plans}
        joinedPlanIds={joinedPlanIds}
        onJoinSuccess={handleJoinByCodeSuccess}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        isLoggedIn={isLoggedIn}
        allUsers={allUsers}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />

      <CreateThematicPlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        adminUser={user}
        onCreateThematicPlan={handleCreateThematicPlan}
      />

      {planForEditModal && (
        <EditCurrentPursuitModal
          isOpen={isEditPursuitOpen}
          onClose={() => {
            setIsEditPursuitOpen(false);
            setEditingPlan(null);
          }}
          currentPlan={planForEditModal}
          onSavePlan={handleSaveCurrentPlan}
        />
      )}

      {currentPlan && (
        <SetProgressModal
          isOpen={isSetProgressOpen}
          onClose={() => setIsSetProgressOpen(false)}
          plan={currentPlan}
          onConfirmSetProgress={handleSetProgressBatch}
        />
      )}

      {currentPlan && (
        <LightShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          currentPlan={currentPlan}
          userId={user.id}
          userName={user.name}
          userAvatar={user.avatar}
          isCompletedToday={isCurrentPlanCompletedToday}
          onPublish={handlePublishLight}
        />
      )}

      {/* Left Slide-out Themes Drawer (追求主題與邀請碼滑出欄) */}
      <ThemesDrawer
        isOpen={isThemesDrawerOpen}
        onClose={() => setIsThemesDrawerOpen(false)}
        plans={plans}
        joinedPlans={userJoinedPlans}
        currentPlanId={selectedPlanId}
        onSelectPlan={(id) => setSelectedPlanId(id)}
        onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
        onOpenCreatePlan={() => setIsCreatePlanOpen(true)}
        isAdmin={isLoggedIn && user.role === 'admin'}
        allowJoinByInviteCode={siteSettings.allowJoinByInviteCode}
      />

      <PlanSelectorModal
        isOpen={isPlanSelectorOpen}
        onClose={() => setIsPlanSelectorOpen(false)}
        plans={userJoinedPlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={(id) => setSelectedPlanId(id)}
        onCreateNewPlan={() => {
          setIsPlanSelectorOpen(false);
          setIsCreatePlanOpen(true);
        }}
        isAdmin={isLoggedIn && user.role === 'admin'}
        onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
        allowJoinByInviteCode={siteSettings.allowJoinByInviteCode}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        user={user}
      />

      {/* Sanctuary Modals */}
      <SanctuaryCustomizeModal
        isOpen={isSanctuaryCustomizeOpen}
        onClose={() => setIsSanctuaryCustomizeOpen(false)}
        user={user}
        currentPlan={currentPlan}
        joinedPlans={userJoinedPlans}
        posts={posts}
        currentConfig={user.sanctuary || DEFAULT_SANCTUARY_CONFIG}
        onSaveConfig={handleSaveSanctuary}
      />

      <RelicsCollectionModal
        isOpen={isRelicsCollectionOpen}
        onClose={() => setIsRelicsCollectionOpen(false)}
        user={user}
        currentPlan={currentPlan}
        joinedPlans={userJoinedPlans}
        posts={posts}
        onOpenJoinByCode={() => setIsJoinByCodeOpen(true)}
      />

      <CompanionSanctuaryModal
        isOpen={!!viewingCompanion}
        onClose={() => setViewingCompanion(null)}
        companion={viewingCompanion}
        companionSanctuary={viewingCompanionSanctuary}
        onAmenCompanion={handleAmenCompanion}
        hasAmenedToday={viewingCompanion ? !!companionAmenMap[viewingCompanion.id] : false}
        dailyHistory={viewingCompanionDailyHistory}
        unitName={currentPlan?.unitName || viewingCompanion?.unitName || '章'}
      />

      {/* Mandatory Force Change Password Modal if logged-in user has mustChangePassword === true */}
      {isLoggedIn && user.mustChangePassword && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 touch-none overscroll-none"
        >
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4 overscroll-contain">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">需要設定專屬新密碼</h3>
                <p className="text-xs text-stone-500">管理員已為您的帳號重設臨時密碼</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
              親愛的 <strong>{user.name}</strong> 聖徒，為了確保您的帳號安全與追求檔案獨立性，請在此設定全新的個人密碼方可繼續使用系統。
            </p>

            <form onSubmit={handleInAppForceChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  設定新密碼 (至少 6 位字元)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={inAppNewPassword}
                  onChange={(e) => setInAppNewPassword(e.target.value)}
                  placeholder="請輸入您的新密碼"
                  className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  再次確認新密碼
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={inAppConfirmPassword}
                  onChange={(e) => setInAppConfirmPassword(e.target.value)}
                  placeholder="請再次輸入新密碼"
                  className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              {inAppChangeError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {inAppChangeError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all"
              >
                儲存新密碼並開始追求
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
