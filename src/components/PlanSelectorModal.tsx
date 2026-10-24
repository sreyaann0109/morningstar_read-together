'use client';

import React from 'react';
import { X, BookOpen, Check, Plus } from 'lucide-react';
import { PursuitPlan, PlanCategory } from '../types';

interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PursuitPlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onCreateNewPlan: () => void;
  isAdmin?: boolean;
  onOpenJoinByCode?: () => void;
  allowJoinByInviteCode?: boolean;
}

export const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({
  isOpen,
  onClose,
  plans,
  selectedPlanId,
  onSelectPlan,
  onCreateNewPlan,
  isAdmin = false,
  onOpenJoinByCode,
  allowJoinByInviteCode = true,
}) => {
  if (!isOpen) return null;

  const getCategoryBadge = (cat: PlanCategory) => {
    switch (cat) {
      case 'spiritual-books':
        return '屬靈書報';
      case 'custom':
        return '自訂專題';
      case 'life-study':
        return '生命讀經';
      case 'nt-speed-reading':
        return '新約速讀';
      case 'nt-half-year':
        return '半年新約一遍';
      case 'bible':
        return '聖經加註解';
      case 'morning-revival':
        return '晨興聖言';
      default:
        return '追求主題';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">切換追求主題</h3>
            <p className="text-xs text-stone-500">檢視並切換您已加入的追求主題</p>
          </div>
        </div>

        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200">
              <p className="text-xs text-stone-500 mb-1">尚未加入任何追求主題</p>
              <p className="text-[11px] text-stone-400">
                {isAdmin
                  ? '請點擊下方按鈕開啟新追求主題！'
                  : allowJoinByInviteCode
                  ? '請點擊下方按鈕輸入 6-Emoji 邀請碼加入追求主題！'
                  : '請等候服事者或管理員為您指派追求主題！'}
              </p>
            </div>
          ) : (
            plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              const percent = Math.round((p.completedUnits / p.totalUnits) * 100);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPlan(p.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-stone-900">
                          {p.title}
                        </span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                          {getCategoryBadge(p.category)}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.2 rounded-full font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> 當前追求主題
                          </span>
                        )}
                      </div>
                      {p.description && p.description !== '與活力同伴共同追求基督話語' && (
                        <p className="text-xs text-stone-500 mb-2 line-clamp-1">
                          {p.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-[11px]">
                        <span className="text-amber-800 font-medium">
                          進度：第 {Math.min(p.completedUnits + 1, p.totalUnits)} {p.unitName || (p.category === 'bible' ? '章' : '篇')} / 共 {p.totalUnits} {p.unitName || (p.category === 'bible' ? '章' : '篇')} ({percent}%)
                        </span>
                        {p.startDate && (
                          <span className="text-stone-400">
                            · 期間：{p.startDate}
                            {p.endDate ? ` ~ ${p.endDate}` : ' 起'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateNewPlan();
              }}
              className="w-full py-3.5 rounded-2xl border border-dashed border-amber-300 text-amber-800 hover:border-amber-500 hover:bg-amber-50/40 transition-all text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>開啟新追求主題</span>
            </button>
          )}

          {!isAdmin && allowJoinByInviteCode && (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-center space-y-2">
              <p className="text-xs text-stone-500">
                💡 透過 6-Emoji 邀請碼加入追求主題小組！
              </p>
              {onOpenJoinByCode && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenJoinByCode();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>✨ 輸入 6-Emoji 邀請碼加入追求主題</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
