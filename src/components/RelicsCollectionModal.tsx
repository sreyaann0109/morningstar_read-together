'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle2, Lock, BookOpen, KeyRound } from 'lucide-react';
import { UserProfile, PursuitPlan, SharingPost } from '../types';
import {
  ALL_SPIRITUAL_RELICS,
  isRelicUnlocked,
  getPlanRelicStats,
  getPlanUnlockedRelics,
} from '../data/relicsData';
import { useBodyScrollLock } from '../lib/scrollLock';

interface RelicsCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currentPlan?: PursuitPlan | null;
  joinedPlans?: PursuitPlan[];
  posts?: SharingPost[];
  onOpenJoinByCode?: () => void;
}

export const RelicsCollectionModal: React.FC<RelicsCollectionModalProps> = ({
  isOpen,
  onClose,
  user,
  currentPlan,
  joinedPlans = [],
  posts = [],
  onOpenJoinByCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>(() => currentPlan ? currentPlan.id : 'all');

  // Sync default filter when modal opens
  React.useEffect(() => {
    if (isOpen && currentPlan) {
      setSelectedPlanFilter(currentPlan.id);
    }
  }, [isOpen, currentPlan]);

  if (!isOpen) return null;

  const hasJoinedPlans = joinedPlans.length > 0;

  // Per-plan relic breakdown
  const planBreakdowns = joinedPlans.map((plan) => {
    const planStats = getPlanRelicStats(plan, user, posts);
    const unlockedRelics = getPlanUnlockedRelics(plan, user, posts);
    return {
      plan,
      stats: planStats,
      unlockedRelics,
      unlockedIds: new Set(unlockedRelics.map((r) => r.id)),
    };
  });

  // Overall stats (strictly 0 if no joined plans)
  const overallStats = {
    totalChaptersRead: hasJoinedPlans ? user.totalChaptersRead : 0,
    streakDays: hasJoinedPlans ? user.streakDays : 0,
    totalSharesCount: hasJoinedPlans ? user.totalSharesCount : 0,
    totalAmenReceived: hasJoinedPlans ? user.totalAmenReceived : 0,
    hasJoinedPlans,
    planCompleted: joinedPlans.some(
      (p) => p.totalUnits > 0 && Math.min(user.totalChaptersRead, p.completedUnits) >= p.totalUnits
    ),
  };

  const activePlanBreakdown =
    selectedPlanFilter !== 'all'
      ? planBreakdowns.find((b) => b.plan.id === selectedPlanFilter) || null
      : null;

  const activeStats = activePlanBreakdown ? activePlanBreakdown.stats : overallStats;

  const unlockedCount = ALL_SPIRITUAL_RELICS.filter((r) =>
    isRelicUnlocked(r.id, activeStats)
  ).length;
  const percent = Math.round((unlockedCount / ALL_SPIRITUAL_RELICS.length) * 100);

  const categories = [
    { key: 'all', label: '全部信物' },
    { key: 'light', label: '光照系列' },
    { key: 'word', label: '話語系列' },
    { key: 'life', label: '生命系列' },
    { key: 'praise', label: '讚美系列' },
  ];

  const filteredRelics =
    selectedCategory === 'all'
      ? ALL_SPIRITUAL_RELICS
      : ALL_SPIRITUAL_RELICS.filter((r) => r.category === selectedCategory);

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-5 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-stone-900">屬靈信物藏寶庫</h3>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {unlockedCount} / {ALL_SPIRITUAL_RELICS.length} 已獲得
              </span>
            </div>
            <p className="text-xs text-stone-500">
              依各追求主題區分信物獲得數量・沒有加入追求主題時不會獲得任何信物
            </p>
          </div>
        </div>

        {/* Per-Theme Breakdown Section */}
        {!hasJoinedPlans ? (
          <div className="mb-5 bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              🌱
            </div>
            <p className="text-sm font-bold text-stone-800">
              尚未加入任何追求主題（目前獲得 0 件信物）
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
              屬靈信物必須在加入追求主題後，隨該主題的每日打卡、篇數推進與亮光分享才能獲得。沒有追求主題時不會獲得任何信物。
            </p>
            {onOpenJoinByCode && user.role !== 'admin' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenJoinByCode();
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>輸入 6-Emoji 邀請碼加入主題</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>各追求主題獲得信物統計（點選主題可檢視該主題信物）</span>
              </span>
              <span className="text-[11px] text-stone-500">
                共參與 {joinedPlans.length} 個主題
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* All Joined Themes Option */}
              <button
                type="button"
                onClick={() => setSelectedPlanFilter('all')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPlanFilter === 'all'
                    ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                    : 'bg-stone-50/70 border-stone-200 hover:border-amber-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-stone-900">
                    ✨ 全部已加入主題總計
                  </span>
                  <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {ALL_SPIRITUAL_RELICS.filter((r) => isRelicUnlocked(r.id, overallStats)).length} / {ALL_SPIRITUAL_RELICS.length} 件
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  綜合所有已加入之追求主題累計獲得信物
                </p>
              </button>

              {/* Individual Joined Theme Cards */}
              {planBreakdowns.map(({ plan, unlockedRelics, stats: pStats }) => {
                const isSelected = selectedPlanFilter === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanFilter(plan.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        📖 {plan.title}
                      </span>
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex-shrink-0">
                        {unlockedRelics.length} / {ALL_SPIRITUAL_RELICS.length} 件
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>
                        已追求 {pStats.totalChaptersRead} 篇 · 連續 {pStats.streakDays} 天
                      </span>
                      <span className="truncate max-w-[110px]">
                        {unlockedRelics.length > 0
                          ? unlockedRelics.map((r) => r.emoji).join(' ')
                          : '尚未獲得'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress bar for active selection */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5">
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <span>
                  {activePlanBreakdown
                    ? `《${activePlanBreakdown.plan.title}》獲得信物：${unlockedCount} 件`
                    : `全部已加入主題總計獲得：${unlockedCount} 件`}
                </span>
                <span className="text-amber-800">{percent}% 完成</span>
              </div>
              <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedCategory === c.key
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Relics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredRelics.map((relic) => {
            const unlocked = isRelicUnlocked(relic.id, activeStats);
            const unlockedByPlans = hasJoinedPlans
              ? planBreakdowns
                  .filter((b) => b.unlockedIds.has(relic.id))
                  .map((b) => b.plan.title)
              : [];

            return (
              <div
                key={relic.id}
                className={`p-4 rounded-2xl border transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-amber-50/60 via-white to-stone-50/40 border-amber-200/90 shadow-2xs hover:shadow-sm'
                    : 'bg-stone-50/60 border-stone-200/70 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-2xs ${
                        unlocked ? 'bg-white border border-amber-200' : 'bg-stone-200/60 grayscale'
                      }`}
                    >
                      {relic.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-900">{relic.name}</span>
                        <span className="text-[10px] bg-amber-100/70 text-amber-800 font-medium px-1.5 py-0.2 rounded-md">
                          {relic.categoryLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 block">{relic.meaning}</span>
                    </div>
                  </div>

                  <div>
                    {unlocked ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已獲得
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        未獲得
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] space-y-1">
                  <div className="text-stone-600">
                    <span className="font-semibold text-stone-700">獲得條件：</span>
                    <span>{relic.requirement}</span>
                  </div>
                  {unlocked && unlockedByPlans.length > 0 && (
                    <div className="text-emerald-800 font-medium">
                      <span>獲得主題：</span>
                      <span>{unlockedByPlans.join('、')}</span>
                    </div>
                  )}
                  <div className="text-amber-900 font-serif italic line-clamp-2">
                    {relic.verseQuote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
          >
            關閉寶庫
          </button>
        </div>
      </div>
    </div>
  );
};
