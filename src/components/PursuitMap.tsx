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
  compact?: boolean;
  interactive?: boolean; // 設為 false 時點擊無動作、無浮層彈窗，專為袖珍展示設計
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const PursuitMap: React.FC<PursuitMapProps> = ({
  userId,
  userName,
  unitName = '章',
  dailyHistory = {},
  todayCompleted = false,
  compact = false,
  interactive = true,
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
    <div
      className={`border border-stone-200/80 dark:border-stone-800 shadow-xs transition-all relative overflow-hidden text-stone-900 dark:text-stone-100 ${
        compact
          ? 'rounded-2xl p-2.5 sm:p-3 bg-stone-50/70 dark:bg-stone-800/40 max-w-sm mx-auto w-full'
          : 'rounded-3xl p-4 sm:p-5 bg-white dark:bg-stone-900/70'
      }`}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-200/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

      {/* Header */}
      <div className={`flex items-center justify-between gap-2 relative z-10 flex-wrap ${compact ? 'mb-1.5' : 'mb-3'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`${compact ? 'text-xs' : 'text-sm'}`}>🗺️</span>
          <div className="flex items-center gap-1.5">
            <h3 className={`font-bold ${compact ? 'text-xs' : 'text-sm'} text-stone-900 dark:text-stone-100 tracking-tight`}>
              {compact && userName ? `${userName} 的追求地圖` : '追求地圖'}
            </h3>
            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-full">
              每日方格
            </span>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-1">
          {!isCurrentMonthView && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
            >
              本月
            </button>
          )}

          <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200/70 dark:border-stone-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-0.5 rounded hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
              title="上個月"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span
              className={`px-1 font-bold text-stone-800 dark:text-stone-200 ${
                compact ? 'min-w-[56px] text-[10px]' : 'min-w-[76px] text-xs'
              } text-center select-none`}
            >
              {viewYear}年{viewMonth}月
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
              title="下個月"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Statistics Summary Bar */}
      {compact ? (
        <div
          suppressHydrationWarning
          className="flex items-center justify-between bg-white/80 dark:bg-stone-800/80 rounded-lg px-2 py-1 mb-2 text-[10px] text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 relative z-10"
        >
          <span>本月追求 <strong className="text-amber-800 dark:text-amber-300 font-extrabold">{monthPursuitDaysCount}</strong> 天</span>
          <span>累計 <strong className="text-amber-800 dark:text-amber-300 font-extrabold">{monthTotalUnits}</strong> {unitName}</span>
          <span>最高 <strong className="text-amber-800 dark:text-amber-300 font-extrabold">{monthMaxUnits}</strong> {unitName}</span>
        </div>
      ) : (
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
      )}

      {/* Calendar Weekday Headers */}
      <div
        className={`grid grid-cols-7 gap-0.5 text-center font-bold text-stone-400 dark:text-stone-500 ${
          compact ? 'mb-0.5 text-[8px]' : 'mb-1 text-[10px]'
        }`}
      >
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            className={`py-0.5 ${idx === 0 || idx === 6 ? 'text-amber-700 dark:text-amber-400' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid of Day Squares (每一天為一方格) */}
      <div suppressHydrationWarning className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-1 sm:gap-1.5'} relative z-10`}>
        {/* Empty padding boxes before the 1st day of the month */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div
            key={`pad-${idx}`}
            className="aspect-square rounded bg-transparent border border-dashed border-stone-100 dark:border-stone-800/40 opacity-20"
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
              onClick={interactive ? () => setSelectedDayInfo({ dateStr, dayNum: day, units }) : undefined}
              className={`aspect-square ${compact ? 'rounded p-0.5' : 'rounded-lg sm:rounded-xl p-1'} border flex flex-col justify-between transition-all select-none ${
                interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${getLevelClasses(units)} ${
                isToday
                  ? `${compact ? 'ring-1.5' : 'ring-2'} ring-amber-500 shadow-2xs font-extrabold`
                  : ''
              } ${
                interactive && isSelected
                  ? 'border-amber-600 dark:border-amber-300 ring-2 ring-amber-400/80 shadow-xs'
                  : ''
              }`}
              title={`${viewMonth}月${day}日：追求 ${units} ${unitName}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full leading-none">
                <span
                  className={`${compact ? 'text-[7px]' : 'text-[8px] sm:text-[9px]'} ${
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
                  <span className={`${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-amber-500 inline-block`} />
                )}
              </div>

              {/* Units Display inside Square */}
              <div className="flex-1 flex items-center justify-center text-center">
                {units > 0 ? (
                  <span
                    className={`${compact ? 'text-[9px]' : 'text-[11px] sm:text-xs'} font-black leading-none ${
                      units >= 5 ? 'text-white' : ''
                    }`}
                  >
                    {units}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Detail Popover / Banner (僅在 interactive 為 true 時顯現) */}
      {interactive && selectedDayInfo && (
        <div className={`${compact ? 'mt-2 p-2' : 'mt-3 p-2.5'} rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 animate-in fade-in`}>
          <div className="flex items-center gap-2">
            <div className={`${compact ? 'w-5 h-5 text-[11px]' : 'w-6 h-6 text-xs'} rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs flex-shrink-0`}>
              {selectedDayInfo.dayNum}
            </div>
            <div className={`${compact ? 'text-[11px]' : 'text-xs'}`}>
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

      {/* Pocket Legend */}
      <div className={`${compact ? 'mt-1.5 pt-1 text-[8px]' : 'mt-3 pt-2.5 text-[10px]'} border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-stone-400 dark:text-stone-500 flex-wrap gap-1`}>
        <span>色階：</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-[#273449]" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded bg-amber-300 dark:bg-amber-500/40 border border-amber-400" />
            <span>3-4</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded bg-amber-500" />
            <span>5+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
