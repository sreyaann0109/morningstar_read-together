'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sparkles, Clock, AlertCircle, ArrowRight, Lock, Check, Zap } from 'lucide-react';
import { PursuitPlan } from '../types';
import {
  getNTChapterLocation,
  calculateNTHalfYearPace,
  calculateNTSpeedPace,
  TOTAL_NT_DAYS,
  TOTAL_NT_CHAPTERS,
} from '../data/ntBibleData';
import { useBodyScrollLock } from '../lib/scrollLock';

interface SetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PursuitPlan;
  onConfirmSetProgress: (targetChapter: number) => void;
}

export const SetProgressModal: React.FC<SetProgressModalProps> = ({
  isOpen,
  onClose,
  plan,
  onConfirmSetProgress,
}) => {
  const currentCompleted = plan.completedUnits || 0;
  const totalUnits = plan.totalUnits || 1;
  const isNTHalfYear = plan.category === 'nt-half-year';
  const isNTSpeed = plan.category === 'nt-speed-reading';
  const halfYearPace = isNTHalfYear ? calculateNTHalfYearPace(plan.startDate, currentCompleted) : null;
  const speedPace = isNTSpeed ? calculateNTSpeedPace(plan.startDate, plan.endDate, currentCompleted) : null;
  const unit = plan.unitName || (plan.category === 'bible' || isNTHalfYear || isNTSpeed ? '章' : '篇');
  const defaultTarget = Math.min(currentCompleted + 1, totalUnits);

  const [targetUnit, setTargetUnit] = useState<number>(defaultTarget);

  // Sync default target whenever modal opens or plan changes
  useEffect(() => {
    if (isOpen) {
      setTargetUnit(Math.min(currentCompleted + 1, totalUnits));
    }
  }, [isOpen, currentCompleted, totalUnits]);

  if (!isOpen) return null;

  const isCompletedAll = currentCompleted >= totalUnits;
  const isTargetValid = targetUnit > currentCompleted && targetUnit <= totalUnits;
  const deltaChapters = Math.max(0, targetUnit - currentCompleted);
  const percentAfter = Math.min(100, Math.round((targetUnit / totalUnits) * 100));

  const handleQuickAdd = (addCount: number) => {
    const nextVal = Math.min(totalUnits, Math.max(currentCompleted + 1, targetUnit + addCount));
    setTargetUnit(nextVal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTargetValid) return;
    onConfirmSetProgress(targetUnit);
    onClose();
  };

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-progress-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 id="set-progress-title" className="text-base font-bold text-stone-900">
                一次設定追求進度
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-[220px] sm:max-w-[260px]">
                《{plan.title}》
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 flex items-center justify-center transition-colors"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Progress Status Card */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold text-amber-900">目前已讀進度</span>
              <span className="font-bold text-stone-800">
                {isNTHalfYear || isNTSpeed
                  ? currentCompleted > 0
                    ? `已讀至【${getNTChapterLocation(currentCompleted).displayText}】`
                    : '尚未開始追求'
                  : `第 ${currentCompleted} ${unit} / 共 ${totalUnits} ${unit}`}
              </span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((currentCompleted / totalUnits) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-500 flex items-center justify-between">
              <span>{isNTHalfYear || isNTSpeed ? '起點：馬太福音 第 1 章' : `起點：第 1 ${unit}`}</span>
              <span>
                {isCompletedAll
                  ? `🎉 本主題已全數讀完`
                  : isNTHalfYear || isNTSpeed
                  ? `下一待讀：${getNTChapterLocation(currentCompleted + 1).displayText}`
                  : `下一${unit}待讀：第 ${currentCompleted + 1} ${unit}`}
              </span>
            </div>
          </div>

          {isCompletedAll ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-3xl">🏆</div>
              <h4 className="text-sm font-bold text-stone-900">本追求主題已全數完成！</h4>
              <p className="text-xs text-stone-500">
                共 {totalUnits} {unit}已全部打卡追求完畢。進度已達最上限，無法再往前設定。
              </p>
            </div>
          ) : (
            <>
              {/* Target Chapter Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  設定讀到第幾{unit}（只能往前推進，不可往回修改）：
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                      第
                    </span>
                    <input
                      type="number"
                      min={currentCompleted + 1}
                      max={totalUnits}
                      value={targetUnit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setTargetUnit(val);
                        } else {
                          setTargetUnit(currentCompleted + 1);
                        }
                      }}
                      className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-base font-bold text-stone-900 focus:outline-none focus:ring-2 transition-all ${
                        !isTargetValid
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30'
                          : 'border-stone-300 focus:ring-amber-500 focus:border-amber-500 bg-white'
                      }`}
                      placeholder={`範圍 ${currentCompleted + 1} ~ ${totalUnits}`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* NT Chapter Book Mapping Preview */}
                {(isNTHalfYear || isNTSpeed) && isTargetValid && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs flex items-center justify-between text-amber-900 font-semibold">
                    <span>📖 對應新約書卷：{getNTChapterLocation(((targetUnit - 1) % 260) + 1).displayText}</span>
                    {isNTSpeed ? (
                      <span className="text-[11px] text-amber-700">（第 {Math.floor((targetUnit - 1) / 260) + 1} 遍）</span>
                    ) : (
                      <span className="text-[11px] text-amber-700">（第 {Math.min(TOTAL_NT_DAYS, Math.floor((targetUnit - 1) / 2) + 1)} 天進度）</span>
                    )}
                  </div>
                )}

                {/* Validation message if invalid input */}
                {!isTargetValid && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {targetUnit <= currentCompleted
                        ? `追求進度不可往回修改！請輸入大於第 ${currentCompleted} ${unit}的數值（範圍：${currentCompleted + 1} ~ ${totalUnits} ${unit}）。`
                        : `輸入${unit}數已超出全書總${unit}數（最多 ${totalUnits} ${unit}）。`}
                    </span>
                  </p>
                )}
              </div>

              {/* Shortcut: Half-Year One-Click Catch Up */}
              {isNTHalfYear && halfYearPace?.paceStatus === 'behind' && halfYearPace.expectedChaptersToday > currentCompleted && (
                <button
                  type="button"
                  onClick={() => setTargetUnit(halfYearPace.expectedChaptersToday)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-rose-300 bg-rose-50/90 hover:bg-rose-100 text-rose-950 font-bold text-xs flex items-center justify-between transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-600 fill-rose-600 animate-pulse flex-shrink-0" />
                    <span className="text-left">
                      ⚡ 追上今日進度：設定至第 {halfYearPace.expectedChaptersToday} 章（第 {halfYearPace.expectedDayToday} 天 · {halfYearPace.expectedSchedule.shortDisplayText}）
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-700 bg-white/90 border border-rose-200 px-2 py-0.5 rounded-md font-semibold flex-shrink-0">
                    +{halfYearPace.expectedChaptersToday - currentCompleted} 章
                  </span>
                </button>
              )}

              {/* Shortcut: Speed Reading One-Click Catch Up */}
              {isNTSpeed && speedPace?.paceStatus === 'behind' && speedPace.expectedChaptersToday > currentCompleted && (
                <button
                  type="button"
                  onClick={() => setTargetUnit(speedPace.expectedChaptersToday)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-rose-300 bg-rose-50/90 hover:bg-rose-100 text-rose-950 font-bold text-xs flex items-center justify-between transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-600 fill-rose-600 animate-pulse flex-shrink-0" />
                    <span className="text-left">
                      ⚡ 追上今日進度：設定至第 {speedPace.expectedChaptersToday} 章【{speedPace.expectedLocation.displayText}】
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-700 bg-white/90 border border-rose-200 px-2 py-0.5 rounded-md font-semibold flex-shrink-0">
                    +{speedPace.expectedChaptersToday - currentCompleted} 章
                  </span>
                </button>
              )}

              {/* Quick Jump Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500">快速推進選擇：</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(isNTHalfYear ? 2 : isNTSpeed ? 5 : 1)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors"
                  >
                    +{isNTHalfYear ? '2 章 (1天)' : isNTSpeed ? '5 章' : `1 ${unit}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(isNTHalfYear ? 10 : isNTSpeed ? 10 : 5)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors"
                  >
                    +{isNTHalfYear ? '10 章 (5天)' : isNTSpeed ? '10 章' : `5 ${unit}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(isNTHalfYear ? 20 : isNTSpeed ? 20 : 10)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors"
                  >
                    +{isNTHalfYear ? '20 章 (10天)' : isNTSpeed ? '20 章' : `10 ${unit}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetUnit(totalUnits)}
                    className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50/70 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    {isNTSpeed ? '完成本遍' : '全部讀完'}
                  </button>
                </div>
              </div>

              {/* Update Preview Card */}
              {isTargetValid && (
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-stone-700">
                    <span>設定後進度：</span>
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <span>第 {currentCompleted} {unit}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                      <span className="text-amber-600 font-extrabold text-sm">第 {targetUnit} {unit}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span>本次一次完成{unit}數：</span>
                    <span className="font-semibold text-emerald-700">+{deltaChapters} {unit}（完成度 {percentAfter}%）</span>
                  </div>
                </div>
              )}

              {/* Rule Notice */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-stone-700 text-xs space-y-1.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>支援 10 秒即時復原機制</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  設定完成後，畫面將出現 <strong className="text-amber-900">「↺ 立即復原」</strong> 按鈕並倒數 10 秒。
                  <span className="block mt-0.5 text-amber-900 font-medium">
                    ⚠️ 待 10 秒倒數結束後，進度將正式確認鎖定，不可往回修改。
                  </span>
                </p>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold transition-colors"
            >
              取消
            </button>
            {!isCompletedAll && (
              <button
                type="submit"
                disabled={!isTargetValid}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm ${
                  isTargetValid
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 shadow-amber-500/25'
                    : 'bg-stone-300 cursor-not-allowed text-stone-500'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>確認設定至第 {targetUnit} {unit}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
