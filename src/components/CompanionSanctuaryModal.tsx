'use client';

import React from 'react';
import { X, Sparkles, HeartHandshake, CheckCircle2, Flame, Award } from 'lucide-react';
import { Companion, SanctuaryConfig, SpiritualRelic } from '../types';
import {
  ALL_SPIRITUAL_RELICS,
  DEFAULT_SANCTUARY_CONFIG,
  SANCTUARY_THEMES,
} from '../data/relicsData';
import { PursuitMap } from './PursuitMap';
import { useBodyScrollLock } from '../lib/scrollLock';

interface CompanionSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: Companion | null;
  companionSanctuary?: SanctuaryConfig;
  onAmenCompanion: (companionId: string, companionName: string) => void;
  hasAmenedToday?: boolean;
  dailyHistory?: Record<string, number>;
  unitName?: string;
}

export const CompanionSanctuaryModal: React.FC<CompanionSanctuaryModalProps> = ({
  isOpen,
  onClose,
  companion,
  companionSanctuary = DEFAULT_SANCTUARY_CONFIG,
  onAmenCompanion,
  hasAmenedToday = false,
  dailyHistory = {},
  unitName = '章',
}) => {
  const [isSpiritualMeaningExpanded, setIsSpiritualMeaningExpanded] = React.useState(false);

  useBodyScrollLock(isOpen);
  if (!isOpen || !companion) return null;

  const themeMeta = SANCTUARY_THEMES[companionSanctuary.theme] || SANCTUARY_THEMES.dawn;

  const placedRelics: (SpiritualRelic | null)[] = companionSanctuary.placedRelicIds.map((relicId) => {
    return ALL_SPIRITUAL_RELICS.find((r) => r.id === relicId) || null;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 relative text-stone-900 dark:text-stone-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Companion Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-2xl shadow-xs">
            {companion.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{companion.name} 的晨興帳幕</h3>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                {companion.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                連續追求 {companion.streakDays} 天
              </span>
              <span>·</span>
              <span>{companion.todayCompleted ? '今日已追求完成' : '今日追求中'}</span>
            </div>
          </div>
        </div>

        {/* Sanctuary Visual Box */}
        <div
          className={`rounded-2xl border ${themeMeta.border} p-5 bg-gradient-to-br ${themeMeta.bgGradient} mb-5 shadow-xs relative overflow-hidden`}
        >
          {/* Theme tag */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold flex items-center gap-1 text-stone-700">
              <span>{themeMeta.icon}</span>
              <span>帳幕氛圍：{themeMeta.label}</span>
            </span>
          </div>

          {/* Motto */}
          <div className="bg-white/80 backdrop-blur-xs rounded-xl px-3.5 py-2 border border-amber-200/50 mb-4 shadow-2xs">
            <span className="text-amber-700 text-[11px] block font-semibold mb-0.5">
              📜 同伴座右銘：
            </span>
            <p className="text-xs text-stone-800 italic font-serif">
              {companionSanctuary.motto || '直等到天發亮，晨星在你們心裏出現。'}
            </p>
          </div>

          {/* Placed Relics display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {placedRelics.map((relic, idx) => (
              <div
                key={idx}
                className="bg-white/90 rounded-xl p-2.5 border border-amber-200/80 flex flex-col items-center justify-center text-center shadow-2xs"
              >
                {relic ? (
                  <>
                    <span className="text-2xl mb-1">{relic.emoji}</span>
                    <span className="text-[10px] font-bold text-stone-800 truncate w-full">
                      {relic.name}
                    </span>
                    <span className="text-[9px] text-amber-700">{relic.categoryLabel}</span>
                  </>
                ) : (
                  <span className="text-xs text-stone-300 py-3">未陳設</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Companion Compact Pursuit Map (同伴追求地圖：袖珍版，點擊無干擾) */}
        <div className="mb-3.5">
          <PursuitMap
            userId={companion.id}
            userName={companion.name}
            unitName={unitName}
            dailyHistory={dailyHistory}
            todayCompleted={companion.todayCompleted}
            compact={true}
            interactive={false}
          />
        </div>

        {/* Relic verses breakdown (Collapsible, default folded) */}
        {placedRelics.filter(Boolean).length > 0 && (
          <div className="mb-4 bg-stone-50/80 dark:bg-stone-800/40 rounded-2xl p-3 border border-stone-200/60 dark:border-stone-700/60">
            <button
              type="button"
              onClick={() => setIsSpiritualMeaningExpanded(!isSpiritualMeaningExpanded)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>陳設信物之屬靈意境（共 {placedRelics.filter(Boolean).length} 件）</span>
              </div>
              <span className="text-[11px] text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-colors">
                {isSpiritualMeaningExpanded ? '收合 ▲' : '點擊展開查看經文 ▼'}
              </span>
            </button>

            {isSpiritualMeaningExpanded && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1 mt-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-700/50 animate-in fade-in">
                {placedRelics.filter(Boolean).map((relic) => (
                  <div
                    key={relic!.id}
                    className="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/60 dark:border-stone-700/60 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
                      <span>{relic!.emoji}</span>
                      <span>{relic!.name}</span>
                      <span className="text-stone-400 dark:text-stone-500 font-normal">· {relic!.meaning}</span>
                    </div>
                    <div className="text-amber-900/90 dark:text-amber-300/90 font-serif italic mt-1">
                      {relic!.verseQuote}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

