'use client';

import React from 'react';
import { Palette, Award, Flame, BookMarked, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { UserProfile, SanctuaryConfig, SpiritualRelic, PursuitPlan, SharingPost } from '../types';
import {
  ALL_SPIRITUAL_RELICS,
  DEFAULT_SANCTUARY_CONFIG,
  SANCTUARY_THEMES,
  isRelicUnlocked,
  getSanctuaryMaxSlots,
  getPlanRelicStats,
} from '../data/relicsData';
import { getUTC8DateString } from '../lib/dateUtils';

interface SanctuaryCardProps {
  user: UserProfile;
  sanctuaryConfig: SanctuaryConfig;
  currentPlan?: PursuitPlan | null;
  joinedPlans?: PursuitPlan[];
  posts?: SharingPost[];
  onOpenCustomize: () => void;
  onOpenCollection: () => void;
}

export const SanctuaryCard: React.FC<SanctuaryCardProps> = ({
  user,
  sanctuaryConfig = DEFAULT_SANCTUARY_CONFIG,
  currentPlan,
  joinedPlans = [],
  posts = [],
  onOpenCustomize,
  onOpenCollection,
}) => {
  const themeMeta = SANCTUARY_THEMES[sanctuaryConfig.theme] || SANCTUARY_THEMES.dawn;
  const hasJoinedPlans = joinedPlans.length > 0 && !!currentPlan;

  // Calculate unlocked relics and progressive slots based on user's real pursuit progress in current plan
  const planStats = currentPlan
    ? getPlanRelicStats(currentPlan, user, posts)
    : {
        totalChaptersRead: 0,
        streakDays: 0,
        totalSharesCount: 0,
        totalAmenReceived: 0,
        hasJoinedPlans: false,
        planCompleted: false,
      };

  const planUnit =
    currentPlan?.unitName ||
    (currentPlan?.category === 'bible' ||
    currentPlan?.category === 'nt-half-year' ||
    currentPlan?.category === 'nt-speed-reading'
      ? '章'
      : '篇');

  const unlockedRelics = hasJoinedPlans
    ? ALL_SPIRITUAL_RELICS.filter((r) => isRelicUnlocked(r.id, planStats))
    : [];
  const unlockedIds = new Set(unlockedRelics.map((r) => r.id));
  const unlockedCount = unlockedRelics.length;
  const { maxSlots, currentTier, nextTier } = getSanctuaryMaxSlots(planStats);

  // Resolve placed relics based on dynamic maxSlots:
  // 1. If user configured placedRelicIds, display the configured relics (that are unlocked) in their slots.
  // 2. If user hasn't configured any, default to the unlocked relics up to maxSlots.
  const userConfiguredIds = sanctuaryConfig.placedRelicIds || [];
  const activePlacedIds =
    userConfiguredIds.length > 0
      ? userConfiguredIds
      : unlockedRelics.map((r) => r.id).slice(0, maxSlots);

  const placedRelics: (SpiritualRelic | null)[] = Array.from({ length: maxSlots }, (_, idx) => {
    const relicId = activePlacedIds[idx];
    if (!relicId) return null;
    if (!unlockedIds.has(relicId)) return null;
    return ALL_SPIRITUAL_RELICS.find((r) => r.id === relicId) || null;
  });

  const memberInCurrentPlan = currentPlan
    ? (currentPlan.members || []).find((m) => m.userId === user.id || m.name === user.name)
    : null;
  const currentUtc8Date = getUTC8DateString();
  const isCompletedToday = memberInCurrentPlan
    ? Boolean(
        (memberInCurrentPlan.dailyHistory?.[currentUtc8Date] || 0) > 0 ||
        (memberInCurrentPlan.todayCompleted && memberInCurrentPlan.lastCompletedDate === currentUtc8Date)
      )
    : false;

  return (
    <div
      className={`sanctuary-card rounded-3xl border ${themeMeta.border} dark:border-transparent p-5 sm:p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-gradient-to-br ${themeMeta.bgGradient} dark:bg-slate-800 dark:bg-none`}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-amber-300/15 dark:hidden rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/80 shadow-2xs flex items-center justify-center text-xl flex-shrink-0">
            {themeMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-base font-bold tracking-tight ${themeMeta.accentColor}`}>
                我的追求帳幕
              </h3>
              {currentPlan && (
                <span
                  className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs max-w-[200px] truncate"
                  title={currentPlan.title}
                >
                  {currentPlan.title.replace(/^主題：/, '')}
                </span>
              )}
              <span className="text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded-full text-stone-600 border border-stone-200/60">
                {themeMeta.label}
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                {currentTier.tierName}（{maxSlots} 格）
              </span>
            </div>
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
              {currentPlan
                ? `當前追求進度：共累計閱讀 ${planStats.totalChaptersRead} ${planUnit}・已解鎖 ${unlockedCount} 件屬靈信物`
                : '請先加入追求主題，即可依進度開展帳幕格子並陳列信物'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCollection}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-700 border border-stone-200/80 hover:border-amber-300 shadow-2xs transition-all flex items-center gap-1"
            title="檢視各追求主題獲得之屬靈信物"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>信物寶庫 ({unlockedCount}/{ALL_SPIRITUAL_RELICS.length})</span>
          </button>

          <button
            onClick={onOpenCustomize}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all flex items-center gap-1 active:scale-95"
            title="自訂帳幕陳設、座右銘與主題"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>佈置陳設架</span>
          </button>
        </div>
      </div>

      {/* Real-time Pursuit Status Panel (追求生活狀態條) */}
      <div className="mb-4 relative z-10 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs border border-amber-200/60 dark:border-transparent shadow-2xs">
        <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
          <span className="font-bold text-stone-700 flex items-center gap-1">
            <span>📊 個人追求即時狀態：</span>
            {currentPlan && (
              <span className="text-amber-800 font-extrabold">
                《{currentPlan.title.replace(/^主題：/, '')}》
              </span>
            )}
          </span>
          <div suppressHydrationWarning className="flex items-center gap-1">
            {isCompletedToday ? (
              <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>今日已完成打卡</span>
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>今日追求進行中</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-100 dark:border-transparent">
            <span className="text-[10px] text-stone-500 block">連續追求天數</span>
            <div className="font-extrabold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{planStats.streakDays} 天</span>
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-100 dark:border-transparent">
            <span className="text-[10px] text-stone-500 block">累計追求{planUnit}數</span>
            <div className="font-extrabold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
              <span>{planStats.totalChaptersRead} {planUnit}</span>
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-100 dark:border-transparent">
            <span className="text-[10px] text-stone-500 block">亮光分享</span>
            <div className="font-extrabold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{planStats.totalSharesCount} 則</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motto Banner */}
      <div className="mb-4 relative z-10">
        <div className="bg-white/75 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl px-4 py-2.5 border border-amber-200/50 dark:border-transparent shadow-2xs flex items-center gap-2">
          <span className="text-amber-600 text-xs flex-shrink-0">📜 帳幕金句：</span>
          <p className="text-xs sm:text-sm font-medium text-stone-700 italic font-serif flex-1 line-clamp-1">
            {sanctuaryConfig.motto || '直等到天發亮，晨星在你們心裏出現。'}
          </p>
        </div>
      </div>

      {/* Relic Altar / Display Pedestal (Progressive Dynamic Slots) */}
      <div className="relative z-10 mb-2">
        <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-700">帳幕陳設架</span>
            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200/60">
              {currentTier.stageName}
            </span>
          </div>
          <span className="text-[10px] text-amber-800 font-semibold bg-white/70 px-2 py-0.5 rounded-full border border-amber-200">
            當前陳設容量：{placedRelics.filter(Boolean).length} / {maxSlots} 格
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {placedRelics.map((relic, idx) => {
            return (
              <div
                key={idx}
                className={`group relative rounded-2xl border p-2.5 flex flex-col items-center justify-center text-center transition-all min-h-[92px] ${
                  relic
                    ? 'bg-white/95 border-amber-200/80 shadow-2xs'
                    : 'bg-stone-100/50 border-dashed border-stone-200/90 text-stone-300'
                }`}
              >
                {relic ? (
                  <>
                    <div className="text-2xl sm:text-3xl mb-1 drop-shadow-xs">
                      {relic.emoji}
                    </div>
                    <span className="text-[10px] font-bold text-stone-800 line-clamp-1">
                      {relic.name}
                    </span>
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded-full mt-0.5 font-medium">
                      {relic.categoryLabel}
                    </span>
                  </>
                ) : (
                  <div
                    onClick={onOpenCustomize}
                    className="flex flex-col items-center justify-center text-stone-400 py-1 cursor-pointer hover:text-amber-700 transition-colors"
                    title="點擊前往佈置陳設架"
                  >
                    <span className="text-base mb-0.5 opacity-40">🪑</span>
                    <span className="text-[10px] text-stone-400">槽位 {idx + 1}</span>
                    <span className="text-[9px] text-stone-300">（空置）</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progressive Tier Upgrade Prompt */}
        {nextTier && (
          <div className="mt-3 px-3.5 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/60 dark:border-transparent text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs">
            <span className="flex items-center gap-1 font-medium">
              <span>✨ 下一階槽位擴充：</span>
              <span>{nextTier.nextRequirementText}</span>
            </span>
            <span className="font-bold text-amber-700 bg-white/70 px-2 py-0.5 rounded-full border border-amber-200/60 self-start sm:self-auto">
              目標：{nextTier.tierName}（{nextTier.maxSlots} 格）
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
        <span>
          💡 每日打卡追求可獲得新鮮信物，亦可於同伴動態中互訪帳幕彼此阿們。
        </span>
      </div>
    </div>
  );
};
