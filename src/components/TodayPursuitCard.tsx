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
  onCopyInvite?: (code: string, title: string) => void;
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

  // Location & Schedule helpers for Half-Year Reading
  const lastFinishedLocation = isNTHalfYear && plan.completedUnits > 0 ? getNTChapterLocation(plan.completedUnits) : null;
  const nextLocation = isNTHalfYear ? getNTChapterLocation(Math.min(TOTAL_NT_CHAPTERS, plan.completedUnits + 1)) : null;
  const ntScheduleInfo = isNTHalfYear ? getTodayNTSchedule(plan.completedUnits) : null;
  const nextReadScheduleText = ntScheduleInfo?.schedule.displayText || nextLocation?.displayText || '馬太福音 第 1 章';

  // Location helpers for Speed Reading
  const speedFinishedLocation = isNTSpeed && speedPace && speedPace.currentRoundUnits > 0
    ? getNTChapterLocation(speedPace.currentRoundUnits)
    : null;
  const speedNextLocation = isNTSpeed && speedPace
    ? getNTChapterLocation(Math.min(TOTAL_NT_CHAPTERS, speedPace.currentRoundUnits + 1))
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

      {/* Top Header styled consistently with other section blocks */}
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-stone-200/70 dark:border-stone-700/60 relative z-10 flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                當前追求主題
              </h3>
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800">
                {getCategoryLabel(plan.category)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              同那清心呼求主的人，同心合意竭力追求主話
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">


          {/* Custom Edit button only for admin */}
          {isAdmin && (
            <button
              onClick={onOpenEditModal}
              className="text-xs text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
              title="管理員自訂追求主題的書名、進度與篇目"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>編輯追求主題</span>
            </button>
          )}

          <button
            onClick={onOpenPlanSelector}
            className="text-xs text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
          >
            <span>切換追求主題</span>
            <ArrowRight className="w-3.5 h-3.5" />
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

        {/* Top Progress Pill & Set Progress Button */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isNTHalfYear ? (
            <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 px-3 py-1 rounded-xl">
              目前進度：{lastFinishedLocation ? `已讀至【${lastFinishedLocation.displayText}】` : '尚未開始追求'}
            </span>
          ) : isNTSpeed && speedPace ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 px-3 py-1 rounded-xl">
                目前進度：{speedFinishedLocation ? `已讀至【${speedFinishedLocation.displayText}】` : '尚未開始'}（第 {speedPace.currentRound} 遍）
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl">
                累計已完成 {speedPace.completedRounds} 遍全書
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 px-3 py-1 rounded-xl">
              當前進度：第 {Math.min(plan.completedUnits + 1, plan.totalUnits)} {unit} / 共 {plan.totalUnits} {unit}
            </span>
          )}

          {/* Quick Batch Set Progress button */}
          {onOpenSetProgress && (isNTSpeed || plan.completedUnits < plan.totalUnits) && (
            <button
              type="button"
              onClick={onOpenSetProgress}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-white/90 dark:bg-stone-800 hover:bg-amber-100/90 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-xl transition-all shadow-2xs active:scale-95"
              title="一次設定進度"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>一次設定進度</span>
            </button>
          )}
        </div>

        {/* Core Progress Dashboard: Clear distinction between "My Current Progress" vs "Today's Target Schedule" */}
        {isNTHalfYear && halfYearPace ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
            {/* Left Card: My Personal Progress */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>我目前進度</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      halfYearPace.paceStatus === 'ahead'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                        : halfYearPace.paceStatus === 'behind'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                        : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                    }`}
                  >
                    {halfYearPace.paceStatus === 'ahead' && `🔥 超前 ${halfYearPace.paceDelta} 章`}
                    {halfYearPace.paceStatus === 'on-track' && `✨ 穩健跟上`}
                    {halfYearPace.paceStatus === 'behind' && `⚠️ 落後 ${halfYearPace.behindDays} 天（${halfYearPace.behindChapters} 章）`}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight my-1">
                  {lastFinishedLocation ? `已讀至：${lastFinishedLocation.displayText}` : '尚未開始追求'}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span>
                  下一期待讀：<strong className="text-amber-800 dark:text-amber-300">{nextReadScheduleText}</strong>
                </span>
                <span className="text-[11px] text-stone-400">
                  已讀 {Math.floor(plan.completedUnits / 2)} 天 / 全 130 天
                </span>
              </div>
            </div>

            {/* Right Card: Today's Scheduled Target */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>今日表定進度</span>
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    第 {halfYearPace.expectedDayToday} 天 / 共 130 天
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-200 tracking-tight my-1">
                  {halfYearPace.expectedSchedule.displayText}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span>
                  期程剩餘：<strong className="text-stone-800 dark:text-stone-200">{halfYearPace.daysRemaining} 天</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowNTSchedule(!showNTSchedule)}
                  className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{showNTSchedule ? '收合對照表' : '130天對照表'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showNTSchedule ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ) : isNTSpeed && speedPace ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
            {/* Speed Left Card */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>我目前進度</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      speedPace.paceStatus === 'ahead'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                        : speedPace.paceStatus === 'behind'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                        : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                    }`}
                  >
                    {speedPace.paceStatus === 'ahead' && `🔥 超前 ${speedPace.paceDelta} 章`}
                    {speedPace.paceStatus === 'on-track' && `✨ 穩健跟上`}
                    {speedPace.paceStatus === 'behind' && `⚠️ 落後 ${Math.abs(speedPace.paceDelta)} 章`}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight my-1">
                  {speedFinishedLocation ? `已讀至：${speedFinishedLocation.displayText}` : '尚未開始速讀'}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span>
                  下一待讀：<strong className="text-amber-800 dark:text-amber-300">{speedNextLocation?.displayText || ''}</strong>
                </span>
                <span className="text-[11px] text-stone-400">
                  第 {speedPace.currentRound} 遍追求中
                </span>
              </div>
            </div>

            {/* Speed Right Card */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>今日表定進度</span>
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    第 {speedPace.daysElapsed} 天 / 共 {speedPace.totalDays} 天
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-200 tracking-tight my-1">
                  {speedPace.expectedLocation.displayText}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span>
                  每日目標：約 <strong className="text-stone-800 dark:text-stone-200">{speedPace.dailyTargetChapters} 章</strong>
                </span>
                <span className="text-[11px] text-stone-400">
                  剩餘 {speedPace.daysRemaining} 天
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
            {/* Regular Plan Left Card */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>我目前進度</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
                    {percent}% 完成
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight my-1">
                  已完成第 {plan.completedUnits} {unit}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span>
                  下一篇目：<strong className="text-amber-800 dark:text-amber-300">第 {Math.min(plan.totalUnits, plan.completedUnits + 1)} {unit}</strong>
                </span>
                <span className="text-[11px] text-stone-400">
                  共 {plan.totalUnits} {unit}
                </span>
              </div>
            </div>

            {/* Regular Plan Right Card */}
            <div className="bg-white/90 dark:bg-stone-900/60 rounded-2xl p-4 border border-amber-200/80 dark:border-stone-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>當前追求篇目</span>
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-200 tracking-tight my-1">
                  {plan.currentUnitTitle || `第 ${Math.min(plan.totalUnits, plan.completedUnits + 1)} ${unit}`}
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-1">
                <span className="truncate max-w-[240px]">
                  {plan.currentVerses ? `經文：${plan.currentVerses}` : plan.summary || '按部就班，一同追求'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Single Elegant Catch-Up Strip (Only shown when behind schedule - NO DUPLICATE BUTTONS) */}
        {isNTHalfYear && halfYearPace?.paceStatus === 'behind' && onCatchUpProgress && (
          <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  進度落後約 {halfYearPace.behindDays} 天（今日表定至【{halfYearPace.expectedSchedule.displayText}】）
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  點擊可一鍵將個人進度補齊至今日（10 秒內隨時可復原）
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCatchUpProgress(halfYearPace.expectedChaptersToday)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all flex-shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>⚡ 一鍵追上今日進度</span>
            </button>
          </div>
        )}

        {isNTSpeed && speedPace?.paceStatus === 'behind' && onCatchUpProgress && speedPace.expectedChaptersToday > speedPace.currentRoundUnits && (
          <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  進度落後約 {Math.abs(speedPace.paceDelta)} 章（今日表定讀至【{speedPace.expectedLocation.displayText}】）
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  點擊可一鍵補齊進度至今日（10 秒內隨時可復原）
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCatchUpProgress(speedPace.completedRounds * 260 + speedPace.expectedChaptersToday)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all flex-shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>⚡ 一鍵追上今日進度</span>
            </button>
          </div>
        )}

        {/* Collapsible 130 Days Schedule Table */}
        {isNTHalfYear && halfYearPace && showNTSchedule && (
          <div className="my-3 p-3.5 bg-white/90 dark:bg-stone-900/80 rounded-2xl border border-amber-200/80 dark:border-stone-700 max-h-64 overflow-y-auto space-y-1.5 pr-1 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2 px-1">
              <span>從馬太福音第一章讀至啟示錄二十二章（每日兩章）：</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">今日表定：第 {halfYearPace.expectedDayToday} 天</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {FULL_130_DAYS_SCHEDULE.map((s) => {
                const isTodayRow = s.dayNumber === halfYearPace.expectedDayToday;
                const isPast = s.endChapter <= plan.completedUnits;
                return (
                  <div
                    key={s.dayNumber}
                    className={`px-3 py-1.5 rounded-xl border flex items-center justify-between transition-all ${
                      isTodayRow
                        ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs ring-2 ring-amber-300'
                        : isPast
                        ? 'bg-amber-50/50 dark:bg-stone-800/40 text-stone-400 border-amber-100/70 dark:border-stone-800 line-through'
                        : 'bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[11px] flex-shrink-0 ${isTodayRow ? 'text-white' : 'text-stone-400'}`}>
                        第 {s.dayNumber} 天
                      </span>
                      <span className="truncate">{s.displayText}</span>
                    </div>
                    <span className={`text-[10px] flex-shrink-0 font-medium ${isTodayRow ? 'text-amber-100' : 'text-stone-400'}`}>
                      {isTodayRow ? '今日指定' : isPast ? '已讀' : '未讀'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {plan.currentVerses && !isNTHalfYear && !isNTSpeed && (
          <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-600 inline-block flex-shrink-0" />
            <span>進度經文：{plan.currentVerses}</span>
          </p>
        )}

        {/* Scripture / Summary Quote Box */}
        {plan.summary && (
          <div className="my-3 bg-white/80 dark:bg-stone-900/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-100/80 dark:border-stone-800 shadow-xs scripture-quote">
            <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
              {plan.summary}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 mb-4">
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 font-medium mb-1.5">
            <span>
              {isNTHalfYear ? (
                <>追求全貌：已讀至【{lastFinishedLocation ? lastFinishedLocation.displayText : '馬太福音起點'}】（全新約 27 卷書）</>
              ) : isNTSpeed && speedPace ? (
                <>速讀追求：已讀至【{speedFinishedLocation ? speedFinishedLocation.displayText : '馬太福音起點'}】（第 {speedPace.currentRound} 遍）</>
              ) : (
                <>追求全貌：已完成第 {plan.completedUnits} / {plan.totalUnits} {unit}</>
              )}
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">{percent}% 完成</span>
          </div>
          <div className="w-full h-2.5 bg-stone-200/80 dark:bg-stone-700 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out shadow-xs bg-gradient-to-r from-amber-400 to-amber-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isCompletedToday ? (
              <>
                {/* Advance unit button if more chapters to read or if in speed reading */}
                {isNTSpeed || plan.completedUnits < plan.totalUnits ? (
                  <button
                    type="button"
                    onClick={onAdvanceProgress}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-sm shadow-amber-500/25 transition-all"
                    title="今日若有感動多讀，點擊推進進度"
                  >
                    <BookOpen className="w-4 h-4 text-white" />
                    <span>
                      {isNTHalfYear
                        ? `📖 多讀一天（推進至【${nextReadScheduleText}】）`
                        : isNTSpeed && speedPace
                        ? `📖 多讀 1 章（推進至【${speedNextLocation?.displayText || ''}】）`
                        : `📖 多讀一${unit}（完成第 ${Math.min(plan.completedUnits + 1, plan.totalUnits)} ${unit}）`}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>🎉 本追求主題全數篇目圓滿完成！</span>
                  </div>
                )}

                {/* Cancel today checkin button if clicked by mistake */}
                <button
                  type="button"
                  onClick={onToggleComplete}
                  className="px-4 py-3 rounded-2xl font-medium text-xs bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
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
                    ? `勾選今日已追求（${ntScheduleInfo.schedule.displayText}）`
                    : isNTSpeed && speedPace
                    ? `勾選今日已追求（推進至【${getNTChapterLocation(Math.min(260, plan.completedUnits + Math.max(1, Math.round(speedPace.dailyTargetChapters)))).displayText}】）`
                    : '勾選今日已追求'}
                </span>
              </button>
            )}

            {/* Share Light button */}
            {canSharePosts && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-amber-300 hover:text-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all shadow-xs active:scale-[0.98]"
              >
                <PenSquare className="w-4 h-4 text-amber-600" />
                <span>分享今日摸著與亮光</span>
              </button>
            )}
          </div>

          {isCompletedToday && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>今日追求已打卡。若有多讀可點擊「多讀一篇」繼續推進；若為誤按可點擊「取消今日完成」。</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
