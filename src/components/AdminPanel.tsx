'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  Plus,
  Copy,
  Check,
  Users,
  Bell,
  Edit3,
  UserPlus,
  UserMinus,
  Mail,
  Trash2,
  BookOpen,
  Lock,
  User,
  Search,
  X,
  RotateCcw,
  KeyRound,
  BarChart3,
  Flame,
  BookMarked,
  HeartHandshake,
  Sparkles,
  Calendar,
  AlertCircle,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckSquare,
  Square,
  Sliders,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { PursuitPlan, UserProfile, UserRole, SiteSettings, DEFAULT_SITE_SETTINGS } from '../types';
import { hashPasswordWeb } from '../lib/password';
import { useBodyScrollLock } from '../lib/scrollLock';
import { getUTC8DateString } from '../lib/dateUtils';

interface AdminPanelProps {
  adminUser: UserProfile;
  plans: PursuitPlan[];
  allUsers: UserProfile[];
  siteSettings?: SiteSettings;
  onUpdateSiteSettings?: (newSettingsOrUpdater: SiteSettings | ((prev: SiteSettings) => SiteSettings)) => void;
  onOpenCreatePlan: () => void;
  onEditPlan: (plan: PursuitPlan) => void;
  onDeletePlan: (planId: string, planTitle: string) => void;
  onRemindMember: (planId: string, memberId: string, memberName: string) => void;
  onAddUserToPlan: (planId: string, user: UserProfile) => void;
  onRemoveUserFromPlan: (planId: string, userId: string, userName: string) => void;
  onToggleUserAdminRole?: (userId: string, nextRole: UserRole, userName: string) => void;
  onCreateAdminUser?: (newAdmin: UserProfile) => void;
  onCreateUser?: (newUser: UserProfile) => void;
  onDeleteRegisteredUser?: (userId: string, userName: string) => void;
  onResetUserPassword?: (userId: string, userName: string) => Promise<string | void> | void;
  onResetUserProgress?: (userId: string, userName: string) => void;
  onBatchAddUsersToPlan?: (planId: string, users: UserProfile[]) => void;
  onBatchRemoveUsersFromPlan?: (planId: string, userIds: string[]) => void;
  onBatchResetProgress?: (userIds: string[]) => void;
  onBatchToggleRole?: (userIds: string[], nextRole: UserRole) => void;
  onBatchDeleteUsers?: (userIds: string[]) => void;
  onBatchDeletePlans?: (planIds: string[]) => void;
  onCopyInvite: (inviteCode: string, title: string) => void;
  onSwitchToUserMode: () => void;
  builtinUserIds?: string[];
}

const USER_AVATARS = ['🌱', '🕊️', '☀️', '🌅', '🌾', '📖', '🛡️', '✨', '🐑', '💡', '🌟', '🍇'];
const ADMIN_AVATARS = USER_AVATARS;

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminUser,
  plans,
  allUsers,
  siteSettings = DEFAULT_SITE_SETTINGS,
  onUpdateSiteSettings,
  onOpenCreatePlan,
  onEditPlan,
  onDeletePlan,
  onRemindMember,
  onAddUserToPlan,
  onRemoveUserFromPlan,
  onToggleUserAdminRole,
  onCreateAdminUser,
  onCreateUser,
  onDeleteRegisteredUser,
  onResetUserPassword,
  onResetUserProgress,
  onBatchAddUsersToPlan,
  onBatchRemoveUsersFromPlan,
  onBatchResetProgress,
  onBatchToggleRole,
  onBatchDeleteUsers,
  onBatchDeletePlans,
  onCopyInvite,
  onSwitchToUserMode,
}) => {
  // 5 Dedicated Categories
  const [activeCategory, setActiveCategory] = useState<'plans' | 'users' | 'passwords' | 'stats' | 'settings'>('plans');

  // Optimistic local settings to guarantee zero-latency, rock-solid toggle rendering without any jitter
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);

  useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const handleToggleSetting = (key: keyof SiteSettings, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).blur();
    }
    const nextVal = !localSettings[key];
    setLocalSettings((prev) => ({
      ...prev,
      [key]: nextVal,
    }));
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings((prev) => ({
        ...prev,
        [key]: nextVal,
      }));
    }
  };

  // Search & Role filters for Users tab
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Batch Selection State (批量處理選取狀態)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [batchTargetPlanId, setBatchTargetPlanId] = useState<string>(plans[0]?.id || '');

  // Floating Member Management Modal state (獨立浮起：編輯參與聖徒或加入聖徒)
  const [managingMembersPlanId, setManagingMembersPlanId] = useState<string | null>(null);
  const [memberModalTab, setMemberModalTab] = useState<'members' | 'add'>('members');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Floating User Detail & Settings Modal state (點選聖徒卡片浮起之多設定彈窗)
  const [selectedUserIdForModal, setSelectedUserIdForModal] = useState<string | null>(null);

  // Accordion Expand/Collapse States (Collapsed by default so page is never overly long)
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());
  const [expandedResetUserIds, setExpandedResetUserIds] = useState<Set<string>>(new Set());

  // Copy feedback states
  const [copiedTempId, setCopiedTempId] = useState<string | null>(null);
  const [copiedInvitePlanId, setCopiedInvitePlanId] = useState<string | null>(null);
  const [copiedMsgUserId, setCopiedMsgUserId] = useState<string | null>(null);

  // Modal to show generated 10-char temporary code
  const [tempCodeModal, setTempCodeModal] = useState<{
    userName: string;
    tempCode: string;
    copied: boolean;
  } | null>(null);

  // 鎖定背景滾動：當管理員開啟聖徒設定、臨時密碼或成員管理浮層時防止底層滾動
  const isAnyAdminModalOpen = Boolean(
    managingMembersPlanId ||
    selectedUserIdForModal ||
    tempCodeModal
  );
  useBodyScrollLock(isAnyAdminModalOpen);

  // New User / Admin Form State (管理者新增人員/管理員)
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('🌱');
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Accordion Toggle Helpers
  const togglePlanExpanded = (planId: string) => {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleResetUserExpanded = (userId: string) => {
    setExpandedResetUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Users needing password assistance (pending reset or holding temporary password)
  const usersWithPendingReset = allUsers.filter(
    (u) => u.passwordResetRequested || (u.mustChangePassword && u.tempPassword)
  );

  const handleResetPasswordClick = async (userId: string, userName: string) => {
    if (onResetUserPassword) {
      const code = await onResetUserPassword(userId, userName);
      if (code) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(code).catch(() => {});
        }
        setTempCodeModal({ userName, tempCode: code, copied: true });
      }
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserFormError('請填寫姓名與電子信箱');
      return;
    }
    if (!newUserPassword || newUserPassword.length < 6) {
      setUserFormError('密碼長度至少需 6 個字元');
      return;
    }
    if (
      allUsers.some(
        (u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase()
      )
    ) {
      setUserFormError('此電子信箱已存在，請使用其他信箱或直接在聖徒名冊中管理');
      return;
    }

    const callback = onCreateUser || onCreateAdminUser;
    if (callback) {
      const hashedPassword = await hashPasswordWeb(newUserPassword);
      const created: UserProfile = {
        id: `${newUserRole === 'admin' ? 'admin' : 'user'}-${Date.now()}`,
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: hashedPassword,
        streakDays: 0,
        totalChaptersRead: 0,
        totalSharesCount: 0,
        totalAmenReceived: 0,
        avatar: newUserAvatar,
        role: newUserRole,
        joinedInviteCodes: [],
        sanctuary: {
          placedRelicIds: [],
          motto: '直等到天發亮，晨星在你們心裏出現。',
          theme: 'dawn',
        },
      };
      callback(created);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setIsAddingUser(false);
    }
  };

  // Filtered users for Saint Directory tab
  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter === 'admin' && u.role !== 'admin') return false;
    if (roleFilter === 'user' && u.role === 'admin') return false;
    if (userSearch.trim()) {
      const q = userSearch.trim().toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Batch Processing Handlers (批量處理方法)
  const toggleSelectUser = (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllFilteredUsers = () => {
    setExpandedUserIds(new Set()); // 批量處理就不要展開，保持全部收合狀態
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleExecuteBatchAddToPlan = () => {
    const targetPlanId = batchTargetPlanId || plans[0]?.id;
    if (!targetPlanId || selectedUserIds.size === 0) return;
    const targetUsers = allUsers.filter((u) => selectedUserIds.has(u.id));
    if (onBatchAddUsersToPlan) {
      onBatchAddUsersToPlan(targetPlanId, targetUsers);
    } else {
      targetUsers.forEach((u) => onAddUserToPlan(targetPlanId, u));
    }
    setSelectedUserIds(new Set());
    setExpandedUserIds(new Set()); // 批量處理不要展開，保持收合清爽
  };

  const handleExecuteBatchRemoveFromPlan = () => {
    const targetPlanId = batchTargetPlanId || plans[0]?.id;
    if (!targetPlanId || selectedUserIds.size === 0) return;
    const userIdsArray = Array.from(selectedUserIds);
    if (onBatchRemoveUsersFromPlan) {
      onBatchRemoveUsersFromPlan(targetPlanId, userIdsArray);
    } else {
      userIdsArray.forEach((uid) => {
        const u = allUsers.find((x) => x.id === uid);
        onRemoveUserFromPlan(targetPlanId, uid, u?.name || '');
      });
    }
    setSelectedUserIds(new Set());
    setExpandedUserIds(new Set()); // 批量處理不要展開，保持收合清爽
  };

  const handleExecuteBatchResetProgress = () => {
    if (selectedUserIds.size === 0) return;
    if (
      !window.confirm(
        `確定要將所選 ${selectedUserIds.size} 位聖徒的追求進度批量重設歸零嗎？（連續天數與打卡紀錄將歸零）`
      )
    )
      return;
    const userIdsArray = Array.from(selectedUserIds);
    if (onBatchResetProgress) {
      onBatchResetProgress(userIdsArray);
    } else if (onResetUserProgress) {
      userIdsArray.forEach((uid) => {
        const u = allUsers.find((x) => x.id === uid);
        onResetUserProgress(uid, u?.name || '');
      });
    }
    setSelectedUserIds(new Set());
    setExpandedUserIds(new Set()); // 批量處理不要展開，保持收合清爽
  };

  // Plan Batch Processing Handlers (追求主題批量處理方法)
  const toggleSelectPlan = (planId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const handleSelectAllPlans = () => {
    if (selectedPlanIds.size === plans.length) {
      setSelectedPlanIds(new Set());
    } else {
      setSelectedPlanIds(new Set(plans.map((p) => p.id)));
    }
  };

  const handleExecuteBatchDeletePlans = () => {
    if (selectedPlanIds.size === 0) return;
    const count = selectedPlanIds.size;
    if (
      !window.confirm(
        `確定要批量刪除所選取的 ${count} 個追求主題嗎？\n此動作將一併移除主題的所有成員名冊與相關分享記錄，且無法復原。`
      )
    )
      return;

    const planIdsArray = Array.from(selectedPlanIds);
    if (onBatchDeletePlans) {
      onBatchDeletePlans(planIdsArray);
    } else {
      planIdsArray.forEach((id) => {
        const p = plans.find((x) => x.id === id);
        onDeletePlan(id, p?.title || '');
      });
    }
    setSelectedPlanIds(new Set());
  };

  const handleExecuteBatchDeleteUsers = () => {
    const toDeleteIds = Array.from(selectedUserIds).filter((id) => id !== adminUser.id);
    if (toDeleteIds.length === 0) {
      alert('無法刪除您自己（管理員本人）帳號。');
      return;
    }
    if (
      !window.confirm(
        `⚠️ 確定要批量刪除所選 ${toDeleteIds.length} 個聖徒帳號嗎？此操作將移除該聖徒之帳號與追求紀錄。`
      )
    )
      return;
    if (onBatchDeleteUsers) {
      onBatchDeleteUsers(toDeleteIds);
    } else if (onDeleteRegisteredUser) {
      toDeleteIds.forEach((uid) => {
        const u = allUsers.find((x) => x.id === uid);
        onDeleteRegisteredUser(uid, u?.name || '');
      });
    }
    setSelectedUserIds(new Set());
    setExpandedUserIds(new Set()); // 批量處理不要展開，保持收合清爽
  };

  // Global Statistics
  const currentUtc8Date = getUTC8DateString();
  const totalSaints = allUsers.length;
  const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;
  const totalNormalSaints = totalSaints - totalAdmins;
  const totalChaptersRead = allUsers.reduce((acc, u) => acc + (u.totalChaptersRead || 0), 0);
  const totalShares = allUsers.reduce((acc, u) => acc + (u.totalSharesCount || 0), 0);
  const totalAmen = allUsers.reduce((acc, u) => acc + (u.totalAmenReceived || 0), 0);
  const totalMemberships = plans.reduce((acc, p) => acc + (p.members?.length || 0), 0);
  const totalCompletedToday = plans.reduce(
    (acc, p) =>
      acc +
      (p.members?.filter(
        (m) =>
          Boolean(
            (m.dailyHistory?.[currentUtc8Date] || 0) > 0 ||
            (m.todayCompleted && m.lastCompletedDate === currentUtc8Date)
          )
      ).length || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Banner Control Bar */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white tracking-wide">管理員控制台</span>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-semibold">
                {adminUser.name}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              條列重要摘要 · 點擊項目即刻展開垂直完整資訊與管理功能
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-800/80">
          <button
            onClick={onOpenCreatePlan}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>開啟新追求主題</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Frame (Left: Category Menu, Right: Collapsible Accordion Lists) */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Left Side: Category Navigation Menu */}
        {/* Left Side: Category Navigation Menu (Vertical on both Mobile and Desktop) */}
        <aside className="w-full md:w-56 flex-shrink-0 bg-white rounded-2xl md:rounded-3xl border border-stone-200 p-2 sm:p-2.5 shadow-2xs">
          <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 tracking-wider">
            管理專題目錄
          </div>

          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => setActiveCategory('plans')}
              className={`w-full py-2.5 px-3.5 rounded-xl md:rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                activeCategory === 'plans'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 bg-stone-50/60 md:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">追求主題管理</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === 'plans'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200/70 text-stone-600'
                }`}
              >
                {plans.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('users')}
              className={`w-full py-2.5 px-3.5 rounded-xl md:rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                activeCategory === 'users'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 bg-stone-50/60 md:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">聖徒名冊與帳號</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === 'users'
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200/70 text-stone-600'
                }`}
              >
                {allUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('passwords')}
              className={`w-full py-2.5 px-3.5 rounded-xl md:rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                activeCategory === 'passwords'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 bg-stone-50/60 md:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">密碼與臨時碼</span>
              </div>
              {usersWithPendingReset.length > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-rose-500 text-white animate-pulse">
                  {usersWithPendingReset.length}
                </span>
              ) : (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeCategory === 'passwords'
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('stats')}
              className={`w-full py-2.5 px-3.5 rounded-xl md:rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                activeCategory === 'stats'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 bg-stone-50/60 md:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">全站追求數據</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 hidden md:block" />
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('settings')}
              className={`w-full py-2.5 px-3.5 rounded-xl md:rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                activeCategory === 'settings'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100 bg-stone-50/60 md:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">設定</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Right Side: Collapsible Detail Area */}
        <main className="flex-1 w-full space-y-3">
          {/* ======================================================== */}
          {/* CATEGORY 1: 追求主題管理 (Collapsible Accordion Items)     */}
          {/* ======================================================== */}
          {activeCategory === 'plans' && (
            <div className="space-y-3">
              {/* Header Bar with Select All & Expand/Collapse All */}
              <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {plans.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllPlans}
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-amber-900 transition-colors"
                      title={selectedPlanIds.size === plans.length ? '取消全選' : '全選所有主題'}
                    >
                      {selectedPlanIds.size > 0 && selectedPlanIds.size === plans.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                      )}
                      <span>全選</span>
                    </button>
                  )}
                  <span className="text-xs font-bold text-stone-700">
                    追求主題（共 {plans.length} 個主題）：
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plans.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedPlanIds.size === plans.length) {
                          setExpandedPlanIds(new Set());
                        } else {
                          setExpandedPlanIds(new Set(plans.map((p) => p.id)));
                        }
                      }}
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                      <span>
                        {expandedPlanIds.size === plans.length ? '全部收合' : '展開全部'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Batch Action Toolbar for Plans */}
              {selectedPlanIds.size > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-sm space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                        已選取 {selectedPlanIds.size} 個追求主題
                      </span>
                      <span className="text-[11px] text-amber-800">
                        （可一鍵批量刪除或批次展開詳情）
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanIds(new Set())}
                      className="text-xs text-stone-500 hover:text-stone-800 underline font-medium self-end sm:self-auto"
                    >
                      取消選取
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {/* Action 1: Batch Delete Plans */}
                    <button
                      type="button"
                      onClick={handleExecuteBatchDeletePlans}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="批量刪除所選追求主題"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>批量刪除主題 ({selectedPlanIds.size})</span>
                    </button>

                    {/* Action 2: Batch Expand Selected */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedPlanIds((prev) => {
                          const next = new Set(prev);
                          selectedPlanIds.forEach((id) => next.add(id));
                          return next;
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                      <span>展開所選詳情</span>
                    </button>

                    {/* Action 3: Batch Collapse Selected */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedPlanIds((prev) => {
                          const next = new Set(prev);
                          selectedPlanIds.forEach((id) => next.delete(id));
                          return next;
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                      <span>收合所選詳情</span>
                    </button>
                  </div>
                </div>
              )}

              {plans.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center text-stone-500 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                    📖
                  </div>
                  <p className="text-sm font-bold text-stone-800">目前尚無任何追求主題</p>
                  <button
                    onClick={onOpenCreatePlan}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>立即開啟新主題</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {plans.map((plan) => {
                    const isExpanded = expandedPlanIds.has(plan.id);
                    const isSelected = selectedPlanIds.has(plan.id);
                    const members = plan.members || [];
                    const completedCount = members.filter(
                      (m) =>
                        Boolean(
                          (m.dailyHistory?.[currentUtc8Date] || 0) > 0 ||
                          (m.todayCompleted && m.lastCompletedDate === currentUtc8Date)
                        )
                    ).length;
                    const totalMembers = members.length;
                    const completionPercentage =
                      totalMembers > 0 ? Math.round((completedCount / totalMembers) * 100) : 0;
                    const memberIds = new Set(members.map((m) => m.userId));
                    const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border transition-all ${
                          isExpanded
                            ? 'bg-white border-amber-400 ring-2 ring-amber-100 shadow-sm'
                            : isSelected
                            ? 'bg-amber-50/40 border-amber-400 ring-2 ring-amber-100 shadow-2xs'
                            : 'bg-white border-stone-200/90 hover:border-amber-300 hover:bg-stone-50/40 shadow-2xs'
                        }`}
                      >
                        {/* Summary Row (Always Visible, Click to Toggle) */}
                        <div
                          onClick={() => {
                            if (selectedPlanIds.size > 0) {
                              toggleSelectPlan(plan.id);
                            } else {
                              togglePlanExpanded(plan.id);
                            }
                          }}
                          className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 cursor-pointer group select-none"
                        >
                          {/* Top / Left section: Checkbox, Title & Badges */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Batch Selection Checkbox */}
                            <div
                              onClick={(e) => toggleSelectPlan(plan.id, e)}
                              className="p-1 rounded-lg hover:bg-stone-100 cursor-pointer text-stone-400 hover:text-amber-600 transition-colors flex-shrink-0 mt-0.5"
                              title="選取進行批量處理"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                              )}
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-extrabold text-sm sm:text-base text-stone-900 group-hover:text-amber-900 transition-colors truncate">
                                  {plan.title}
                                </h4>
                                {/* Mobile-only Chevron Indicator */}
                                <div className="flex sm:hidden items-center text-stone-400 flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                  共 {plan.totalUnits} {plan.unitName || (plan.category === 'bible' || plan.category === 'nt-half-year' || plan.category === 'nt-speed-reading' ? '章' : '篇')}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                  今日 {completedCount}/{totalMembers} 人 ({completionPercentage}%)
                                </span>
                                {plan.startDate && (
                                  <span className="text-[10px] text-stone-400">
                                    · {plan.startDate}{plan.endDate ? ` ~ ${plan.endDate}` : ' 起'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions section: Quick Edit & Invite Code Copy */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t border-stone-100 sm:border-0 justify-between sm:justify-end">
                            {/* Quick Edit Theme Content Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPlan(plan);
                              }}
                              className="py-1 px-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                              title="編輯此主題內容與設定"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>編輯內容</span>
                            </button>

                            {/* Inline 6-Emoji Invite Code Copy Button in Admin Panel */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyInvite(plan.inviteCode, plan.title);
                                setCopiedInvitePlanId(plan.id);
                                setTimeout(() => setCopiedInvitePlanId(null), 2500);
                              }}
                              className="py-1 px-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100/90 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                              title="管理員複製 6-Emoji 專屬邀請碼"
                            >
                              {copiedInvitePlanId === plan.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              )}
                              <span className="tracking-wider font-mono text-xs">{plan.inviteCode}</span>
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-stone-800 px-1 py-0.2 rounded font-sans">
                                {copiedInvitePlanId === plan.id ? '已複製' : '複製'}
                              </span>
                            </button>

                            {/* Desktop Expand indicator */}
                            <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-amber-800 transition-colors">
                              <span className="hidden md:inline text-[11px]">
                                {isExpanded ? '收合' : '展開詳情'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-amber-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Full Vertical Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-stone-100 animate-in fade-in duration-150">
                            {/* 0. Dedicated Theme Content & Settings Card */}
                            <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                                  <BookOpen className="w-4 h-4 text-amber-600" />
                                  主題內容與追求設定
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onEditPlan(plan)}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                                  title="編輯此追求主題設定與內容"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>編輯主題內容</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="space-y-1">
                                  <p className="text-stone-500">
                                    <span className="font-semibold text-stone-700">主題名稱：</span>
                                    {plan.title}
                                  </p>
                                  <p className="text-stone-500">
                                    <span className="font-semibold text-stone-700">追求期程：</span>
                                    {plan.startDate || '未設定'} {plan.endDate ? `~ ${plan.endDate}` : '（進行中）'}
                                  </p>
                                  <p className="text-stone-500">
                                    <span className="font-semibold text-stone-700">追求總數：</span>
                                    共 {plan.totalUnits} {plan.unitName || (plan.category === 'bible' || plan.category === 'nt-half-year' || plan.category === 'nt-speed-reading' ? '章' : '篇')}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-stone-500">
                                    <span className="font-semibold text-stone-700">當前進度標題：</span>
                                    {plan.currentUnitTitle || `第 ${plan.completedUnits || 0} 篇`}
                                  </p>
                                  {plan.currentVerses && (
                                    <p className="text-stone-500 truncate">
                                      <span className="font-semibold text-stone-700">相關經文：</span>
                                      {plan.currentVerses}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {plan.description && (
                                <div className="pt-1.5 border-t border-stone-200/70">
                                  <p className="text-[11px] font-semibold text-stone-600 mb-0.5">主題簡介：</p>
                                  <p className="text-xs text-stone-700 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/50">
                                    {plan.description}
                                  </p>
                                </div>
                              )}

                              {plan.summary && (
                                <div className="pt-1.5 border-t border-stone-200/70">
                                  <p className="text-[11px] font-semibold text-stone-600 mb-0.5">追求負擔與信息摘要：</p>
                                  <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-serif bg-white/70 p-2.5 rounded-xl border border-stone-200/50">
                                    {plan.summary}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* 1. Vertical Row: 6-Emoji Invite Code */}
                            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                              <span className="text-xs font-bold text-amber-950 block">
                                🔑 6-Emoji 專屬邀請碼：
                              </span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="tracking-widest text-base font-extrabold text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300 text-center sm:text-left">
                                  {plan.inviteCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onCopyInvite(plan.inviteCode, plan.title);
                                    setCopiedInvitePlanId(plan.id);
                                    setTimeout(() => setCopiedInvitePlanId(null), 2500);
                                  }}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                                >
                                  {copiedInvitePlanId === plan.id ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>{copiedInvitePlanId === plan.id ? '已複製！' : '複製邀請碼'}</span>
                                </button>
                              </div>
                            </div>

                            {/* 2. Vertical Row: Today's Punch-in Rate */}
                            <div className="space-y-1.5 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-stone-700">🎯 今日打卡完成進度</span>
                                <span className="font-extrabold text-amber-800">
                                  {completedCount} / {totalMembers} 人 ({completionPercentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* 3. Member Management Button (獨立浮動彈窗觸發) */}
                            <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div className="text-xs text-stone-600 flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>
                                  目前共有 <strong className="text-stone-900 font-bold">{totalMembers}</strong> 位聖徒參與追求
                                  {nonMembers.length > 0 && (
                                    <span className="text-stone-400">（尚有 {nonMembers.length} 位可加入）</span>
                                  )}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setManagingMembersPlanId(plan.id);
                                  setMemberModalTab('members');
                                  setMemberSearchQuery('');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>👥 編輯參與聖徒 / 加入聖徒 ({totalMembers})</span>
                              </button>
                            </div>

                            {/* 5. Vertical Row: Theme Action Buttons */}
                            <div className="space-y-2 pt-2 border-t border-stone-100">
                              <span className="text-[11px] font-bold text-stone-500 block">
                                主題維護操作：
                              </span>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditPlan(plan)}
                                  className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                                >
                                  <span className="flex items-center gap-2">
                                    <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                                    編輯此追求主題設定
                                  </span>
                                  <span className="text-[10px] text-stone-400">修改標題與篇數</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeletePlan(plan.id, plan.title)}
                                  className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                                >
                                  <span className="flex items-center gap-2">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    刪除此追求主題
                                  </span>
                                  <span className="text-[10px] text-rose-400">移除主題與關聯</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY 2: 聖徒名冊與帳號                               */}
          {/* ======================================================== */}
          {activeCategory === 'users' && (
            <div className="space-y-3">
              {/* Search & Role Filters */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="搜尋聖徒姓名或信箱..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setRoleFilter('all')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
                        roleFilter === 'all'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      全部 ({allUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('admin')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
                        roleFilter === 'admin'
                          ? 'bg-white text-amber-800 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      管理員 ({allUsers.filter((u) => u.role === 'admin').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('user')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
                        roleFilter === 'user'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      聖徒 ({allUsers.filter((u) => u.role !== 'admin').length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUser(!isAddingUser);
                      setUserFormError(null);
                      if (roleFilter === 'admin') setNewUserRole('admin');
                      else setNewUserRole('user');
                    }}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingUser ? '收起表單' : '新增人員 / 管理員'}</span>
                  </button>
                </div>
              </div>

              {/* Add User / Admin Form (管理者新增人員/管理員) */}
              {isAddingUser && (
                <form
                  onSubmit={handleCreateUserSubmit}
                  className="bg-amber-50/70 border border-amber-200 p-4 rounded-3xl space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-amber-600" />
                      新增聖徒人員或管理員
                    </span>
                    {/* Role Selection Toggle */}
                    <div className="flex items-center bg-white border border-amber-200 rounded-xl p-0.5 text-[11px] font-bold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setNewUserRole('user')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          newUserRole === 'user'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        一般聖徒 (人員)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUserRole('admin')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          newUserRole === 'admin'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        管理員 (服事者)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        聖徒姓名
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="例如：忠信弟兄"
                        className="w-full text-xs rounded-xl border border-stone-200 bg-white px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        電子信箱 (作為登入帳號)
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="請輸入電子信箱"
                        className="w-full text-xs rounded-xl border border-stone-200 bg-white px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        初始密碼 (至少 6 碼)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="請設定密碼（至少 6 碼）"
                        className="w-full text-xs rounded-xl border border-stone-200 bg-white px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-stone-500 mr-1">選擇頭像：</span>
                      {USER_AVATARS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewUserAvatar(em)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                            newUserAvatar === em
                              ? 'bg-amber-500 text-white shadow-xs scale-105'
                              : 'bg-white border border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs self-end sm:self-auto"
                    >
                      {newUserRole === 'admin' ? '確認建立管理員' : '確認建立聖徒人員'}
                    </button>
                  </div>

                  {userFormError && (
                    <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                      {userFormError}
                    </p>
                  )}
                </form>
              )}

              {/* Roster Header Bar with Expand/Collapse All and Batch Select */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-stone-700">
                    聖徒名單（共 {filteredUsers.length} 位）：
                  </span>
                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredUsers}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                      title="快速全選或取消全選目前篩選名單"
                    >
                      {selectedUserIds.size === filteredUsers.length ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>取消全選</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-stone-400" />
                          <span>全選目前名單 ({filteredUsers.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {filteredUsers.length > 0 && (
                  <span className="text-[11px] text-stone-400 self-end sm:self-auto flex items-center gap-1 font-medium">
                    <Sliders className="w-3 h-3 text-amber-600" />
                    <span>點選聖徒卡片可開啟詳細設定與生活數據</span>
                  </span>
                )}
              </div>

              {/* Batch Action Toolbar (批量操作工作列) */}
              {selectedUserIds.size > 0 && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border-2 border-amber-500/60 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {selectedUserIds.size}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                        已選取 {selectedUserIds.size} 位聖徒
                      </span>
                      <span className="text-[11px] text-amber-800">
                        （可一鍵批量指派追求主題、移出、重設進度或刪除帳號）
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(new Set())}
                      className="text-xs text-stone-500 hover:text-stone-800 underline font-medium self-end sm:self-auto"
                    >
                      取消選取
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {/* Action 1: Batch Add / Remove Plan */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs flex-wrap">
                      <span className="text-[11px] font-bold text-stone-600 pl-1">主題：</span>
                      <select
                        value={batchTargetPlanId}
                        onChange={(e) => setBatchTargetPlanId(e.target.value)}
                        className="text-xs rounded-lg border-stone-200 bg-stone-50 py-1 px-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[180px] sm:max-w-xs truncate"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleExecuteBatchAddToPlan}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1 transition-colors shadow-2xs"
                        title="將所選聖徒批量加入所選主題"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>一鍵加入主題</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteBatchRemoveFromPlan}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1 transition-colors shadow-2xs"
                        title="將所選聖徒自所選主題移出"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>自主題移出</span>
                      </button>
                    </div>

                    {/* Action 2: Batch Reset Progress */}
                    {onResetUserProgress && (
                      <button
                        type="button"
                        onClick={handleExecuteBatchResetProgress}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="將所選聖徒的追求天數與篇數歸零"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        <span>批量重設進度</span>
                      </button>
                    )}

                    {/* Action 3: Batch Delete Users */}
                    <button
                      type="button"
                      onClick={handleExecuteBatchDeleteUsers}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="刪除所選帳號（管理員本人會被安全保留）"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>批量刪除帳號</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Collapsible Accordion User Cards */}
              <div className="space-y-2.5">
                {filteredUsers.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-xs text-stone-400">
                    找不到符合條件的聖徒帳號
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === adminUser.id;
                    const isUserAdmin = u.role === 'admin';
                    const isSelected = selectedUserIds.has(u.id);

                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (selectedUserIds.size > 0) {
                            toggleSelectUser(u.id);
                          } else {
                            setSelectedUserIdForModal(u.id);
                          }
                        }}
                        className={`rounded-2xl border transition-all p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer group select-none ${
                          isSelected
                            ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-100 shadow-sm'
                            : 'bg-white border-stone-200/90 hover:border-amber-300 hover:bg-stone-50/60 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Batch Selection Checkbox */}
                          <div
                            onClick={(e) => toggleSelectUser(u.id, e)}
                            className="p-1 rounded-lg hover:bg-stone-100 cursor-pointer text-stone-400 hover:text-amber-600 transition-colors flex-shrink-0"
                            title="選取進行批量處理"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                            )}
                          </div>

                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            {u.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-stone-900 group-hover:text-amber-900 transition-colors">
                                {u.name}
                              </span>
                              {isUserAdmin ? (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                                  管理員
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.2 rounded-full">
                                  聖徒
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[9px] bg-stone-800 text-white px-1.5 py-0.2 rounded-full font-semibold">
                                  本人
                                </span>
                              )}
                              {u.passwordResetRequested && (
                                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.2 rounded-full flex items-center gap-1 animate-pulse">
                                  ⚠️ 申請重設中
                                </span>
                              )}
                              {u.mustChangePassword && !u.passwordResetRequested && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                                  🔑 待改密碼
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Key Summary Stat Pill + Floating Modal Trigger Pill */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-2 text-xs bg-stone-100/90 px-2.5 py-1 rounded-xl text-stone-700 font-semibold border border-stone-200/60">
                            <span className="flex items-center gap-1 text-amber-700">
                              <Flame className="w-3.5 h-3.5" />
                              {u.streakDays}天
                            </span>
                            <span className="text-stone-300">|</span>
                            <span className="flex items-center gap-1 text-emerald-700">
                              <BookMarked className="w-3.5 h-3.5" />
                              {u.totalChaptersRead}篇
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 group-hover:text-amber-900 bg-stone-100 group-hover:bg-amber-100/80 px-2.5 py-1.5 rounded-xl border border-stone-200/70 group-hover:border-amber-300 transition-all shadow-2xs">
                            <Sliders className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px]">設定詳情</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 聖徒詳細設定與管理獨立浮動彈窗 (點選聖徒卡片浮起) */}
              {selectedUserIdForModal && (() => {
                const u = allUsers.find((x) => x.id === selectedUserIdForModal);
                if (!u) return null;
                const isSelf = u.id === adminUser.id;
                const isUserAdmin = u.role === 'admin';

                return (
                  <div
                    onClick={() => setSelectedUserIdForModal(null)}
                    className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200 touch-none overscroll-none"
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-5.5rem)] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
                    >
                      {/* Modal Header */}
                      <div className="p-4 sm:p-5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80 flex-shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                            {u.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-base text-stone-900 truncate">
                                {u.name}
                              </h3>
                              {isUserAdmin ? (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                                  管理員
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.2 rounded-full">
                                  聖徒
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[9px] bg-stone-800 text-white px-1.5 py-0.2 rounded-full font-semibold">
                                  本人
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 font-mono mt-0.5 truncate">{u.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIdForModal(null)}
                          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors flex-shrink-0"
                          title="關閉"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Scrollable Body */}
                      <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
                        {/* 1. Status Notices */}
                        {u.passwordResetRequested && (
                          <div className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                            <AlertCircle className="w-4 h-4" />
                            <span>⚠️ 該聖徒正在申請忘記密碼（待管理員核發 10 位臨時密碼）</span>
                          </div>
                        )}

                        {u.mustChangePassword && !u.passwordResetRequested && (
                          <div className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-amber-700" />
                            <span>🔑 已核發 10 位臨時密碼（等待聖徒登入更改為新密碼）</span>
                          </div>
                        )}

                        {/* 2. Vertical Row: Pursuit Performance Metrics */}
                        <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/60">
                          <span className="text-[11px] font-bold text-stone-600 block mb-1">
                            📊 個人追求生活數據：
                          </span>
                          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-200/50">
                            <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                              <Flame className="w-3.5 h-3.5 text-amber-600" />
                              連續追求天數
                            </span>
                            <span className="font-extrabold text-stone-900">{u.streakDays} 天</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-200/50">
                            <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
                              累計閱讀篇數
                            </span>
                            <span className="font-extrabold text-stone-900">
                              {u.totalChaptersRead} 篇
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              動態亮光分享
                            </span>
                            <span className="font-extrabold text-stone-900">
                              {u.totalSharesCount} 則
                            </span>
                          </div>
                        </div>

                        {/* 3. Thematic Pursuits Participation */}
                        {plans.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-xs font-bold text-stone-700 block">
                              📚 參與的追求主題：
                            </span>
                            <div className="space-y-1.5 max-h-56 overflow-y-auto overscroll-contain pr-1">
                              {plans.map((plan) => {
                                const isJoined = (plan.members || []).some(
                                  (m) => m.userId === u.id
                                );
                                const shortTitle = plan.title.replace(/^主題：/, '');
                                return isJoined ? (
                                  <div
                                    key={plan.id}
                                    className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs"
                                  >
                                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      《{shortTitle}》
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveUserFromPlan(plan.id, u.id, u.name)}
                                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors shadow-2xs"
                                    >
                                      使該員退出此主題
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    key={plan.id}
                                    className="p-2.5 rounded-xl bg-stone-50 border border-dashed border-stone-200 flex items-center justify-between text-xs"
                                  >
                                    <span className="text-stone-500">
                                      《{shortTitle}》（尚未加入）
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onAddUserToPlan(plan.id, u)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>加入此追求</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 4. Temporary Password Box */}
                        {u.tempPassword && (u.passwordResetRequested || u.mustChangePassword) && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2.5 shadow-2xs">
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                              <KeyRound className="w-4 h-4 text-amber-600" />
                              10 位臨時登入密碼：
                            </span>
                            <div className="text-xl font-mono font-extrabold tracking-widest text-amber-950 bg-white py-2 px-4 rounded-xl border border-amber-300 shadow-2xs select-all text-center">
                              {u.tempPassword}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(u.tempPassword || '');
                                  }
                                  setCopiedTempId(u.id);
                                  setTimeout(() => setCopiedTempId(null), 2500);
                                }}
                                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
                              >
                                {copiedTempId === u.id ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{copiedTempId === u.id ? '已複製密碼！' : '一鍵複製臨時密碼'}</span>
                              </button>
                              {onResetUserPassword && (
                                <button
                                  type="button"
                                  onClick={() => handleResetPasswordClick(u.id, u.name)}
                                  className="py-2 px-3 border border-stone-200 bg-white hover:bg-amber-100 text-stone-700 text-xs rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                                  <span>換一組臨時碼</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 5. Admin Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-stone-200">
                          <span className="text-[11px] font-bold text-stone-500 block">
                            管理操作功能：
                          </span>
                          <div className="flex flex-col gap-2">
                            {/* Reset Progress Button */}
                            {onResetUserProgress && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `確定要將【${u.name}】的追求進度重設歸零嗎？（連續天數、累計篇數將歸零）`
                                    )
                                  ) {
                                    onResetUserProgress(u.id, u.name);
                                  }
                                }}
                                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                              >
                                <span className="flex items-center gap-2">
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                  重設追求進度（天數與篇數歸零）
                                </span>
                                <span className="text-[10px] text-stone-400">支援 7 秒立即復原</span>
                              </button>
                            )}

                            {/* Reset Password Button if requested */}
                            {onResetUserPassword && !isSelf && u.passwordResetRequested && !u.tempPassword && (
                              <button
                                type="button"
                                onClick={() => handleResetPasswordClick(u.id, u.name)}
                                className="w-full py-2.5 px-3 rounded-xl border border-amber-500 bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold flex items-center justify-between shadow-2xs transition-all animate-pulse"
                              >
                                <span className="flex items-center gap-2">
                                  <KeyRound className="w-3.5 h-3.5" />
                                  產生 10 位英數臨時密碼
                                </span>
                                <span className="text-[10px] text-amber-100">提供該員登入重設</span>
                              </button>
                            )}

                            {/* Role Toggle Button */}
                            {onToggleUserAdminRole && !isSelf && (
                              isUserAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && window.confirm(`確定要將【${u.name}】解除管理員身分，轉為一般聖徒嗎？`)) {
                                      onToggleUserAdminRole(u.id, 'user', u.name);
                                    }
                                  }}
                                  className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                                >
                                  <span className="flex items-center gap-2">
                                    <ShieldOff className="w-3.5 h-3.5 text-stone-500" />
                                    解除管理員身分
                                  </span>
                                  <span className="text-[10px] text-stone-400">降為一般聖徒</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && window.confirm(`確定要將【${u.name}】設為管理員服事者嗎？`)) {
                                      onToggleUserAdminRole(u.id, 'admin', u.name);
                                    }
                                  }}
                                  className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs"
                                >
                                  <span className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                    設為管理員服事者
                                  </span>
                                  <span className="text-[10px] text-amber-700">賦予後台管理權限</span>
                                </button>
                              )
                            )}

                            {/* Delete User Button */}
                            {onDeleteRegisteredUser && !isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && window.confirm(`確定要永久刪除聖徒【${u.name}】的帳號嗎？此操作將同時將其自所有追求主題中退出。`)) {
                                    setSelectedUserIdForModal(null);
                                    onDeleteRegisteredUser(u.id, u.name);
                                  }
                                }}
                                className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                              >
                                <span className="flex items-center gap-2">
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  刪除此聖徒帳號
                                </span>
                                <span className="text-[10px] text-rose-400">永久移除帳號</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY 3: 忘記密碼與臨時碼專區 (Collapsible Accordion)   */}
          {/* ======================================================== */}
          {activeCategory === 'passwords' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-200/20 to-transparent border border-amber-300/80 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>忘記密碼與 10 位臨時密碼管理中心</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  當聖徒在登入頁點選「忘記密碼」並輸入註冊信箱後，系統會在此自動產生專屬的 10 位隨機臨時密碼。管理員可直接複製提供給該聖徒。聖徒登入後將強制要求設定專屬新密碼，新密碼設定完成後，此處的臨時密碼便會自動清除。
                </p>
              </div>

              {/* Quick Channel Toggles for Password Reset */}
              <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-stone-900">開放重設管道控制</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('settings')}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline"
                  >
                    前往設定 →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-800">信箱 6 位數驗證碼</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          localSettings.allowEmailReset ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {localSettings.allowEmailReset ? '已開放' : '已關閉'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">需配置真實 SMTP 發信伺服器</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowEmailReset', e)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                        localSettings.allowEmailReset ? 'bg-amber-500' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          localSettings.allowEmailReset ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-800">聯繫管理員一鍵重設</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          localSettings.allowAdminAssistedReset ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {localSettings.allowAdminAssistedReset ? '已開放' : '已關閉'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">免發外部信，後台核發臨時碼</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowAdminAssistedReset', e)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                        localSettings.allowAdminAssistedReset ? 'bg-amber-500' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          localSettings.allowAdminAssistedReset ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {usersWithPendingReset.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 text-center text-stone-500 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-stone-800">
                    目前沒有任何待處理的忘記密碼申請
                  </p>
                  <p className="text-xs text-stone-400">所有聖徒帳號皆處於正常登入狀態</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-stone-700">
                      待處理或已核發臨時碼的名單（共 {usersWithPendingReset.length} 位）：
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedResetUserIds.size === usersWithPendingReset.length) {
                          setExpandedResetUserIds(new Set());
                        } else {
                          setExpandedResetUserIds(new Set(usersWithPendingReset.map((u) => u.id)));
                        }
                      }}
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                      <span>
                        {expandedResetUserIds.size === usersWithPendingReset.length
                          ? '全部收合'
                          : '展開全部'}
                      </span>
                    </button>
                  </div>

                  {usersWithPendingReset.map((u) => {
                    const isExpanded = expandedResetUserIds.has(u.id);
                    const messageText = `親愛的【${u.name}】弟兄/姊妹平安：您在晨星共行的 10 位臨時登入密碼為：${u.tempPassword || '（待產生）'}。請使用註冊信箱（${u.email}）配合此臨時密碼登入，登入後系統將引導您設定專屬新密碼。`;

                    return (
                      <div
                        key={u.id}
                        className={`rounded-2xl border transition-all ${
                          isExpanded
                            ? 'bg-white border-amber-400 ring-2 ring-amber-100 shadow-sm'
                            : 'bg-white border-amber-200 hover:border-amber-300 shadow-2xs'
                        }`}
                      >
                        {/* Summary Row */}
                        <div
                          onClick={() => toggleResetUserExpanded(u.id)}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer group select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl flex-shrink-0">{u.avatar}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-stone-900 group-hover:text-amber-900 transition-colors">
                                  {u.name}
                                </span>
                                {u.passwordResetRequested ? (
                                  <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.2 rounded-full animate-pulse">
                                    ⚠️ 申請中
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full">
                                    🔑 已核發臨時碼
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-400 font-mono block truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {u.tempPassword && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(u.tempPassword || '');
                                  }
                                  setCopiedTempId(u.id);
                                  setTimeout(() => setCopiedTempId(null), 2500);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1"
                              >
                                {copiedTempId === u.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedTempId === u.id ? '已複製！' : '複製密碼'}</span>
                              </button>
                            )}

                            <div className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-amber-800 transition-colors">
                              <span className="hidden sm:inline text-[11px]">
                                {isExpanded ? '收合' : '詳情'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-amber-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Full Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-stone-100 animate-in fade-in duration-150">
                            {u.tempPassword ? (
                              <div className="space-y-3 p-4 rounded-2xl bg-amber-50 border border-amber-300">
                                <span className="text-xs font-bold text-amber-950 block">
                                  專屬 10 位隨機臨時密碼：
                                </span>
                                <div className="text-2xl font-mono font-extrabold tracking-widest text-amber-950 bg-white py-3 px-4 rounded-xl border border-amber-300 shadow-2xs select-all text-center">
                                  {u.tempPassword}
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                        navigator.clipboard.writeText(u.tempPassword || '');
                                      }
                                      setCopiedTempId(u.id);
                                      setTimeout(() => setCopiedTempId(null), 2500);
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                                  >
                                    {copiedTempId === u.id ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                    <span>{copiedTempId === u.id ? '已複製密碼！' : '一鍵複製 10 位臨時密碼'}</span>
                                  </button>

                                  {onResetUserPassword && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetPasswordClick(u.id, u.name)}
                                      className="w-full py-2 px-4 rounded-xl border border-stone-200 bg-white hover:bg-amber-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                                      <span>換一組新的 10 位臨時密碼</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                        navigator.clipboard.writeText(messageText);
                                      }
                                      setCopiedMsgUserId(u.id);
                                      setTimeout(() => setCopiedMsgUserId(null), 2500);
                                    }}
                                    className="w-full py-2 px-4 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    {copiedMsgUserId === u.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                                    )}
                                    <span>{copiedMsgUserId === u.id ? '已複製通知文字！' : '複製通知訊息全文（轉發 LINE/簡訊）'}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              onResetUserPassword && (
                                <button
                                  type="button"
                                  onClick={() => handleResetPasswordClick(u.id, u.name)}
                                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
                                >
                                  <KeyRound className="w-4 h-4" />
                                  <span>立即為其產生 10 位臨時密碼</span>
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY 4: 全站追求概況 (Summary Items)                  */}
          {/* ======================================================== */}
          {activeCategory === 'stats' && (
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>全站追求生活概況與數據總覽</span>
                </h3>
              </div>

              {/* 4 Stat Summary Rows */}
              <div className="space-y-2">
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-500 block">全站註冊聖徒總數</span>
                      <span className="text-lg font-extrabold text-stone-900">{totalSaints} 位</span>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">
                    管理員 {totalAdmins} 位 · 一般聖徒 {totalNormalSaints} 位
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-500 block">進行中追求主題數</span>
                      <span className="text-lg font-extrabold text-stone-900">{plans.length} 個</span>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">
                    全站參與人次：{totalMemberships} 人次
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                      <BookMarked className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-500 block">全站累計閱讀篇數</span>
                      <span className="text-lg font-extrabold text-stone-900">{totalChaptersRead} 篇</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">
                    今日打卡完成：{totalCompletedToday} 人次
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-500 block">亮光分享總計</span>
                      <span className="text-lg font-extrabold text-stone-900">
                        {totalShares} 則
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">
                    同伴靈中摸著交通
                  </span>
                </div>
              </div>

              {/* Each Theme's Completion Progress */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-stone-800">各主題打卡完成概況：</h4>
                {plans.length === 0 ? (
                  <p className="text-xs text-stone-400">目前尚無主題數據</p>
                ) : (
                  <div className="space-y-2.5 divide-y divide-stone-100">
                    {plans.map((p) => {
                      const mCount = p.members?.length || 0;
                      const cCount =
                        p.members?.filter(
                          (m) =>
                            Boolean(
                              (m.dailyHistory?.[currentUtc8Date] || 0) > 0 ||
                              (m.todayCompleted && m.lastCompletedDate === currentUtc8Date)
                            )
                        ).length || 0;
                      const rate = mCount > 0 ? Math.round((cCount / mCount) * 100) : 0;
                      return (
                        <div key={p.id} className="pt-2.5 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-stone-900">{p.title}</span>
                            <span className="font-bold text-amber-800">
                              {cCount} / {mCount} 人 ({rate}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-stone-400 block">
                            全 {p.totalUnits} {p.unitName || (p.category === 'bible' || p.category === 'nt-half-year' || p.category === 'nt-speed-reading' ? '章' : '篇')} · 邀請碼：{p.inviteCode}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY 5: 設定 (Site Feature Controls)                  */}
          {/* ======================================================== */}
          {activeCategory === 'settings' && (
            <div className="space-y-4">
              <div className="px-1 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>設定</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    隨時開啟或停用特定功能，設定將即時生效並同步至全站
                  </p>
                </div>
              </div>

              {/* Group 1: 忘記密碼與找回方式 */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800">忘記密碼找回管道</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">信箱 6 位數驗證碼自主重設</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒在登入頁自行輸入電子信箱收取驗證碼，重設新密碼</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowEmailReset', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowEmailReset ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowEmailReset ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-50">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">聯繫管理員一鍵核發臨時密碼</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒提交找回申請，由管理員在後台點擊一鍵產生 10 位安全臨時密碼</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowAdminAssistedReset', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowAdminAssistedReset ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowAdminAssistedReset ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 2: 人員註冊與加入 */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800">人員註冊與加入方式</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">新聖徒線上自主註冊</span>
                      <span className="text-[11px] text-stone-500 block">開啟時允許訪客在登入頁自行點選註冊帳號；關閉時僅允許管理員手動新增人員</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowUserRegistration', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowUserRegistration ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowUserRegistration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-50">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">以 6-Emoji 邀請碼自主加入追求主題</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒在前台輸入邀請碼加入追求；關閉時僅由管理員在後台編派人員進主題</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowJoinByInviteCode', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowJoinByInviteCode ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowJoinByInviteCode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 3: 亮光交通與互動 */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800">亮光交通與同心互動</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">聖徒發表今日摸著與亮光</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒在每日追求後寫下摸著經節與心得亮光分享至今日亮光牆</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowSharingPosts', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowSharingPosts ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowSharingPosts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-50">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">動態留言回應與交通</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒在亮光卡片下方發表同伴回應或交通</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowComments', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowComments ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowComments ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-50">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">同聲阿們與同心禱告互動</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒對亮光點擊「同聲阿們」與同心禱告</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowMutualAmens', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowMutualAmens ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowMutualAmens ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 4: 帳幕與同伴生活 */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <HeartHandshake className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800">追求帳幕與同伴生活</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">同伴互訪追求帳幕</span>
                      <span className="text-[11px] text-stone-500 block">允許聖徒進入同伴個人陳設的追求帳幕，觀看屬靈信物與立志座右銘</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSetting('allowSanctuaryVisit', e)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.allowSanctuaryVisit ? 'bg-amber-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          localSettings.allowSanctuaryVisit ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Display Generated 10-char Temporary Code with Copy Button */}
      {tempCodeModal && (
        <div
          onClick={() => setTempCodeModal(null)}
          className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 touch-none overscroll-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4 overscroll-contain"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                <KeyRound className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">已產生 10 位臨時密碼</h3>
                <p className="text-xs text-stone-500">對象：【{tempCodeModal.userName}】</p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-center space-y-2">
              <p className="text-xs text-stone-500">請複製以下 10 位臨時密碼提供給該聖徒：</p>
              <div className="text-2xl font-mono font-extrabold tracking-widest text-amber-900 select-all bg-white py-2.5 px-3 rounded-xl border border-amber-300 shadow-2xs">
                {tempCodeModal.tempCode}
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                該聖徒使用此臨時密碼登入後，系統將強制要求其設定專屬新密碼。
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(tempCodeModal.tempCode).catch(() => {});
                    setTempCodeModal((prev) => (prev ? { ...prev, copied: true } : null));
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                {tempCodeModal.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{tempCodeModal.copied ? '已複製到剪貼簿' : '一鍵複製臨時密碼'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTempCodeModal(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 獨立浮起：編輯參與聖徒或加入聖徒彈窗 (Manage Plan Members Modal) */}
      {managingMembersPlanId && (() => {
        const plan = plans.find((p) => p.id === managingMembersPlanId);
        if (!plan) return null;
        const members = plan.members || [];
        const nonMembers = allUsers.filter((u) => !members.some((m) => m.userId === u.id));
        const filteredMembers = memberSearchQuery.trim()
          ? members.filter((m) => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
          : members;
        const filteredNonMembers = memberSearchQuery.trim()
          ? nonMembers.filter((u) => u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
          : nonMembers;

        return (
          <div
            onClick={() => setManagingMembersPlanId(null)}
            className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200 touch-none overscroll-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-5.5rem)] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-stone-900 truncate">
                      《{plan.title}》參與聖徒與加入管理
                    </h3>
                    <p className="text-xs text-stone-500">
                      共 {plan.totalUnits} {plan.unitName || '篇'} · 專屬邀請碼：{plan.inviteCode}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingMembersPlanId(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors flex-shrink-0"
                  title="關閉"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Switcher & Search Bar */}
              <div className="p-3 sm:p-4 bg-stone-50/40 border-b border-stone-100 space-y-2.5 flex-shrink-0">
                <div className="flex items-center bg-stone-200/70 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMemberModalTab('members')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      memberModalTab === 'members'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>👥 目前參與聖徒</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      memberModalTab === 'members' ? 'bg-amber-100 text-amber-800' : 'bg-stone-300 text-stone-600'
                    }`}>
                      {members.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberModalTab('add')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      memberModalTab === 'add'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>➕ 快速加入聖徒</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      memberModalTab === 'add' ? 'bg-amber-100 text-amber-800' : 'bg-stone-300 text-stone-600'
                    }`}>
                      {nonMembers.length}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder={memberModalTab === 'members' ? '搜尋參與聖徒姓名...' : '搜尋尚未加入之聖徒姓名或信箱...'}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 space-y-2">
                {memberModalTab === 'members' ? (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-stone-700">
                        名單列表（{filteredMembers.length} 位）：
                      </span>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`確定要使這 ${members.length} 位成員全數退出《${plan.title}》追求嗎？`)) {
                              const uids = members.map((m) => m.userId);
                              if (onBatchRemoveUsersFromPlan) {
                                onBatchRemoveUsersFromPlan(plan.id, uids);
                              } else {
                                members.forEach((m) => onRemoveUserFromPlan(plan.id, m.userId, m.name));
                              }
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>批量全體退出</span>
                        </button>
                      )}
                    </div>

                    {filteredMembers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        {members.length === 0 ? '目前尚無聖徒加入此追求' : '查無符合搜尋條件之聖徒'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMembers.map((m, idx) => (
                          <div
                            key={m.userId}
                            className="p-3 rounded-2xl border border-stone-200/80 bg-stone-50/60 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-xs text-stone-400 font-mono w-4 flex-shrink-0 mt-0.5 sm:mt-0">
                                {idx + 1}.
                              </span>
                              <span className="text-lg flex-shrink-0">{m.avatar}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900 truncate">
                                    {m.name}
                                  </span>
                                  {Boolean(
                                    (m.dailyHistory?.[currentUtc8Date] || 0) > 0 ||
                                    (m.todayCompleted && m.lastCompletedDate === currentUtc8Date)
                                  ) ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      ✓今日已追求
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded">
                                      今日尚未打卡
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 flex-wrap mt-0.5">
                                  <span>連續追求：{m.streakDays} 天</span>
                                  <span>·</span>
                                  <span className="font-medium text-stone-700">
                                    個人進度：第 {m.completedUnits ?? 0} {plan.unitName || (plan.category === 'bible' ? '章' : '篇')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-2 sm:pt-0 border-t border-stone-200/50 sm:border-0 justify-end w-full sm:w-auto flex-shrink-0">
                              {onResetUserProgress && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`確定要將【${m.name}】的追求進度重設歸零嗎？`)) {
                                      onResetUserProgress(m.userId, m.name);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-900 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3 text-stone-400" />
                                  <span>重設進度</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onRemoveUserFromPlan(plan.id, m.userId, m.name)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                <span>退出追求</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-stone-700">
                        可加入聖徒（{filteredNonMembers.length} 位）：
                      </span>
                      {nonMembers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onBatchAddUsersToPlan) {
                              onBatchAddUsersToPlan(plan.id, nonMembers);
                            } else {
                              nonMembers.forEach((u) => onAddUserToPlan(plan.id, u));
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>⚡ 一鍵全體加入 ({nonMembers.length} 位)</span>
                        </button>
                      )}
                    </div>

                    {filteredNonMembers.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        {nonMembers.length === 0 ? '全體註冊聖徒皆已在此主題中！' : '查無符合搜尋條件之聖徒'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredNonMembers.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base flex-shrink-0">{u.avatar}</span>
                              <div className="min-w-0">
                                <span className="font-bold text-stone-900 block truncate">{u.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono block truncate">{u.email}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAddUserToPlan(plan.id, u)}
                              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors self-end sm:self-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>加入追求</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
