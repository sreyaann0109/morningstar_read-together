'use client';

import React, { useState } from 'react';
import { Users, CheckCircle2, Clock, Flame, Bell, HeartHandshake } from 'lucide-react';
import { Companion } from '../types';

interface CompanionsStatusListProps {
  companions: Companion[];
  currentUserId?: string;
  onRemindCompanion: (companionId: string) => void;
  onViewSanctuary?: (companion: Companion) => void;
  isAdmin?: boolean;
  allowSanctuaryVisit?: boolean;
}

export const CompanionsStatusList: React.FC<CompanionsStatusListProps> = ({
  companions,
  currentUserId,
  onRemindCompanion,
  onViewSanctuary,
  isAdmin = false,
  allowSanctuaryVisit = true,
}) => {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const completedCount = companions.filter((c) => c.todayCompleted).length;
  const total = companions.length;
  const hasSelf = Boolean(currentUserId && companions.some((c) => c.id === currentUserId));
  const otherCompanionsCount = hasSelf ? Math.max(0, total - 1) : total;

  // Pin self to top so the user always sees their own status clearly alongside companions
  const sortedCompanions = [...companions].sort((a, b) => {
    if (currentUserId) {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900">同伴追求狀態</h3>
            <p suppressHydrationWarning className="text-[11px] text-stone-500">
              {total > 0
                ? hasSelf
                  ? `今日您與 ${otherCompanionsCount} 位同伴中，已有 ${mounted ? completedCount : companions.filter((c) => c.todayCompleted).length} 人完成追求`
                  : `今日已有 ${mounted ? completedCount : companions.filter((c) => c.todayCompleted).length} / ${total} 位同伴完成追求`
                : isAdmin
                ? '共行追求同伴'
                : '以 6-Emoji 邀請碼連線同伴'}
            </p>
          </div>
        </div>
      </div>

      {/* Companions list */}
      {companions.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200">
          <p className="text-xs text-stone-500 mb-1">尚未加入主題追求小組</p>
          <p className="text-[11px] text-stone-400">
            {isAdmin
              ? '可在追求主題或管理後台指派同伴加入共行！'
              : '請輸入 6-Emoji 邀請碼加入主題，即可與小組同伴連線共行！'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
        {sortedCompanions.map((companion) => {
          const isSelf = Boolean(currentUserId && companion.id === currentUserId);
          return (
          <div
            key={companion.id}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-colors gap-2 ${
              isSelf
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                : 'bg-stone-50/70 border-stone-100 hover:border-amber-200'
            }`}
          >
            {/* Avatar & Name & Progress */}
            <div
              onClick={() => {
                if (onViewSanctuary) {
                  onViewSanctuary(companion);
                }
              }}
              className={`flex items-start sm:items-center gap-3 group flex-1 min-w-0 ${
                allowSanctuaryVisit ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={isSelf ? '點擊查看我的晨興帳幕' : allowSanctuaryVisit ? '點擊造訪他的晨興帳幕' : undefined}
            >
              <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
                <div className={`w-9 h-9 rounded-xl border group-hover:scale-105 transition-all flex items-center justify-center text-base shadow-2xs ${
                  isSelf ? 'bg-amber-100/80 border-amber-300' : 'bg-white border-stone-200 group-hover:border-amber-400'
                }`}>
                  {companion.avatar}
                </div>
                <div suppressHydrationWarning>
                  {companion.todayCompleted ? (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 flex items-center justify-center text-white shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-300 dark:bg-stone-600 border-2 border-white dark:border-stone-900" title="今日尚未打卡" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                    {companion.name}
                  </span>
                  {isSelf ? (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold border border-amber-300/80 dark:border-amber-700/80">
                      自己
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1 py-0.2 rounded font-medium">
                      同伴
                    </span>
                  )}
                </div>

                {/* Direct Companion Progress Display (直接顯示同伴進度 以彼此激勵) */}
                {companion.totalUnits !== undefined && companion.totalUnits > 0 ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-20 sm:w-28 bg-stone-200/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((companion.completedUnits ?? 0) /
                                  Math.max(companion.totalUnits, 1)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                        進度：{companion.completedUnits ?? 0} / {companion.totalUnits}{' '}
                        {companion.unitName || '篇'} (
                        {Math.min(
                          100,
                          Math.round(
                            ((companion.completedUnits ?? 0) /
                              Math.max(companion.totalUnits, 1)) *
                              100
                          )
                        )}
                        %)
                      </span>
                    </div>
                    {companion.currentUnitTitle && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                        當前：{companion.currentUnitTitle}
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>連續 {companion.streakDays} 天</span>
                  <span>·</span>
                  <span>{companion.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Completed / In Progress Badge */}
            <div suppressHydrationWarning className="flex-shrink-0">
              {companion.todayCompleted ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>已完成</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-full border border-stone-200/60 dark:border-stone-700/60">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>未打卡</span>
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
      )}

      {/* Encouraging Scripture Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] text-stone-500 font-serif">
        <HeartHandshake className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>「兩個人總比一個人好，因為二人勞碌同得美好的酬報。」（傳四9）</span>
      </div>
    </div>
  );
};
