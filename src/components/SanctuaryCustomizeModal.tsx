'use client';

import React, { useState } from 'react';
import { X, Palette, Check, Sparkles, BookOpen, Layers } from 'lucide-react';
import { SanctuaryConfig, SanctuaryTheme, UserProfile, PursuitPlan, SharingPost } from '../types';
import {
  ALL_SPIRITUAL_RELICS,
  SANCTUARY_THEMES,
  isRelicUnlocked,
  getSanctuaryMaxSlots,
  getPlanRelicStats,
} from '../data/relicsData';
import { useBodyScrollLock } from '../lib/scrollLock';

interface SanctuaryCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currentPlan?: PursuitPlan | null;
  joinedPlans?: PursuitPlan[];
  posts?: SharingPost[];
  currentConfig: SanctuaryConfig;
  onSaveConfig: (newConfig: SanctuaryConfig) => void;
}

const PRESET_MOTTOS = [
  '直等到天發亮，晨星在你們心裏出現。（彼後一19）',
  '同那清心呼求主的人，竭力追求公義、信、愛、和平。（提後二22）',
  '你的話是我腳前的燈，是我路上的光。（詩一一九105）',
  '我是葡萄樹，你們是枝子；住在我裏面的，我也住在他裏面，這人就多結果子。（約十五5）',
  '主就是那靈；主的靈在那裏，那裏就有自由。（林後三17）',
  '操練自己以致敬虔；惟獨敬虔，凡事都有益處。（提前四7-8）',
];

export const SanctuaryCustomizeModal: React.FC<SanctuaryCustomizeModalProps> = ({
  isOpen,
  onClose,
  user,
  currentPlan,
  joinedPlans = [],
  posts = [],
  currentConfig,
  onSaveConfig,
}) => {
  const hasJoinedPlans = joinedPlans.length > 0 && !!currentPlan;
  const stats = currentPlan
    ? getPlanRelicStats(currentPlan, user, posts)
    : {
        totalChaptersRead: 0,
        streakDays: 0,
        totalSharesCount: 0,
        totalAmenReceived: 0,
        hasJoinedPlans: false,
        planCompleted: false,
      };

  const unlockedRelics = hasJoinedPlans
    ? ALL_SPIRITUAL_RELICS.filter((r) => isRelicUnlocked(r.id, stats))
    : [];
  const unlockedIds = new Set(unlockedRelics.map((r) => r.id));

  const [theme, setTheme] = useState<SanctuaryTheme>(currentConfig.theme || 'dawn');
  const [motto, setMotto] = useState<string>(currentConfig.motto || PRESET_MOTTOS[0]);
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>(
    (currentConfig.placedRelicIds || []).filter((id) => unlockedIds.has(id))
  );

  React.useEffect(() => {
    if (isOpen) {
      setTheme(currentConfig.theme || 'dawn');
      setMotto(currentConfig.motto || PRESET_MOTTOS[0]);
      setSelectedRelicIds(
        (currentConfig.placedRelicIds || []).filter((id) => unlockedIds.has(id))
      );
    }
  }, [isOpen, currentConfig, stats.totalChaptersRead, stats.streakDays]);

  if (!isOpen) return null;

  const { maxSlots, currentTier, nextTier } = getSanctuaryMaxSlots(stats);
  const validSelectedRelicIds = selectedRelicIds.filter((id) => unlockedIds.has(id));

  const toggleRelic = (relicId: string) => {
    if (!unlockedIds.has(relicId)) return;
    if (validSelectedRelicIds.includes(relicId)) {
      // remove
      setSelectedRelicIds(validSelectedRelicIds.filter((id) => id !== relicId));
    } else {
      // add up to dynamic maxSlots
      if (validSelectedRelicIds.length < maxSlots) {
        setSelectedRelicIds([...validSelectedRelicIds, relicId]);
      } else {
        // replace the oldest one
        setSelectedRelicIds([...validSelectedRelicIds.slice(1), relicId]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      theme,
      motto: motto.trim() || PRESET_MOTTOS[0],
      placedRelicIds: validSelectedRelicIds,
    });
    onClose();
  };

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
        className="bg-white rounded-3xl w-full max-w-lg max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-5 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">佈置我的晨興帳幕</h3>
            <p className="text-xs text-stone-500">
              選擇專屬氛圍主題、陳設您喜愛的屬靈信物與經節座右銘
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Theme Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              1. 選擇帳幕氛圍主題
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(SANCTUARY_THEMES).map(([key, item]) => {
                const isSelected = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key as SanctuaryTheme)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 font-bold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs text-stone-800">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Motto Selection / Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                2. 帳幕立志金句座右銘
              </label>
              <span className="text-[10px] text-stone-400">可自選或自訂輸入</span>
            </div>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="例如：直等到天發亮，晨星在你們心裏出現。"
              className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 font-medium"
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_MOTTOS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMotto(p)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition-colors text-left ${
                    motto === p
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  {p.slice(0, 14)}...
                </button>
              ))}
            </div>
          </div>

          {/* 3. Relics Placement Altar (Pick up to maxSlots) */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div>
                <label className="text-xs font-bold text-stone-700">
                  3. 陳設架信物擺設（點選以放置，當前容量 {maxSlots} 格）
                </label>
                <span className="text-[10px] text-amber-800 font-medium block">
                  {currentTier.tierName}
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                已選 {selectedRelicIds.length} / {maxSlots} 格
              </span>
            </div>

            {/* Currently Selected maxSlots preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 max-h-56 overflow-y-auto overscroll-contain">
              {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                const rId = selectedRelicIds[slotIdx];
                const relic = ALL_SPIRITUAL_RELICS.find((r) => r.id === rId);
                return (
                  <div
                    key={slotIdx}
                    onClick={() => rId && toggleRelic(rId)}
                    className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      relic
                        ? 'bg-white border-amber-300 shadow-2xs hover:bg-rose-50 hover:border-rose-300'
                        : 'border-dashed border-stone-300 bg-white/50 text-stone-400'
                    }`}
                    title={relic ? '點擊可卸下信物' : '空置槽位'}
                  >
                    {relic ? (
                      <>
                        <span className="text-xl">{relic.emoji}</span>
                        <span className="text-[10px] font-semibold text-stone-700 line-clamp-1">
                          {relic.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-stone-300">槽位 {slotIdx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Tier Upgrade Info */}
            {nextTier && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 mb-3 flex items-center justify-between">
                <span>✨ 擴充下一階容量：{nextTier.nextRequirementText}</span>
                <span className="font-semibold text-amber-700">（+{nextTier.maxSlots - maxSlots}格）</span>
              </div>
            )}

            {/* Unlocked Relic Inventory list */}
            <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
              我的解鎖信物庫（點擊選入或替換）：
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto overscroll-contain p-1">
              {unlockedRelics.map((r) => {
                const isSelected = selectedRelicIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRelic(r.id)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400 shadow-2xs'
                        : 'border-stone-200 hover:border-amber-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-stone-800 truncate">
                        {r.name}
                      </div>
                      <div className="text-[9px] text-stone-400 truncate">{r.categoryLabel}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 justify-end border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存帳幕佈置</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
