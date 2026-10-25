'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  CheckCheck,
  Trash2,
  Menu,
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { formatRelativeTime } from '../lib/dateUtils';

interface HeaderProps {
  user: UserProfile;
  isLoggedIn?: boolean;
  isAdminMode?: boolean;
  hasJoinedPlans?: boolean;
  onToggleAdminMode?: () => void;
  onOpenJoinByCode: () => void;
  onOpenStats: () => void;
  onOpenPlanSelector: () => void;
  onOpenDrawer?: () => void;
  onToggleDrawer?: () => void;
  isDrawerOpen?: boolean;
  onOpenAuth: () => void;
  onLogout?: () => void;
  notifications?: AppNotification[];
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  allowJoinByInviteCode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoggedIn = true,
  isAdminMode = false,
  hasJoinedPlans = true,
  onToggleAdminMode,
  onOpenJoinByCode,
  onOpenStats,
  onOpenDrawer,
  onToggleDrawer,
  isDrawerOpen = false,
  onOpenAuth,
  onLogout,
  notifications = [],
  onMarkAllNotificationsRead,
  onClearNotifications,
  allowJoinByInviteCode = true,
}) => {
  const isAdmin = isLoggedIn && user.role === 'admin';
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // 當側邊欄開啟時，自動收合提醒彈窗
  useEffect(() => {
    if (isDrawerOpen) {
      setIsBellOpen(false);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    if (isBellOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBellOpen]);

  // 定期重整相對時間顯示
  const [, setHeaderTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setHeaderTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const parseCommentNotification = (rawTitle: string) => {
    // 1. 移除多餘的 "主題：" 前綴
    const cleaned = (rawTitle || '')
      .replace(/《主題：/g, '《')
      .replace(/^主題：/, '')
      .trim();

    let shareTitle = '';
    let comment = '';

    // 2. 優先檢查是否包含「亮光分享」
    const lightIndex = cleaned.lastIndexOf('亮光分享');
    if (lightIndex !== -1) {
      const sharePart = cleaned.slice(0, lightIndex).trim();
      const afterLight = cleaned.slice(lightIndex + '亮光分享'.length).trim();

      // 提取留言內容：去除開頭的冒號、空白與包裹的引號
      comment = afterLight
        .replace(/^[：:\s]+/, '')
        .replace(/^[「『"']/, '')
        .replace(/[」』"']$/, '')
        .trim();

      // 格式化分享主題（例如：《半年新約讀經一遍》馬太福音 第 1 ～ 2 章）
      const planUnitMatch = sharePart.match(/^(《[^》]+》)\s*(.+)$/);
      if (planUnitMatch) {
        const plan = planUnitMatch[1];
        let unit = planUnitMatch[2].trim();
        if (!unit.startsWith('【') && unit.length > 0) {
          unit = `【${unit}】`;
        }
        shareTitle = `${plan}${unit ? ` ${unit}` : ''}亮光分享`;
      } else if (sharePart) {
        let formattedPart = sharePart;
        if (!formattedPart.startsWith('《') && !formattedPart.startsWith('【')) {
          formattedPart = `【${formattedPart}】`;
        }
        shareTitle = `${formattedPart}亮光分享`;
      } else {
        shareTitle = '亮光分享';
      }
    } else {
      // 3. 次選：以最後一個冒號區分分享標題與留言內容
      const lastColonIndex = Math.max(cleaned.lastIndexOf('：'), cleaned.lastIndexOf(':'));
      if (lastColonIndex !== -1) {
        shareTitle = cleaned.slice(0, lastColonIndex).trim();
        comment = cleaned
          .slice(lastColonIndex + 1)
          .replace(/^[「『"']/, '')
          .replace(/[」』"']$/, '')
          .trim();
      } else {
        shareTitle = cleaned || '亮光分享';
      }
    }

    return { shareTitle, comment };
  };

  const getNotificationLabel = (item: AppNotification) => {
    switch (item.type) {
      case 'post_amen': {
        let cleanTitle = (item.targetTitle || '')
          .replace(/《主題：/g, '《')
          .replace(/^主題：/, '')
          .trim();
        const planUnitMatch = cleanTitle.match(/^(《[^》]+》)\s*([^【]+?)\s*亮光分享$/);
        if (planUnitMatch) {
          const plan = planUnitMatch[1];
          const unit = planUnitMatch[2].trim();
          cleanTitle = `${plan}【${unit}】亮光分享`;
        }
        return (
          <>
            對您的{' '}
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              {cleanTitle || '亮光分享'}
            </span>{' '}
            按了 <span className="font-bold text-amber-700 dark:text-amber-400">「✨ 阿們」</span>
          </>
        );
      }
      case 'sanctuary_amen':
        return (
          <>
            {item.targetTitle || '造訪您的「晨興帳幕」並按了「✨ 阿們」互勉'}
          </>
        );
      case 'post_comment': {
        const parsed = parseCommentNotification(item.targetTitle);
        if (parsed.comment) {
          return (
            <>
              在您的{' '}
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                {parsed.shareTitle}
              </span>{' '}
              留言：
              <span className="font-medium text-stone-800 dark:text-stone-200">
                「{parsed.comment}」
              </span>
            </>
          );
        }
        return (
          <>
            在您的{' '}
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              {parsed.shareTitle}
            </span>{' '}
            留下了留言
          </>
        );
      }
      case 'post_pray':
        return (
          <>
            為您的{' '}
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              {item.targetTitle || '亮光分享'}
            </span>{' '}
            同心代禱
          </>
        );
      default:
        return item.targetTitle;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-[60] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Menu Toggle & Logo & Subtitle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(onToggleDrawer || onOpenDrawer) && (
            <button
              type="button"
              onClick={onToggleDrawer || onOpenDrawer}
              className={`p-1.5 sm:p-2 -ml-1 sm:ml-0 rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs group ${
                isDrawerOpen
                  ? 'border-amber-400 bg-amber-100/90 text-amber-950 dark:bg-amber-950/80 dark:border-amber-700 dark:text-amber-300 ring-2 ring-amber-400/40'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:border-amber-300 dark:hover:border-amber-600 text-stone-700 dark:text-stone-300'
              }`}
              title={isDrawerOpen ? '關閉追求主題選單（再次點擊關閉）' : '開啟追求主題列表與邀請碼選單'}
            >
              <Menu className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                isDrawerOpen
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-stone-600 dark:text-stone-300 group-hover:text-amber-700 dark:group-hover:text-amber-400'
              }`} />
              <span className={`hidden md:inline text-xs font-semibold ${
                isDrawerOpen
                  ? 'text-amber-900 dark:text-amber-200'
                  : 'text-stone-700 dark:text-stone-200 group-hover:text-amber-800 dark:group-hover:text-amber-300'
              }`}>
                追求主題
              </span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-bold text-xl">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-stone-900 tracking-tight">晨星共行</span>
              <span className="hidden sm:inline-block text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                {isAdminMode ? '管理員工作台' : '主題式共讀'}
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              同伴同行・邀請碼共行・彼此激勵
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin / User Mode Toggle Button (Only visible when an Admin is logged in) */}
          {isAdmin && onToggleAdminMode && (
            <button
              onClick={onToggleAdminMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                isAdminMode
                  ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-600'
              }`}
              title="切換管理員模式或一般使用者模式"
            >
              {isAdminMode ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>一般使用者模式</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>切換管理模式</span>
                </>
              )}
            </button>
          )}

          {!isAdminMode && (
            <>

              {/* Streak pill */}
              <button
                onClick={onOpenStats}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 hover:bg-amber-100 transition-colors text-xs font-medium"
                title="點擊查看追求統計"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{user.streakDays} 天</span>
              </button>

              {/* Notification Bell (同伴阿們與互動提醒小鈴鐺) */}
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isBellOpen;
                    setIsBellOpen(nextOpen);
                    if (nextOpen && unreadCount > 0 && onMarkAllNotificationsRead) {
                      onMarkAllNotificationsRead();
                    }
                  }}
                  className="relative p-2 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:border-amber-300 dark:hover:border-amber-600 text-stone-700 dark:text-stone-300 transition-colors"
                  title="查看同伴阿們與留言提醒"
                >
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Popover: On mobile fixed top-16 right-4 aligned with logout button right edge; on desktop absolute right-0 */}
                {isBellOpen && (
                  <div className="fixed top-16 right-4 mt-1.5 w-[calc(100vw-2rem)] max-w-sm sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-3.5 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150 overscroll-contain">
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          提醒
                        </span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold px-1.5 py-0.2 rounded-full">
                          {notifications.length} 則
                        </span>
                      </div>
                      {notifications.length > 0 && onClearNotifications && (
                        <button
                          type="button"
                          onClick={onClearNotifications}
                          className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-0.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>清空</span>
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 space-y-1">
                        <div className="text-xl mb-1">🔔</div>
                        <p className="font-medium text-stone-600 dark:text-stone-300">目前尚無新的阿們或互動提醒</p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">
                          當共同追求主題內的同伴為您的分享或晨興帳幕按「阿們」時，會在此處顯示！
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto overscroll-contain pr-1">
                        {notifications.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-amber-50/40 dark:bg-stone-800/60 border border-amber-100 dark:border-stone-700/80 hover:border-amber-200 dark:hover:border-stone-600 flex items-start gap-2.5 text-xs transition-colors"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border border-amber-200 dark:border-stone-600 flex items-center justify-center text-base flex-shrink-0 shadow-2xs">
                              {item.actorAvatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-stone-700 dark:text-stone-300 leading-snug">
                                <span className="font-bold text-stone-900 dark:text-stone-100">{item.actorName}</span>{' '}
                                {getNotificationLabel(item)}
                              </p>
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono block mt-0.5">
                                {formatRelativeTime(item.createdAt, item.id)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* User Profile / Personal Settings Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 py-1 rounded-full hover:bg-stone-100 transition-colors border border-stone-200 bg-stone-50/50"
            title="個人設定與帳號管理"
          >
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shadow-inner">
              {user.avatar}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1">
                <span className="block text-xs font-semibold text-stone-800 leading-tight">
                  {user.name}
                </span>
                {isAdmin && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.1 rounded font-bold">
                    管理員
                  </span>
                )}
              </div>
              <span className="block text-[10px] text-stone-400 leading-none">
                個人設定
              </span>
            </div>
            <Settings className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
          </button>

          {/* Direct Logout Button */}
          {isLoggedIn && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-medium transition-colors"
              title="登出並退回登入頁"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs">登出</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
