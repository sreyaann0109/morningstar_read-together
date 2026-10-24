'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  PenSquare,
  ArrowRight,
  Edit3,
  KeyRound,
  Copy,
  Users,
  RotateCcw,
  Sliders,
  Clock,
  ChevronDown,
  Calendar,
  Flame,
  Zap,
} from 'lucide-react';
import { PursuitPlan, SiteSettings } from '../types';
import {
  getTodayNTSchedule,
  getNTDaySchedule,
  getNTChapterLocation,
  calculateNTSpeedPace,
  calculateNTHalfYearPace,
  NTHalfYearPaceInfo,
  FULL_130_DAYS_SCHEDULE,
  TOTAL_NT_DAYS,
  TOTAL_NT_CHAPTERS,
} from '../data/ntBibleData';

interface TodayPursuitCardProps {
  plan?: PursuitPlan | null;
  joinedPlans?: PursuitPlan[];
  onSelectPlan?: (planId: string) => void;
  isCompletedToday: boolean;
  onToggleComplete: () => void;
  onAdvanceProgress?: () => void;
  onOpenSetProgress?: () => void;
  onCatchUpProgress?: (targetChapters: number) => void;
  progressUndo?: {
    planId: string;
    prevCompletedUnits: number;
    newCompletedUnits: number;
    secondsRemaining: number;
  } | null;
  onUndoProgress?: () => void;
  onOpenShareModal: () => void;
  onOpenPlanSelector: () => void;
  onOpenEditModal: () => void;
  onCopyInvite: (code: string, title: string) => void;
  onOpenJoinByCode?: () => void;
  isAdmin?: boolean;
  siteSettings?: SiteSettings;
}

export const TodayPursuitCard: React.FC<TodayPursuitCardProps> = ({
  plan,
  joinedPlans = [],
  onSelectPlan,
  isCompletedToday,
  onToggleComplete,
  onAdvanceProgress,
  onOpenSetProgress,
  onCatchUpProgress,
  progressUndo,
  onUndoProgress,
  onOpenShareModal,
  onOpenPlanSelector,
  onOpenEditModal,
  onCopyInvite,
  onOpenJoinByCode,
  isAdmin = false,
  siteSettings,
}) => {
  const canJoinByCode = siteSettings?.allowJoinByInviteCode !== false;
  const canSharePosts = siteSettings?.allowSharingPosts !== false;

  if (!plan) {
    return (
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-stone-50/50 rounded-3xl border border-amber-200/70 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
          🌱
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-2">
          尚未加入任何追求主題
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-5 leading-relaxed font-serif">
          「同那清心呼求主的人，竭力追求公義、信、愛、和平。」（提後二22）
          <br />
          {isAdmin
            ? '歡迎來到晨星共行！您身為管理員，可直接點選「選擇或發起追求主題」，或在後台指派聖徒。'
            : canJoinByCode
            ? '歡迎來到晨星共行！請輸入同伴發送的 6-Emoji 邀請碼，即可加入追求主題一同享受主話。'
            : '歡迎來到晨星共行！請等待服事者或管理員為您指派追求主題。'}
        </p>
        <div className="flex items-center justify-center gap-3">
          {isAdmin ? (
            <button
              onClick={onOpenPlanSelector}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>選擇或開啟追求主題</span>
            </button>
          ) : (
            canJoinByCode &&
            onOpenJoinByCode && (
              <button
                onClick={onOpenJoinByCode}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>輸入 6-Emoji 邀請碼加入</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  const isNTHalfYear = plan.category === 'nt-half-year';
  const isNTSpeed = plan.category === 'nt-speed-reading';
  const speedPace = isNTSpeed ? calculateNTSpeedPace(plan.startDate, plan.endDate, plan.completedUnits) : null;
  const halfYearPace = isNTHalfYear ? calculateNTHalfYearPace(plan.startDate, plan.completedUnits) : null;

  const percent = isNTSpeed && speedPace
    ? Math.min(100, Math.round((speedPace.currentRoundUnits / 260) * 100))
    : Math.round((plan.completedUnits / plan.totalUnits) * 100);

  const unit = plan.unitName || (plan.category === 'bible' || isNTHalfYear || isNTSpeed ? '章' : '篇');

  const [showNTSchedule, setShowNTSchedule] = useState(false);

  const ntScheduleInfo = isNTHalfYear ? getTodayNTSchedule(plan.completedUnits) : null;
  const nextDayNT =
    isNTHalfYear && ntScheduleInfo
      ? getNTDaySchedule(Math.min(TOTAL_NT_DAYS, ntScheduleInfo.dayNumber + 1))
      : null;

  // Category label helper
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'nt-speed-reading':
        return '新約速讀';
      case 'nt-half-year':
        return '半年新約一遍';
      case 'spiritual-books':
        return '屬靈經典';
      case 'custom':
        return '自訂專題';
      case 'life-study':
        return '生命讀經';
      case 'bible':
        return '聖經加註解';
      case 'morning-revival':
        return '晨興聖言';
      default:
        return '追求主題';
    }
  };

  return (
    <div className="today-pursuit-card bg-gradient-to-br from-amber-50/70 via-white to-stone-50/50 dark:bg-slate-800 dark:bg-none rounded-3xl border border-amber-200/70 dark:border-transparent p-5 sm:p-7 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 dark:hidden rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Integrated Pursuit Theme Switcher (追求計畫與追求主題合併) */}
      {joinedPlans.length > 1 && onSelectPlan && (
        <div className="mb-4 relative z-10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-500 mr-1">我的追求主題：</span>
          {joinedPlans.map((jp) => {
            const active = jp.id === plan.id;
            return (
              <button
                key={jp.id}
                type="button"
                onClick={() => onSelectPlan(jp.id)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                  active
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white/80 hover:bg-amber-100/70 text-stone-700 border border-amber-200/70'
                }`}
              >
                {jp.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Tag & Switch / Edit Plan Links */}
      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span>當前追求主題</span>
          </div>
          <span className="text-xs font-semibold text-amber-900/80 bg-amber-100/70 px-2 py-0.5 rounded-full">
            {getCategoryLabel(plan.category)}
          </span>

          {/* 6-Emoji Invite Code Pill with Copy */}
          {plan.inviteCode && (
            <button
              onClick={() => onCopyInvite(plan.inviteCode, plan.title)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full transition-all shadow-2xs"
              title="點擊複製 6-Emoji 邀請碼"
            >
              <span className="tracking-wide text-sm">{plan.inviteCode}</span>
              <span className="text-[10px] text-amber-700 bg-white/70 px-1 py-0.2 rounded font-sans">複製</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Custom Edit button only for admin */}
          {isAdmin && (
            <button
              onClick={onOpenEditModal}
              className="text-xs text-stone-600 hover:text-amber-800 font-medium flex items-center gap-1 hover:underline"
              title="管理員自訂追求主題的書名、進度與篇目"
            >
              <Edit3 className="w-3 h-3 text-amber-600" />
              <span>編輯追求主題</span>
            </button>
          )}

          <button
            onClick={onOpenPlanSelector}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 hover:underline"
          >
            <span>切換追求主題</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Undo Pending Progress Countdown Banner */}
      {progressUndo && progressUndo.planId === plan.id && (
        <div className="mb-4 bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs relative z-10">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 animate-pulse shadow-xs">
              {progressUndo.secondsRemaining}s
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                <span>
                  已將進度設定至第 {progressUndo.newCompletedUnits} {unit}（推進{' '}
                  {progressUndo.newCompletedUnits - progressUndo.prevCompletedUnits} {unit}）！
                </span>
              </div>
              <div className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span>倒數 {progressUndo.secondsRemaining} 秒內可復原；時間到後進度鎖定，不可往回修改</span>
              </div>
            </div>
          </div>
          {onUndoProgress && (
            <button
              type="button"
              onClick={onUndoProgress}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↺ 立即復原（剩餘 {progressUndo.secondsRemaining} 秒）</span>
            </button>
          )}
        </div>
      )}

      {/* Main Chapter Title & Verses */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {plan.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 flex-wrap">
          <div suppressHydrationWarning className="flex items-center gap-1">
            <Users className="w-3 h-3 text-stone-400" />
            <span>{plan.members?.length || 1} 位同伴共行</span>
          </div>
          {plan.startDate && (
            <>
              <span>·</span>
              <span>
                追求期間：{plan.startDate}
                {plan.endDate ? ` ~ ${plan.endDate}` : ' 起'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isNTSpeed && speedPace ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-amber-900 bg-amber-100/70 border border-amber-200/60 px-3 py-1 rounded-xl">
                第 {speedPace.currentRound} 遍追求中 · 第 {Math.min(260, speedPace.currentRoundUnits + 1)} 章 / 共 260 章
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                累計已完成 {speedPace.completedRounds} 遍全書
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-amber-900 bg-amber-100/70 border border-amber-200/60 px-3 py-1 rounded-xl">
              當前進度：第 {Math.min(plan.completedUnits + 1, plan.totalUnits)} {unit} / 共 {plan.totalUnits} {unit}
            </span>
          )}

          {/* Quick Batch Set Progress button */}
          {onOpenSetProgress && (isNTSpeed || plan.completedUnits < plan.totalUnits) && (
            <button
              type="button"
              onClick={onOpenSetProgress}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-white/90 hover:bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-xl transition-all shadow-2xs active:scale-95"
              title={`一次設定讀到第幾${unit}`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>一次設定進度</span>
            </button>
          )}
        </div>

        {/* New Testament Speed Reading Dedicated Pace & Catch-up Card */}
        {isNTSpeed && speedPace && (
          <div
            className={`my-3.5 rounded-2xl p-4 border-2 shadow-xs space-y-3 transition-all ${
              speedPace.paceStatus === 'ahead'
                ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border-emerald-400/80'
                : speedPace.paceStatus === 'behind'
                ? 'bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border-rose-400/80'
                : 'bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-amber-400/80'
            }`}
          >
            {/* Speed Reading Title & Pace Badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs ${
                    speedPace.paceStatus === 'ahead'
                      ? 'bg-emerald-600'
                      : speedPace.paceStatus === 'behind'
                      ? 'bg-rose-600'
                      : 'bg-amber-500'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-white" />
                  <span>⚡ 新約速讀專案（目標 {speedPace.totalDays} 天 · 約 {speedPace.dailyTargetChapters} 章/天）</span>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300">
                  🏅 第 {speedPace.currentRound} 遍追求中 · 累計已圓滿完成 {speedPace.completedRounds} 遍
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                  speedPace.paceStatus === 'ahead'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : speedPace.paceStatus === 'behind'
                    ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse font-extrabold'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {speedPace.paceStatus === 'ahead' && `🔥 進度超前 ${speedPace.paceDelta} 章`}
                {speedPace.paceStatus === 'on-track' && `✨ 穩健跟上進度`}
                {speedPace.paceStatus === 'behind' && `⚠️ 進度落後 ${Math.abs(speedPace.paceDelta)} 章`}
              </span>
            </div>

            {/* Reading pace check reminder banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed font-medium flex items-start gap-2.5 ${
                speedPace.paceStatus === 'ahead'
                  ? 'bg-white/85 border-emerald-200 text-emerald-950'
                  : speedPace.paceStatus === 'behind'
                  ? 'bg-white/95 border-rose-300 text-rose-950 font-semibold shadow-xs'
                  : 'bg-white/85 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex-shrink-0 text-base mt-0.5">
                {speedPace.paceStatus === 'ahead' ? '🔥' : speedPace.paceStatus === 'behind' ? '⚠️' : '✨'}
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm">{speedPace.statusMessage}</p>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5 flex-wrap">
                  <span>
                    期程：{plan.startDate} ~ {plan.endDate || '未設定'}
                  </span>
                  <span>·</span>
                  <span>
                    今日為第 {speedPace.daysElapsed} 天（剩餘 {speedPace.daysRemaining} 天）
                  </span>
                  <span>·</span>
                  <span>
                    今日預定章數：第 {speedPace.expectedChaptersToday} 章【{speedPace.expectedLocation.displayText}】
                  </span>
                </div>
              </div>
            </div>

            {/* If behind speed reading schedule, render 1-click catch-up */}
            {speedPace.paceStatus === 'behind' && onCatchUpProgress && speedPace.expectedChaptersToday > speedPace.currentRoundUnits && (
              <div className="p-3 bg-rose-50/90 border border-rose-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-950">
                      ⚡ 追進度提醒：今日應讀至第 {speedPace.expectedChaptersToday} 章【{speedPace.expectedLocation.displayText}】
                    </div>
                    <div className="text-[11px] text-stone-600">
                      目前第 {speedPace.currentRoundUnits} 章，尚差 {speedPace.expectedChaptersToday - speedPace.currentRoundUnits} 章
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCatchUpProgress(speedPace.completedRounds * 260 + speedPace.expectedChaptersToday)}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all flex-shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>一鍵追上今日進度（第 {speedPace.expectedChaptersToday} 章）</span>
                </button>
              </div>
            )}

            {/* Round progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-stone-600">
                <span>
                  當前第 {speedPace.currentRound} 遍進度：第 {speedPace.currentRoundUnits} 章 / 全 260 章（{speedPace.currentLocation.displayText}）
                </span>
                <span>{Math.round((speedPace.currentRoundUnits / 260) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-stone-200/80 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    speedPace.paceStatus === 'ahead'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : speedPace.paceStatus === 'behind'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((speedPace.currentRoundUnits / 260) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* New Testament Half-Year Dedicated Schedule Card with Pace & Catch-up */}
        {isNTHalfYear && halfYearPace && (
          <div
            className={`my-3.5 rounded-2xl p-4 border-2 shadow-xs space-y-3 transition-all ${
              halfYearPace.paceStatus === 'ahead'
                ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border-emerald-400/80'
                : halfYearPace.paceStatus === 'behind'
                ? 'bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border-rose-400/80'
                : 'bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-amber-400/80'
            }`}
          >
            {/* Header: Title & Pace Status Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs ${
                    halfYearPace.paceStatus === 'ahead'
                      ? 'bg-emerald-600'
                      : halfYearPace.paceStatus === 'behind'
                      ? 'bg-rose-600'
                      : 'bg-amber-500'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span>半年新約讀經進度（一天兩章 · 全 130 天）</span>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300">
                  🗓️ 今日為第 {halfYearPace.expectedDayToday} 天進度（剩餘 {halfYearPace.daysRemaining} 天）
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                    halfYearPace.paceStatus === 'ahead'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : halfYearPace.paceStatus === 'behind'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse font-extrabold'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {halfYearPace.paceStatus === 'ahead' && `🔥 進度超前 ${halfYearPace.paceDelta} 章`}
                  {halfYearPace.paceStatus === 'on-track' && `✨ 穩健跟上進度`}
                  {halfYearPace.paceStatus === 'behind' && `⚠️ 進度落後 ${halfYearPace.behindChapters} 章（需追進度）`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNTSchedule(!showNTSchedule)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline transition-colors"
                >
                  <span>{showNTSchedule ? '收合' : '130天對照表'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNTSchedule ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Reading pace check reminder & status message */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed font-medium flex items-start gap-2.5 ${
                halfYearPace.paceStatus === 'ahead'
                  ? 'bg-white/85 border-emerald-200 text-emerald-950'
                  : halfYearPace.paceStatus === 'behind'
                  ? 'bg-white/95 border-rose-300 text-rose-950 font-semibold shadow-xs'
                  : 'bg-white/85 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex-shrink-0 text-base mt-0.5">
                {halfYearPace.paceStatus === 'ahead' ? '🔥' : halfYearPace.paceStatus === 'behind' ? '⚠️' : '✨'}
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="text-xs sm:text-sm">{halfYearPace.statusMessage}</p>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5 flex-wrap">
                  <span>
                    開始日期：{plan.startDate || '未設定'}
                  </span>
                  <span>·</span>
                  <span>
                    今日表定：第 {halfYearPace.expectedDayToday} 天【{halfYearPace.expectedSchedule.displayText}】（應累計至第 {halfYearPace.expectedChaptersToday} 章）
                  </span>
                  <span>·</span>
                  <span>
                    個人目前累計：{plan.completedUnits} 章 / 全 260 章（下一待讀：{halfYearPace.currentLocation.displayText}）
                  </span>
                </div>
              </div>
            </div>

            {/* If behind schedule, render prominent One-Click Catch Up Action Card */}
            {halfYearPace.paceStatus === 'behind' && onCatchUpProgress && (
              <div className="p-3 bg-gradient-to-r from-rose-500/15 via-amber-500/20 to-rose-500/15 border-2 border-rose-400/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Zap className="w-4 h-4 fill-white text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-rose-950">
                      ⚡ 把握時間追進度！今日應讀至第 {halfYearPace.expectedDayToday} 天【{halfYearPace.expectedSchedule.shortDisplayText}】
                    </div>
                    <div className="text-[11px] text-stone-600">
                      點擊可一鍵將個人進度補讀至今日第 {halfYearPace.expectedChaptersToday} 章（補讀 {halfYearPace.behindChapters} 章，10 秒內隨時可復原）
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCatchUpProgress(halfYearPace.expectedChaptersToday)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all flex-shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>一鍵追進度：補讀至今日（第 {halfYearPace.expectedChaptersToday} 章）</span>
                </button>
              </div>
            )}

            {/* Today Schedule Highlight Box */}
            <div className="bg-white/80 rounded-xl p-3 border border-amber-200/70 flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs text-stone-500 font-semibold block">
                  今日指定進度（第 {halfYearPace.expectedDayToday} 天 / 共 130 天）：
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-amber-900 tracking-tight">
                  {halfYearPace.expectedSchedule.displayText}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-500 font-medium block">新約累計章數目標</span>
                <span className="text-xs sm:text-sm font-bold text-stone-700">
                  第 {halfYearPace.expectedSchedule.startChapter} ～ {halfYearPace.expectedSchedule.endChapter} 章 / 全 260 章
                </span>
              </div>
            </div>

            {/* Collapsible 130 Days Schedule Table */}
            {showNTSchedule && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 max-h-64 overflow-y-auto space-y-1.5 pr-1">
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 px-1">
                  <span>從馬太福音第一章讀至啟示錄二十二章（每日兩章）：</span>
                  <span className="font-semibold text-amber-800">今日表定：第 {halfYearPace.expectedDayToday} 天</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {FULL_130_DAYS_SCHEDULE.map((s) => {
                    const isTodayRow = s.dayNumber === halfYearPace.expectedDayToday;
                    const isPast = s.endChapter <= plan.completedUnits;
                    return (
                      <div
                        key={s.dayNumber}
                        className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between transition-all ${
                          isTodayRow
                            ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs ring-2 ring-amber-300'
                            : isPast
                            ? 'bg-amber-50/50 text-stone-400 border-amber-100/70 line-through'
                            : 'bg-white/80 text-stone-700 border-stone-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[11px] flex-shrink-0 ${isTodayRow ? 'text-white' : 'text-stone-400'}`}>
                            第{s.dayNumber}天
                          </span>
                          <span className="truncate">{s.displayText}</span>
                        </div>
                        <span className={`text-[10px] flex-shrink-0 font-medium ${isTodayRow ? 'text-amber-100' : 'text-stone-400'}`}>
                          {isTodayRow ? '今日指定' : isPast ? '已讀' : `第${s.startChapter}~${s.endChapter}章`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {plan.currentVerses && !isNTHalfYear && !isNTSpeed && (
          <p className="text-xs sm:text-sm font-medium text-stone-600 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-600 inline-block flex-shrink-0" />
            <span>進度經文：{plan.currentVerses}</span>
          </p>
        )}

        {/* Scripture / Summary Quote Box */}
        {plan.summary && (
          <div className="my-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/80 shadow-xs scripture-quote">
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-serif">
              {plan.summary}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 mb-5">
          <div className="flex justify-between text-xs text-stone-500 font-medium mb-1.5">
            <span>
              {isNTSpeed && speedPace ? (
                <>
                  新約速讀統計：已圓滿讀完 {speedPace.completedRounds} 遍（目前第 {speedPace.currentRound} 遍第 {speedPace.currentRoundUnits} / 260 章）
                </>
              ) : (
                <>
                  追求進度：{plan.completedUnits} / {plan.totalUnits} {unit}
                  {isNTHalfYear && `（第 ${Math.min(TOTAL_NT_DAYS, Math.floor(plan.completedUnits / 2))} / ${TOTAL_NT_DAYS} 天）`}
                </>
              )}
            </span>
            <span>{percent}% 完成</span>
          </div>
          <div className="w-full h-2.5 bg-stone-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${
                isNTSpeed && speedPace?.paceStatus === 'ahead'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Quick Catch Up Action Button for Half-Year or Speed Reading when behind */}
          {((isNTHalfYear && halfYearPace?.paceStatus === 'behind') || (isNTSpeed && speedPace?.paceStatus === 'behind')) && onCatchUpProgress && (
            <button
              type="button"
              onClick={() => {
                if (isNTHalfYear && halfYearPace) {
                  onCatchUpProgress(halfYearPace.expectedChaptersToday);
                } else if (isNTSpeed && speedPace) {
                  onCatchUpProgress(speedPace.completedRounds * 260 + speedPace.expectedChaptersToday);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md active:scale-[0.98] transition-all"
            >
              <Zap className="w-4 h-4 text-amber-200 fill-amber-200 animate-pulse" />
              <span>
                {isNTHalfYear && halfYearPace
                  ? `⚡ 一鍵追進度：補讀至今日第 ${halfYearPace.expectedDayToday} 天進度（第 ${halfYearPace.expectedChaptersToday} 章【${halfYearPace.expectedSchedule.shortDisplayText}】）`
                  : isNTSpeed && speedPace
                  ? `⚡ 一鍵追進度：補讀至今日預定進度（第 ${speedPace.expectedChaptersToday} 章【${speedPace.expectedLocation.displayText}】）`
                  : '⚡ 一鍵追進度'}
              </span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isCompletedToday ? (
              <>
                {/* Advance unit button if more chapters to read or if in speed reading */}
                {isNTSpeed || plan.completedUnits < plan.totalUnits ? (
                  <button
                    type="button"
                    onClick={onAdvanceProgress}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/25 active:scale-[0.98] transition-all"
                    title={`今日若有感動多讀，點擊推進進度`}
                  >
                    <BookOpen className="w-4 h-4 text-white" />
                    <span>
                      {isNTHalfYear
                        ? `📖 多讀一天（2 章，推進至第 ${Math.min(TOTAL_NT_DAYS, ntScheduleInfo?.dayNumber ? ntScheduleInfo.dayNumber + 1 : 1)} 天 · ${nextDayNT?.displayText || ''}）`
                        : isNTSpeed && speedPace
                        ? `📖 多讀 1 章（推進至第 ${Math.min(260, speedPace.currentRoundUnits + 1)} 章 · ${speedPace.currentLocation.displayText}）`
                        : `📖 多讀一${unit}（完成第 ${Math.min(plan.completedUnits + 1, plan.totalUnits)} ${unit}）`}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>🎉 本主題全數篇目圓滿完成！</span>
                  </div>
                )}

                {/* Cancel today checkin button if clicked by mistake */}
                <button
                  type="button"
                  onClick={onToggleComplete}
                  className="px-4 py-3 rounded-2xl font-medium text-xs bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-600 border border-stone-200/80 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  title="若誤按勾選今日追求，點此取消打卡狀態"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>取消今日完成</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onToggleComplete}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 active:scale-[0.98]"
              >
                <Circle className="w-5 h-5 text-amber-100" />
                <span>
                  {isNTHalfYear && ntScheduleInfo
                    ? `勾選今日已追求（完成 2 章：${ntScheduleInfo.schedule.displayText}）`
                    : isNTSpeed && speedPace
                    ? `勾選今日已追求（推進 ${Math.max(1, Math.round(speedPace.dailyTargetChapters))} 章 · 至【${getNTChapterLocation(Math.min(260, plan.completedUnits + Math.max(1, Math.round(speedPace.dailyTargetChapters)))).displayText}】）`
                    : '勾選今日已追求'}
                </span>
              </button>
            )}


            {/* Share Light button */}
            {canSharePosts && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-white border border-stone-200 text-stone-700 hover:border-amber-300 hover:text-amber-800 hover:bg-amber-50/50 transition-all shadow-xs active:scale-[0.98]"
              >
                <PenSquare className="w-4 h-4 text-amber-600" />
                <span>分享今日摸著與亮光</span>
              </button>
            )}
          </div>

          {isCompletedToday && (
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>今日追求已打卡。若有多讀可點擊「多讀一篇」繼續推進；若為誤按可點擊「取消今日完成」。</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
