'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, BookOpen, Edit2 } from 'lucide-react';
import { PursuitPlan, SharingPost } from '../types';
import { useBodyScrollLock } from '../lib/scrollLock';

import { getTodayNTSchedule, getNTDaySchedule, getNTChapterLocation, TOTAL_NT_DAYS, TOTAL_NT_CHAPTERS } from '../data/ntBibleData';

interface LightShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PursuitPlan;
  userId?: string;
  userName: string;
  userAvatar: string;
  isCompletedToday?: boolean;
  onPublish: (newPost: Omit<SharingPost, 'id' | 'createdAt' | 'reactions' | 'comments'>) => void;
}

export const LightShareModal: React.FC<LightShareModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  userId = 'user-me',
  userName,
  userAvatar,
  isCompletedToday = false,
  onPublish,
}) => {
  const isNTHalfYear = currentPlan.category === 'nt-half-year';
  const isNTSpeed = currentPlan.category === 'nt-speed-reading';
  const isNTPlan = isNTHalfYear || isNTSpeed;
  const planUnit = currentPlan.unitName || (currentPlan.category === 'bible' || isNTPlan ? '章' : '篇');
  const [reflection, setReflection] = useState('');
  const [unitTitle, setUnitTitle] = useState(currentPlan.currentUnitTitle || `第 1 ${planUnit}`);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // Determine default unit:
  // If completed today: default to what was completed today (今日已完成章節)
  // If not completed today: default to current pursuit unit (當前篇數/章數/書卷)
  useEffect(() => {
    if (isOpen) {
      let defaultTitle: string;
      if (isNTHalfYear) {
        if (isCompletedToday && currentPlan.completedUnits > 0) {
          const todayDayNum = Math.max(1, Math.min(TOTAL_NT_DAYS, Math.ceil(currentPlan.completedUnits / 2)));
          defaultTitle = getNTDaySchedule(todayDayNum).displayText;
        } else {
          defaultTitle = getTodayNTSchedule(currentPlan.completedUnits).schedule.displayText;
        }
      } else if (isNTSpeed) {
        if (isCompletedToday && currentPlan.completedUnits > 0) {
          const ch = ((currentPlan.completedUnits - 1) % TOTAL_NT_CHAPTERS) + 1;
          defaultTitle = getNTChapterLocation(ch).displayText;
        } else {
          const ch = (currentPlan.completedUnits % TOTAL_NT_CHAPTERS) + 1;
          defaultTitle = getNTChapterLocation(ch).displayText;
        }
      } else {
        let targetNum: number;
        if (isCompletedToday && currentPlan.completedUnits > 0) {
          targetNum = currentPlan.completedUnits;
        } else {
          targetNum = Math.min(Math.max(1, currentPlan.completedUnits + 1), currentPlan.totalUnits);
        }
        defaultTitle = `第 ${Math.max(1, targetNum)} ${planUnit}`;
      }
      setUnitTitle(defaultTitle);
      setReflection('');
      setIsCustomUnit(false);
    }
  }, [isOpen, currentPlan.id, currentPlan.completedUnits, currentPlan.totalUnits, isCompletedToday, planUnit, isNTHalfYear, isNTSpeed]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    onPublish({
      authorId: userId,
      authorName: userName,
      authorRole: '同伴',
      authorAvatar: userAvatar,
      planId: currentPlan.id,
      planTitle: currentPlan.title,
      unitTitle: unitTitle.trim() || currentPlan.currentUnitTitle,
      keyVerse: '',
      reflection: reflection.trim(),
      tags: [],
    });

    // Reset and close
    setReflection('');
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
        className="bg-white rounded-3xl w-full max-w-xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-5 sm:p-7 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">分享今日摸著與亮光</h3>
            <p className="text-xs text-stone-500">
              追求主題：{currentPlan.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit / Chapter Field */}
          <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isNTPlan
                    ? (isCompletedToday ? '分享今日摸著之書卷章節（預設今日已完成章節，可自行調整）' : '分享之書卷章節（可自行選擇或切換自訂）')
                    : (isCompletedToday ? '分享今日摸著之進度（預設今日已完成篇數，可自行調整）' : '分享之進度篇數（可自行選擇或切換自訂）')}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomUnit((prev) => !prev)}
                className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isCustomUnit ? '切換選單' : '自訂輸入'}</span>
              </button>
            </div>

            {isCustomUnit ? (
              <input
                type="text"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                placeholder={isNTPlan ? '例如：馬太福音 第 1 章 或 自訂章節' : '例如：第 3 篇 或 自訂篇名'}
                className="w-full text-sm rounded-xl border border-amber-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            ) : (
              <select
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="w-full text-sm rounded-xl border border-amber-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {isNTSpeed ? (
                  Array.from({ length: TOTAL_NT_CHAPTERS }, (_, i) => i + 1).map((chNum) => {
                    const loc = getNTChapterLocation(chNum);
                    let badge = '';
                    const activeCh = isCompletedToday && currentPlan.completedUnits > 0
                      ? ((currentPlan.completedUnits - 1) % TOTAL_NT_CHAPTERS) + 1
                      : (currentPlan.completedUnits % TOTAL_NT_CHAPTERS) + 1;
                    if (chNum === activeCh) {
                      badge = isCompletedToday ? '（今日已完成）' : '（今日追求）';
                    }
                    return (
                      <option key={chNum} value={loc.displayText}>
                        {loc.displayText} {badge}
                      </option>
                    );
                  })
                ) : isNTHalfYear ? (
                  Array.from({ length: TOTAL_NT_DAYS }, (_, i) => i + 1).map((dayNum) => {
                    const sch = getNTDaySchedule(dayNum);
                    let badge = '';
                    const activeDay = isCompletedToday && currentPlan.completedUnits > 0
                      ? Math.max(1, Math.min(TOTAL_NT_DAYS, Math.ceil(currentPlan.completedUnits / 2)))
                      : Math.max(1, Math.min(TOTAL_NT_DAYS, Math.floor(currentPlan.completedUnits / 2) + 1));
                    if (dayNum === activeDay) {
                      badge = isCompletedToday ? '（今日已完成）' : '（今日追求）';
                    }
                    return (
                      <option key={dayNum} value={sch.displayText}>
                        第 {dayNum} 天 · {sch.displayText} {badge}
                      </option>
                    );
                  })
                ) : (
                  Array.from({ length: Math.max(currentPlan.totalUnits, 1) }, (_, i) => i + 1).map((num) => {
                    let badge = '';
                    if (!isCompletedToday && num === Math.min(currentPlan.completedUnits + 1, currentPlan.totalUnits)) {
                      badge = `（當前${planUnit}數）`;
                    } else if (isCompletedToday && num === currentPlan.completedUnits) {
                      badge = '（今日已完成）';
                    }
                    return (
                      <option key={num} value={`第 ${num} ${planUnit}`}>
                        第 {num} {planUnit} {badge}
                      </option>
                    );
                  })
                )}
              </select>
            )}
            <p className="text-[10px] text-amber-700/80 mt-1">
              💡 分享章節將與追求進度同步；若欲分享其他經文或亮光，可點選「自訂輸入」或由選單切換。
            </p>
          </div>

          {/* Reflection Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              今日摸著與亮光（同伴可以看見並彼此阿們）
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="寫下今天摸著的經節、職事亮光、禱讀感受或生活經歷..."
              rows={5}
              required
              className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all leading-relaxed"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              發布後將同步於同伴動態牆
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!reflection.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>發布亮光分享</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
