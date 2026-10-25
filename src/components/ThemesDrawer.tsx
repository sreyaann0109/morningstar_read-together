'use client';

import React, { useEffect } from 'react';
import {
  X,
  BookOpen,
  KeyRound,
  Plus,
  Check,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PursuitPlan, PlanCategory } from '../types';
import { useBodyScrollLock } from '../lib/scrollLock';

interface ThemesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PursuitPlan[];
  joinedPlans: PursuitPlan[];
  currentPlanId: string;
  onSelectPlan: (planId: string) => void;
  onOpenJoinByCode: () => void;
  onOpenCreatePlan?: () => void;
  isAdmin?: boolean;
  allowJoinByInviteCode?: boolean;
}

export const ThemesDrawer: React.FC<ThemesDrawerProps> = ({
  isOpen,
  onClose,
  plans,
  joinedPlans,
  currentPlanId,
  onSelectPlan,
  onOpenJoinByCode,
  onOpenCreatePlan,
  isAdmin = false,
  allowJoinByInviteCode = true,
}) => {
  // 當抽屜開啟時鎖定全站背景滾動
  useBodyScrollLock(isOpen);

  // ESC 鍵關閉滑出欄
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getCategoryLabel = (cat: PlanCategory) => {
    switch (cat) {
      case 'nt-half-year':
        return '半年新約一遍';
      case 'nt-speed-reading':
        return '新約速讀';
      case 'spiritual-books':
        return '屬靈書報';
      case 'custom':
        return '自訂專題';
      case 'life-study':
        return '生命讀經';
      case 'bible':
        return '聖經加註解';
      case 'morning-revival':
        return '晨興聖言';
      default:
        return '追求主題';
    }
  };

  return (
    <div
      className={`fixed inset-0 top-16 z-40 overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* 遮罩背景 (Backdrop) - 自 top-16 開始，保留頂部導覽列三條線可隨時點擊 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 top-16 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out touch-none overscroll-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* 左側滑出抽屜 (Slide-out Sidebar Drawer) - 支援完整的滑入與滑出動畫 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-16 bottom-0 left-0 w-84 sm:w-96 max-w-[85vw] bg-white dark:bg-stone-900 shadow-2xl border-r border-stone-200 dark:border-stone-800 flex flex-col z-50 transition-transform duration-300 ease-in-out transform overscroll-contain ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 抽屜頂部 Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-2xs flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  追求主題
                </h2>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                  {joinedPlans.length} 個進行中
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                檢視與切換當前追求，或輸入邀請碼加入新主題
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            title="關閉滑出欄"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 抽屜內容區域 (可捲動) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">
          {/* 1. 輸入 6-Emoji 邀請碼區塊 */}
          {allowJoinByInviteCode && (
            <div className="p-3.5 bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-transparent dark:from-amber-950/40 dark:via-stone-800 dark:to-transparent rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    6-Emoji 專屬邀請碼
                  </h3>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    收到同伴分享的專屬邀請碼？立即加入同行！
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenJoinByCode();
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>輸入 6-Emoji 邀請碼加入主題</span>
              </button>
            </div>
          )}

          {/* 2. 管理員建立新主題按鈕 */}
          {isAdmin && onOpenCreatePlan && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreatePlan();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>建立新追求主題</span>
            </button>
          )}

          {/* 3. 我的追求主題清單 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                我的追求主題 ({joinedPlans.length})
              </span>
              <span className="text-[10px] text-stone-400">點選直接切換</span>
            </div>

            {joinedPlans.length === 0 ? (
              <div className="py-7 px-4 text-center rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700">
                <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mb-1">
                  尚未加入任何追求主題
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500">
                  請點擊上方按鈕輸入 6-Emoji 邀請碼加入追求小組！
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {joinedPlans.map((p) => {
                  const isSelected = p.id === currentPlanId;
                  const percent =
                    p.totalUnits > 0
                      ? Math.min(100, Math.round((p.completedUnits / p.totalUnits) * 100))
                      : 0;
                  const memberCount = (p.members || []).length;
                  const unit = p.unitName || (p.category === 'bible' ? '章' : '篇');

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectPlan(p.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-amber-500/80 shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-amber-50/40 dark:hover:bg-stone-800 hover:border-amber-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors truncate">
                            {p.title}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-700 px-1.5 py-0.2 rounded flex-shrink-0">
                            {getCategoryLabel(p.category)}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>當前追求</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            切換 <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {p.description && p.description !== '與活力同伴共同追求基督話語' && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2 line-clamp-1">
                          {p.description}
                        </p>
                      )}

                      {/* 進度條與篇章數據 */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-amber-900 dark:text-amber-300">
                            第 {Math.min(p.completedUnits + 1, p.totalUnits)} {unit} / 共 {p.totalUnits} {unit}
                          </span>
                          <span className="font-mono text-stone-500 dark:text-stone-400 font-semibold">
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 pt-0.5">
                          {p.startDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {p.startDate} {p.endDate ? `~ ${p.endDate}` : '起'}
                            </span>
                          ) : (
                            <span />
                          )}
                          {memberCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              {memberCount} 位同伴同行
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 抽屜底部 屬靈勸勉 (Footer) */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 text-center">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
            「同那清心呼求主的人，竭力追求公義、信、愛、和平。」
          </p>
          <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">
            —— 提摩太後書二章 22 節
          </span>
        </div>
      </div>
    </div>
  );
};
