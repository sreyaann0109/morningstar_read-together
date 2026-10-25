'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, AlertCircle, Users, Delete, RotateCcw, ClipboardPaste } from 'lucide-react';
import { PursuitPlan } from '../types';

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlans: PursuitPlan[];
  joinedPlanIds: string[];
  onJoinSuccess: (plan: PursuitPlan) => void;
}

// 10 Standard Sacred Emojis for 6-Emoji Invite Codes
export const CODE_EMOJIS = ['✨', '🌱', '🕊️', '☀️', '📖', '🌿', '🔥', '🌾', '🛡️', '🍇'];

const normalizeEmojiStr = (str: string) => str.replace(/\uFE0F/g, '').trim();

export const parseInviteEmojis = (rawText: string, allPlans: PursuitPlan[] = []): string[] => {
  if (!rawText) return [];

  // Map base emoji (without \uFE0F) -> canonical emoji in CODE_EMOJIS
  const baseMap = new Map<string, string>();
  CODE_EMOJIS.forEach((em) => {
    const base = normalizeEmojiStr(em);
    baseMap.set(base, em);
    baseMap.set(em, em);
  });

  // If the pasted text contains a full known plan invite code, extract that code first
  const normalizedInput = normalizeEmojiStr(rawText);
  const matchedPlan = allPlans.find((p) => {
    const normCode = normalizeEmojiStr(p.inviteCode);
    return normCode.length > 0 && normalizedInput.includes(normCode);
  });

  let targetStr = normalizedInput;
  if (matchedPlan) {
    targetStr = normalizeEmojiStr(matchedPlan.inviteCode);
  } else if (normalizedInput.includes('邀請碼：')) {
    targetStr = normalizedInput.split('邀請碼：').pop() || normalizedInput;
  } else if (normalizedInput.includes('邀請碼:')) {
    targetStr = normalizedInput.split('邀請碼:').pop() || normalizedInput;
  }

  const extracted: string[] = [];
  for (const char of Array.from(targetStr)) {
    const canonical = baseMap.get(char);
    if (canonical) {
      extracted.push(canonical);
      if (extracted.length >= 6) break;
    }
  }
  return extracted;
};

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({
  isOpen,
  onClose,
  allPlans,
  joinedPlanIds,
  onJoinSuccess,
}) => {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncedPlans, setSyncedPlans] = useState<PursuitPlan[]>(allPlans);

  // Always read and merge latest plans from localStorage when modal opens or allPlans changes
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
  }, [isOpen, allPlans]);

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

  const applyPastedText = (text: string) => {
    const latest = getLatestPlans();
    setSyncedPlans(latest);
    const parsed = parseInviteEmojis(text, latest);
    if (parsed.length > 0) {
      setSelectedEmojis(parsed);
      setPasteInput('');
      setError(null);
    } else if (text.trim().length > 0) {
      setError('貼上的內容未包含有效的 6-Emoji 邀請碼圖示');
    }
  };

  // Global paste listener while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleWindowPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text) {
        e.preventDefault();
        applyPastedText(text);
      }
    };
    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isOpen, syncedPlans, allPlans]);

  if (!isOpen) return null;

  const currentCode = selectedEmojis.join('');
  const activePlans = getLatestPlans();

  // Find matching plan by 6 emojis (normalized to avoid variation selector mismatch)
  const matchedPlan =
    selectedEmojis.length === 6
      ? activePlans.find(
          (p) => normalizeEmojiStr(p.inviteCode) === normalizeEmojiStr(currentCode)
        )
      : undefined;
  const isAlreadyJoined = matchedPlan ? joinedPlanIds.includes(matchedPlan.id) : false;

  const handleAddEmoji = (emoji: string) => {
    if (selectedEmojis.length < 6) {
      const updated = [...selectedEmojis, emoji];
      setSelectedEmojis(updated);
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

  const handleClipboardButtonPaste = async () => {
    setError(null);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          applyPastedText(text);
        } else {
          setError('剪貼簿目前為空，請先複製邀請碼');
        }
      } catch {
        setError('請直接在下方輸入框按 Ctrl+V / ⌘V 貼上邀請碼');
      }
    } else {
      setError('請直接在下方輸入框按 Ctrl+V / ⌘V 貼上邀請碼');
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedEmojis.length < 6) {
      setError('請點選或貼上完整的 6 個 Emoji 邀請碼');
      return;
    }

    const latestPlans = getLatestPlans();
    const targetPlan =
      matchedPlan ||
      latestPlans.find(
        (p) => normalizeEmojiStr(p.inviteCode) === normalizeEmojiStr(currentCode)
      );

    if (!targetPlan) {
      setError('找不到此 6-Emoji 邀請碼對應的主題追求，請向同伴確認邀請碼。');
      return;
    }

    if (joinedPlanIds.includes(targetPlan.id)) {
      setError('您已經加入過這個主題追求囉！');
      return;
    }

    onJoinSuccess(targetPlan);
    setSelectedEmojis([]);
    setPasteInput('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-5 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
            ✨
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">輸入或貼上 6-Emoji 邀請碼</h3>
            <p className="text-xs text-stone-500">
              可直接貼上 (⌘V / Ctrl+V) 或點選同伴提供的 6 個 Emoji
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* 6 Emoji Visual Display Slots + Paste Input */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-900/80 uppercase tracking-wider">
                邀請碼欄位 (需 6 個 Emoji)
              </span>
              <button
                type="button"
                onClick={handleClipboardButtonPaste}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>一鍵貼上邀請碼</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const em = selectedEmojis[idx];
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      em
                        ? 'bg-white border-2 border-amber-400 shadow-xs scale-105'
                        : 'border-2 border-dashed border-amber-300/80 bg-amber-100/30'
                    }`}
                  >
                    {em || <span className="w-2 h-2 rounded-full bg-amber-300" />}
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
              className="w-full text-xs rounded-xl border border-amber-200 bg-white/90 px-3 py-2 text-center text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Emoji Keyboard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-700">
                或點選下方 Emoji 鍵盤：
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={selectedEmojis.length === 0}
                  className="px-2 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-lg flex items-center gap-1"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>退格</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={selectedEmojis.length === 0}
                  className="px-2 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-lg flex items-center gap-1"
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
                  className="h-12 rounded-xl bg-stone-50 hover:bg-amber-100 border border-stone-200 hover:border-amber-400 disabled:opacity-50 text-2xl flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Matched Plan Preview */}
          {matchedPlan && (
            <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  已匹配主題追求
                </span>
                <span className="text-xs text-amber-900 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {matchedPlan.members?.length || 1} 位同伴共行
                </span>
              </div>
              <h4 className="font-bold text-sm text-stone-900 mb-1">
                {matchedPlan.title}
              </h4>
              {matchedPlan.description && matchedPlan.description !== '與活力同伴共同追求基督話語' && (
                <p className="text-xs text-stone-600 mb-2 line-clamp-2">
                  {matchedPlan.description}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium pt-2 border-t border-stone-100">
                <span>主題追求</span>
                <span>共 {matchedPlan.totalUnits} 篇</span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-3 justify-end border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={selectedEmojis.length < 6 || isAlreadyJoined}
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAlreadyJoined ? '已在小組中' : '確認加入共讀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
