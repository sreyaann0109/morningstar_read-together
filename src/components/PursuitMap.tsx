'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  BookOpen,
  Trophy,
} from 'lucide-react';

interface PursuitMapProps {
  userId: string;
  userName: string;
  unitName?: string;
  dailyHistory: Record<string, number>; // Key: YYYY-MM-DD -> units read
  todayCompleted?: boolean;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const PursuitMap: React.FC<PursuitMapProps> = ({
  userId,
  userName,
  unitName = '章',
  dailyHistory = {},
  todayCompleted = false,
}) => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1; // 1-12
  const todayDate = today.getDate();
  const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

  const [viewYear, setViewYear] = useState<number>(todayYear);
  const [viewMonth, setViewMonth] = useState<number>(todayMonth);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    dayNum: number;
    units: number;
  } | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDayInfo(null);
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDayInfo(null);
  };

  const handleResetToCurrentMonth = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    setSelectedDayInfo(null);
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

  // Monthly statistics
  let monthPursuitDaysCount = 0;
  let monthTotalUnits = 0;
  let monthMaxUnits = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = dailyHistory[dStr] || 0;
    if (count > 0) {
      monthPursuitDaysCount++;
      monthTotalUnits += count;
      if (count > monthMaxUnits) {
        monthMaxUnits = count;
      }
    }
  }

  // Level determination for heat map styling
  const getLevelClasses = (units: number) => {
    if (units === 0) {
      return 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/60 dark:border-[#273449] text-stone-300 dark:text-stone-600';
    }
    if (units <= 2) {
      return 'bg-amber-100/80 dark:bg-amber-500/20 border-amber-300/80 dark:border-amber-500/50 text-amber-900 dark:text-amber-200 font-bold';
    }
    if (units <= 4) {
      return 'bg-amber-300/85 dark:bg-amber-500/40 border-amber-400 dark:border-amber-400 text-amber-950 dark:text-amber-100 font-extrabold shadow-2xs';
    }
    // 5+ units
    return 'bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 border-amber-500 text-white font-extrabold shadow-xs';
  };

  const isCurrentMonthView = viewYear === todayYear && viewMonth === todayMonth;

  return (
    <div className="bg-white dark:bg-stone-900/70 rounded-3xl border border-stone-200/80 dark:border-[#273449] p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden text-stone-900">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-200/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
            🗺️
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 tracking-tight">
              追求地圖
            </h3>
            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-full">
              每日方格
            </span>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-1.5">
          {!isCurrentMonthView && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
            >
              本月
            </button>
          )}

          <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 rounded-xl p-0.5 border border-stone-200/70 dark:border-[#273449]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
              title="上個月"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 min-w-[76px] text-center select-none">
              {viewYear}年{viewMonth}月
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
              title="下個月"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Statistics Summary Bar */}
      <div suppressHydrationWarning className="grid grid-cols-3 gap-1.5 mb-3 relative z-10">
        <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 rounded-xl py-1.5 px-2 text-center">
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 block leading-tight">
            本月天數
          </span>
          <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100 leading-tight">
            {monthPursuitDaysCount} <span className="text-[10px] font-normal">天</span>
          </span>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 rounded-xl py-1.5 px-2 text-center">
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 block leading-tight">
            本月累計
          </span>
          <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100 leading-tight">
            {monthTotalUnits} <span className="text-[10px] font-normal">{unitName}</span>
          </span>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 rounded-xl py-1.5 px-2 text-center">
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 block leading-tight">
            單日最高
          </span>
          <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100 leading-tight">
            {monthMaxUnits} <span className="text-[10px] font-normal">{unitName}</span>
          </span>
        </div>
      </div>

      {/* Calendar Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-stone-400 dark:text-stone-500">
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            className={`py-0.5 ${idx === 0 || idx === 6 ? 'text-amber-700 dark:text-amber-400' : ''}`}
          >
            週{w}
          </div>
        ))}
      </div>

      {/* Calendar Grid of Day Squares (每一天為一方格) */}
      <div suppressHydrationWarning className="grid grid-cols-7 gap-1 sm:gap-1.5 relative z-10">
        {/* Empty padding boxes before the 1st day of the month */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div
            key={`pad-${idx}`}
            className="aspect-square rounded-lg bg-transparent border border-dashed border-stone-100 dark:border-stone-800/40 opacity-20"
          />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const units = dailyHistory[dateStr] || 0;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDayInfo?.dateStr === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDayInfo({ dateStr, dayNum: day, units })}
              className={`aspect-square rounded-lg sm:rounded-xl border p-1 flex flex-col justify-between transition-all cursor-pointer relative group select-none hover:scale-105 active:scale-95 ${getLevelClasses(
                units
              )} ${
                isToday
                  ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-white dark:ring-offset-stone-900 shadow-2xs font-extrabold'
                  : ''
              } ${
                isSelected
                  ? 'border-amber-600 dark:border-amber-300 ring-2 ring-amber-400/80 shadow-xs'
                  : ''
              }`}
              title={`${viewMonth}月${day}日：追求 ${units} ${unitName}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full leading-none">
                <span
                  className={`text-[8px] sm:text-[9px] ${
                    units >= 5
                      ? 'text-white'
                      : isToday
                      ? 'text-amber-800 dark:text-amber-300 font-extrabold'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {day}
                </span>

                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                )}
              </div>

              {/* Units Display inside Square (方格內顯示當天讀了多少單位) */}
              <div className="flex-1 flex items-center justify-center text-center">
                {units > 0 ? (
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span
                      className={`text-[11px] sm:text-xs font-black leading-none ${
                        units >= 5 ? 'text-white' : ''
                      }`}
                    >
                      {units}
                    </span>
                    <span
                      className={`text-[7px] sm:text-[8px] font-medium leading-none mt-0.5 ${
                        units >= 5
                          ? 'text-amber-100'
                          : 'text-amber-800/80 dark:text-amber-300/80'
                      }`}
                    >
                      {unitName}
                    </span>
                  </div>
                ) : (
                  <span className="text-stone-300 dark:text-stone-600 text-[10px] leading-none">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Detail Popover / Banner */}
      {selectedDayInfo && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
              {selectedDayInfo.dayNum}
            </div>
            <div className="text-xs">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {viewMonth}月{selectedDayInfo.dayNum}日：
              </span>{' '}
              {selectedDayInfo.units > 0 ? (
                <span className="font-extrabold text-amber-800 dark:text-amber-300">
                  追求 {selectedDayInfo.units} {unitName}
                </span>
              ) : (
                <span className="text-stone-400">當日尚未追求</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDayInfo(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compact Legend */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-[#273449] flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 flex-wrap gap-1">
        <span className="font-medium text-stone-500 dark:text-stone-400">方格色階：</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-[#273449]" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-300 dark:bg-amber-500/40 border border-amber-400" />
            <span>3-4</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>5+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
