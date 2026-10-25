'use client';

import React from 'react';
import { X, Flame, Trophy, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { getUTC8DateString, addDaysUTC8 } from '../lib/dateUtils';
import { useBodyScrollLock } from '../lib/scrollLock';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, user }) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  // Dynamically generate the exact last 7 calendar days ending today in UTC+8
  const todayStr = getUTC8DateString();
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const daysAgo = 6 - idx; // 6, 5, 4, 3, 2, 1, 0
    const dStr = addDaysUTC8(todayStr, -daysAgo);
    const [, m, d] = dStr.split('-').map(Number);
    const dayOfWeek = new Date(`${dStr}T00:00:00+08:00`).getDay();
    const weekday = WEEKDAY_NAMES[dayOfWeek];
    const isCompleted = user.streakDays > daysAgo;
    return {
      dateLabel: `${m}/${d}`,
      dayLabel: daysAgo === 0 ? '今天' : `週${weekday}`,
      isCompleted,
    };
  });

  const completedInLast7 = last7Days.filter((d) => d.isCompleted).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-6 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-3xl shadow-md shadow-amber-500/20">
            {user.avatar}
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{user.name}</h3>
            <p className="text-xs text-stone-500">{user.email || '同伴同行'}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-amber-700">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>已連續晨興追求 {user.streakDays} 天</span>
            </div>
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3 sm:p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-bold text-amber-800">
              {user.streakDays}
            </span>
            <span className="text-[11px] sm:text-xs text-amber-900/70 font-medium">連續追求天數</span>
          </div>
          <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-3 sm:p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-bold text-stone-800">
              {user.totalChaptersRead}
            </span>
            <span className="text-[11px] sm:text-xs text-stone-500 font-medium">累積追求篇數</span>
          </div>
          <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-3 sm:p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-bold text-stone-800">
              {user.totalSharesCount}
            </span>
            <span className="text-[11px] sm:text-xs text-stone-500 font-medium">分享亮光心得</span>
          </div>
        </div>

        {/* Weekly Streak Circle Row with Real Calendar Dates */}
        <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/60 mb-6">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-stone-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              最近 7 日追求紀錄
            </span>
            <span className={completedInLast7 === 7 ? 'text-emerald-700' : 'text-amber-700'}>
              {completedInLast7 === 7
                ? '近 7 日全勤完成 ✨'
                : `近 7 日完成 ${completedInLast7} / 7 天`}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {last7Days.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                    item.isCompleted
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-200/70 text-stone-400'
                  }`}
                >
                  {item.isCompleted ? '✓' : '—'}
                </div>
                <span className="text-[11px] font-semibold text-stone-700 leading-tight">
                  {item.dateLabel}
                </span>
                <span className="text-[10px] text-stone-400 leading-none">
                  {item.dayLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones / Badges */}
        <div>
          <h4 className="text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            追求屬靈里程碑
          </h4>
          <div className="space-y-2.5">
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                user.streakDays >= 7
                  ? 'bg-amber-50/60 border-amber-200/60'
                  : 'bg-stone-50 border-stone-200/70 opacity-85'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  user.streakDays >= 7
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                🌟
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">晨星初現</span>
                  {user.streakDays >= 7 ? (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      已達成
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">
                      進度 {Math.min(user.streakDays, 7)}/7 天
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">連續追求 7 天不中斷</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                user.streakDays >= 14
                  ? 'bg-amber-50/60 border-amber-200/60'
                  : 'bg-stone-50 border-stone-200/70 opacity-85'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  user.streakDays >= 14
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                🕊️
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">靈裡得力</span>
                  {user.streakDays >= 14 ? (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      已達成
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">
                      進度 {Math.min(user.streakDays, 14)}/14 天
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">連續追求 14 天晨興生活</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                user.streakDays >= 30
                  ? 'bg-amber-50/60 border-amber-200/60'
                  : 'bg-stone-50 border-stone-200/70 opacity-85'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  user.streakDays >= 30
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                🏆
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">竭力奔跑</span>
                  {user.streakDays >= 30 ? (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      已達成
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">
                      進度 {Math.min(user.streakDays, 30)}/30 天
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">連續追求 30 天建立穩固生活</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
