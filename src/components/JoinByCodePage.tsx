'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Sparkles, Check, AlertCircle, Users, Delete, RotateCcw, ClipboardPaste, BookOpen, ShieldCheck } from 'lucide-react';
import { PursuitPlan } from '../types';
import { CODE_EMOJIS, parseInviteEmojis } from './JoinByCodeModal';

interface JoinByCodePageProps {
  allPlans: PursuitPlan[];
  joinedPlanIds: string[];
  onJoinSuccess: (plan: PursuitPlan) => void;
  isAdmin?: boolean;
  onOpenCreatePlan?: () => void;
  onSwitchAdminMode?: () => void;
  allowJoinByInviteCode?: boolean;
}

export const JoinByCodePage: React.FC<JoinByCodePageProps> = ({
  allPlans,
  joinedPlanIds,
  onJoinSuccess,
  isAdmin = false,
  onOpenCreatePlan,
  onSwitchAdminMode,
  allowJoinByInviteCode = true,
}) => {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncedPlans, setSyncedPlans] = useState<PursuitPlan[]>(allPlans);

  // Sync plans from localStorage and props
  useEffect(() => {
    const mergedMap = new Map<string, PursuitPlan>();
    allPlans.forEach((p) => mergedMap.set(p.id, p));
    try {
      const savedPlansStr = localStorage.getItem('morningstar_plans');
      if (savedPlansStr) {
        const savedPlans: PursuitPlan[] = JSON.parse(savedPlansStr);
        if (Array.isArray(savedPlans)) {
          savedPlans.forEach((p) => mergedMap.set(p.id, p));
        }
      }
    } catch (e) {}
    setSyncedPlans(Array.from(mergedMap.values()));
  }, [allPlans]);

  const getLatestPlans = (): PursuitPlan[] => {
    const mergedMap = new Map<string, PursuitPlan>();
    syncedPlans.forEach((p) => mergedMap.set(p.id, p));
    allPlans.forEach((p) => mergedMap.set(p.id, p));
    try {
      const savedPlansStr = localStorage.getItem('morningstar_plans');
      if (savedPlansStr) {
        const savedPlans: PursuitPlan[] = JSON.parse(savedPlansStr);
        if (Array.isArray(savedPlans)) {
          savedPlans.forEach((p) => mergedMap.set(p.id, p));
        }
      }
    } catch (e) {}
    return Array.from(mergedMap.values());
  };

  const handleAddEmoji = (emoji: string) => {
    if (selectedEmojis.length < 6) {
      setSelectedEmojis([...selectedEmojis, emoji]);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setSelectedEmojis(selectedEmojis.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setSelectedEmojis([]);
    setPasteInput('');
    setError(null);
  };

  const applyPastedText = (rawText: string) => {
    const latest = getLatestPlans();
    const extracted = parseInviteEmojis(rawText, latest);
    if (extracted.length > 0) {
      setSelectedEmojis(extracted);
      setError(null);
    } else {
      setError('未偵測到有效的邀請碼 Emoji。請確認您複製的是 6 個 Emoji 代碼。');
    }
  };

  const handleClipboardButtonPaste = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          applyPastedText(text);
          return;
        }
      } catch (err) {}
    }
    const manualText = window.prompt('請在此處貼上同伴分享的 6-Emoji 邀請碼：');
    if (manualText) {
      applyPastedText(manualText);
    }
  };

  const currentCode = selectedEmojis.join('');
  const latestPlans = getLatestPlans();
  const matchedPlan = latestPlans.find((p) => p.inviteCode === currentCode);
  const isAlreadyJoined = matchedPlan ? joinedPlanIds.includes(matchedPlan.id) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmojis.length < 6) {
      setError('請輸入完整的 6-Emoji 邀請碼');
      return;
    }

    const latest = getLatestPlans();
    const plan = latest.find((p) => p.inviteCode === currentCode);
    if (!plan) {
      setError('找不到符合該邀請碼的追求主題，請再次確認代碼是否正確。');
      return;
    }

    if (joinedPlanIds.includes(plan.id)) {
      setError('您已經加入過這個追求主題囉！');
      return;
    }

    onJoinSuccess(plan);
  };

  const planUnit = matchedPlan ? matchedPlan.unitName || (matchedPlan.category === 'bible' ? '章' : '篇') : '篇';

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-br from-amber-50/90 via-white to-stone-50/90 rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Spiritual Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 mx-auto mb-3.5 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/25">
            🌅
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-1.5 tracking-tight">
            {allowJoinByInviteCode ? '輸入邀請碼加入追求' : '尚未加入追求主題'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-serif leading-relaxed max-w-sm mx-auto mb-2">
            「同那清心呼求主的人，竭力追求公義、信、愛、和平。」（提後二22）
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200/70 text-[11px] font-semibold text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {allowJoinByInviteCode
                ? '尚未加入任何追求主題 · 請輸入 6-Emoji 邀請碼'
                : '目前由服事者統一指派追求主題小組'}
            </span>
          </div>
        </div>

        {!allowJoinByInviteCode && !isAdmin ? (
          <div className="p-6 rounded-2xl bg-white/90 border border-amber-200/80 text-center space-y-2 relative z-10">
            <p className="text-sm font-bold text-stone-800">
              請等候服事者將您加入追求主題
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              目前管理員已關閉透過邀請碼自行加入追求的功能。當服事者在後台將您指派至追求主題後，畫面將會自動即時更新並載入您的追求進度！
            </p>
          </div>
        ) : (
        /* Form Body */
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* 6-Emoji Display Slots */}
          <div className="p-4 rounded-2xl bg-white/90 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>邀請碼欄位（需 6 個 Emoji）</span>
              </span>
              <button
                type="button"
                onClick={handleClipboardButtonPaste}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>一鍵貼上邀請碼</span>
              </button>
            </div>

            {/* Slots */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const em = selectedEmojis[idx];
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      em
                        ? 'bg-amber-50/80 border-2 border-amber-400 shadow-xs scale-105'
                        : 'border-2 border-dashed border-amber-300/80 bg-amber-100/20'
                    }`}
                  >
                    {em || <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />}
                  </div>
                );
              })}
            </div>

            {/* Direct Paste / Text Input Box */}
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => {
                const val = e.target.value;
                setPasteInput(val);
                if (val.trim()) {
                  applyPastedText(val);
                }
              }}
              onPaste={(e) => {
                e.stopPropagation();
                const text = e.clipboardData?.getData('text');
                if (text) {
                  e.preventDefault();
                  applyPastedText(text);
                }
              }}
              placeholder="在此長按或按 Ctrl+V / ⌘V 直接貼上邀請碼..."
              className="w-full text-xs rounded-xl border border-amber-200 bg-stone-50/80 px-3 py-2.5 text-center text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
            />
          </div>

          {/* Emoji Keyboard */}
          <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                或點選下方 Emoji 鍵盤：
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={selectedEmojis.length === 0}
                  className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>退格</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={selectedEmojis.length === 0}
                  className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>清除</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {CODE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  disabled={selectedEmojis.length >= 6}
                  className="h-12 rounded-xl bg-stone-50 hover:bg-amber-100 border border-stone-200 hover:border-amber-400 disabled:opacity-40 text-2xl flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Matched Plan Preview */}
          {matchedPlan && (
            <div className="p-4 rounded-2xl bg-white border-2 border-amber-400 shadow-sm animate-in fade-in duration-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  已匹配追求主題
                </span>
                <span className="text-xs text-amber-900 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {matchedPlan.members?.length || 1} 位同伴共行
                </span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-stone-900">
                {matchedPlan.title}
              </h4>
              {matchedPlan.description && (
                <p className="text-xs text-stone-600 line-clamp-2">
                  {matchedPlan.description}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium pt-2 border-t border-stone-100">
                <span>追求進度</span>
                <span>全 {matchedPlan.totalUnits} {planUnit}</span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirm Join Button */}
          <button
            type="submit"
            disabled={selectedEmojis.length < 6 || isAlreadyJoined}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>{isAlreadyJoined ? '您已在此追求小組中' : '確認加入共讀'}</span>
          </button>
        </form>
        )}

        {/* Admin Shortcuts (If logged in as Admin) */}
        {isAdmin && (
          <div className="mt-6 pt-5 border-t border-amber-200/60 text-center space-y-2 relative z-10">
            <p className="text-xs text-stone-500 font-medium">
              🛡️ 管理員專屬捷徑（身為管理員，您無須輸入邀請碼即可發起主題）：
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {onOpenCreatePlan && (
                <button
                  type="button"
                  onClick={onOpenCreatePlan}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>開啟新追求主題</span>
                </button>
              )}
              {onSwitchAdminMode && (
                <button
                  type="button"
                  onClick={onSwitchAdminMode}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>進入管理員後台</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
