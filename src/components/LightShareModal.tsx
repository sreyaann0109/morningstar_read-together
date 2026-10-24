'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, BookOpen, Edit2 } from 'lucide-react';
import { PursuitPlan, SharingPost } from '../types';

import { getTodayNTSchedule, getNTDaySchedule, TOTAL_NT_DAYS } from '../data/ntBibleData';

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
  const planUnit = currentPlan.unitName || (currentPlan.category === 'bible' || isNTHalfYear ? '章' : '篇');
  const [reflection, setReflection] = useState('');
  const [unitTitle, setUnitTitle] = useState(currentPlan.currentUnitTitle || `第 1 ${planUnit}`);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // Determine default unit:
  // If not completed today: default to current pursuit unit (當前篇數/章數/書卷)
  // If completed today: default to next unit (推薦下一篇/章)
  useEffect(() => {
    if (isOpen) {
      let defaultTitle: string;
      if (isNTHalfYear) {
        if (isCompletedToday) {
          const nextDayNum = Math.min(TOTAL_NT_DAYS, Math.floor(currentPlan.completedUnits / 2) + 1);
          defaultTitle = getNTDaySchedule(nextDayNum).displayText;
        } else {
          defaultTitle = getTodayNTSchedule(currentPlan.completedUnits).schedule.displayText;
        }
      } else {
        let targetNum: number;
        if (isCompletedToday) {
          targetNum = Math.min(currentPlan.completedUnits + 1, currentPlan.totalUnits);
        } else {
          targetNum = Math.min(Math.max(1, currentPlan.completedUnits + 1), currentPlan.totalUnits);
        }
        defaultTitle = `第 ${Math.max(1, targetNum)} ${planUnit}`;
      }
      setUnitTitle(defaultTitle);
      setReflection('');
      setIsCustomUnit(false);
    }
  }, [isOpen, currentPlan.id, currentPlan.completedUnits, currentPlan.totalUnits, isCompletedToday, planUnit, isNTHalfYear]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-7 relative">
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
                  {isCompletedToday
                    ? '分享之篇數進度（今日已完成，預設下一篇，可自行修改）'
                    : '分享之篇數進度（未勾選今日追求，篇數為當前篇數，可自行修改）'}
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
                placeholder="例如：第 3 篇 或 自訂篇名"
                className="w-full text-sm rounded-xl border border-amber-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-amber-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {Array.from({ length: Math.max(currentPlan.totalUnits, 1) }, (_, i) => i + 1).map((num) => {
                    let badge = '';
                    if (!isCompletedToday && num === Math.min(currentPlan.completedUnits + 1, currentPlan.totalUnits)) {
                      badge = `（當前${planUnit}數）`;
                    } else if (isCompletedToday) {
                      if (num === Math.min(currentPlan.completedUnits + 1, currentPlan.totalUnits)) {
                        badge = `（推薦下一${planUnit}）`;
                      } else if (num === currentPlan.completedUnits) {
                        badge = '（今日已完成）';
                      }
                    }
                    return (
                      <option key={num} value={`第 ${num} ${planUnit}`}>
                        第 {num} {planUnit} {badge}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="w-28 text-sm rounded-xl border border-amber-300 bg-white px-2.5 py-2 text-stone-800 text-center"
                  title="或直接修改篇數字樣"
                />
              </div>
            )}
            <p className="text-[10px] text-amber-700/80 mt-1">
              💡 分享篇數將與追求進度同步；若欲調整篇數，可保留自訂輸入或切換選單隨意編輯。
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
