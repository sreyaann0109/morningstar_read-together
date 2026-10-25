'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, BookOpen, Sparkles, Check, Bookmark, RefreshCw, KeyRound } from 'lucide-react';
import { PursuitPlan, PlanCategory } from '../types';
import { CODE_EMOJIS } from './JoinByCodeModal';
import { getUTC8DateString, addDaysUTC8, diffDaysUTC8 } from '../lib/dateUtils';
import { useBodyScrollLock } from '../lib/scrollLock';

interface EditCurrentPursuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PursuitPlan;
  onSavePlan: (updatedPlan: PursuitPlan) => void;
}

export const EditCurrentPursuitModal: React.FC<EditCurrentPursuitModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onSavePlan,
}) => {
  const todayStr = getUTC8DateString();
  const [title, setTitle] = useState(currentPlan.title);
  const [category, setCategory] = useState<PlanCategory>(currentPlan.category);
  const [unitName, setUnitName] = useState<'篇' | '章'>(
    (currentPlan.unitName as '篇' | '章') || (currentPlan.category === 'bible' ? '章' : '篇')
  );
  const [description, setDescription] = useState(currentPlan.description || '');
  const [currentVerses, setCurrentVerses] = useState(currentPlan.currentVerses || '');
  const [summary, setSummary] = useState(currentPlan.summary || '');
  const [currentUnitTitle, setCurrentUnitTitle] = useState(currentPlan.currentUnitTitle || '');
  const [inviteCode, setInviteCode] = useState(currentPlan.inviteCode || '');
  const [totalUnits, setTotalUnits] = useState(currentPlan.totalUnits.toString());
  const [startDate, setStartDate] = useState(currentPlan.startDate || todayStr);
  const [endDate, setEndDate] = useState(currentPlan.endDate || '');
  const [speedDays, setSpeedDays] = useState<number>(currentPlan.speedDays || 60);

  function generateRandom6Emojis(): string {
    const shuffled = [...CODE_EMOJIS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6).join('');
  }

  const handleCategoryChange = (newCat: PlanCategory) => {
    setCategory(newCat);
    if (newCat === 'nt-speed-reading') {
      setUnitName('章');
      setTotalUnits('260');
      if (!title || title.includes('新約') || title === currentPlan.title) {
        setTitle('新約速讀一遍');
      }
      if (!endDate) {
        setEndDate(addDaysUTC8(startDate || todayStr, 59));
      }
    } else if (newCat === 'nt-half-year') {
      setUnitName('章');
      setTotalUnits('260');
      if (!title || title.includes('新約') || title === currentPlan.title) {
        setTitle('半年新約讀經一遍');
      }
    } else if (newCat === 'bible') {
      setUnitName('章');
    } else {
      setUnitName('篇');
    }
  };

  const handleSetSpeedPreset = (days: number) => {
    setSpeedDays(days);
  };

  // Sync state whenever currentPlan changes or modal opens
  useEffect(() => {
    setTitle(currentPlan.title.replace(/^主題：/, ''));
    setCategory(currentPlan.category);
    setUnitName((currentPlan.unitName as '篇' | '章') || (currentPlan.category === 'bible' ? '章' : '篇'));
    setDescription(currentPlan.description || '');
    setCurrentVerses(currentPlan.currentVerses || '');
    setSummary(currentPlan.summary || '');
    setCurrentUnitTitle(currentPlan.currentUnitTitle || '');
    setInviteCode(currentPlan.inviteCode || '');
    setTotalUnits(currentPlan.totalUnits.toString());
    setStartDate(currentPlan.startDate || todayStr);
    setEndDate(currentPlan.endDate || '');
    setSpeedDays(currentPlan.speedDays || 60);
  }, [currentPlan, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const total = Math.max(1, parseInt(totalUnits) || 30);

    onSavePlan({
      ...currentPlan,
      title: title.trim().replace(/^主題：/, ''),
      category,
      unitName,
      description: description.trim(),
      currentVerses: currentVerses.trim() || undefined,
      summary: summary.trim() || undefined,
      currentUnitTitle: currentUnitTitle.trim() || currentPlan.currentUnitTitle,
      inviteCode: inviteCode.trim() || currentPlan.inviteCode,
      totalUnits: total,
      startDate: startDate || todayStr,
      endDate: endDate.trim() || undefined,
      speedDays: category === 'nt-speed-reading' ? speedDays : undefined,
    });

    onClose();
  };

  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 touch-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl w-full max-w-xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">編輯追求主題內容與設定</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              管理追求主題名稱、類別、篇章總數、進度標題、邀請碼與追求負擔
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Pursuit Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              追求主題 / 書名標題 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：羅馬書生命讀經、基督是我們的生命..."
              className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 font-medium text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Category & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                追求類別
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PlanCategory)}
                className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
              >
                <option value="custom">自訂專題追求</option>
                <option value="nt-speed-reading">⚡ 新約速讀（自選期程統計遍數）</option>
                <option value="nt-half-year">半年新約一遍（每天兩章）</option>
                <option value="bible">聖經加註解</option>
                <option value="life-study">生命讀經</option>
                <option value="spiritual-books">屬靈經典 / 書報信息</option>
                <option value="morning-revival">晨興聖言</option>
              </select>
            </div>

            <div className="grid grid-cols-3 sm:col-span-6 gap-2 sm:gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  追求總數
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 font-semibold text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  單位
                </label>
                <select
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value as '篇' | '章')}
                  className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 font-semibold text-stone-900 dark:text-stone-100"
                >
                  <option value="篇">篇</option>
                  <option value="章">章</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Unit Title & Invite Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                當前篇章標題 / 進度
              </label>
              <input
                type="text"
                value={currentUnitTitle}
                onChange={(e) => setCurrentUnitTitle(e.target.value)}
                placeholder="例如：第 1 篇 或 馬太福音 第 1 章"
                className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  6-Emoji 邀請碼
                </label>
                <button
                  type="button"
                  onClick={() => setInviteCode(generateRandom6Emojis())}
                  className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>隨機生成</span>
                </button>
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="例如：✨🌱🕊️☀️📖🌿"
                className="w-full text-xs sm:text-sm tracking-widest font-mono font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  開始追求時間 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  結束追求時間 {category === 'nt-speed-reading' ? <span className="text-rose-500 font-bold">*（速讀必填）</span> : '（選填）'}
                </label>
                <input
                  type="date"
                  required={category === 'nt-speed-reading'}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Speed Days Per Round Setting for NT Speed Reading */}
            {category === 'nt-speed-reading' && (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2.5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                    ⚡ 速讀節奏設定：目標幾天讀完一遍新約（可一讀再讀，不影響結束時間）：
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <input
                      type="number"
                      min={10}
                      max={365}
                      value={speedDays}
                      onChange={(e) => setSpeedDays(Math.max(1, parseInt(e.target.value) || 60))}
                      className="w-16 text-center text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 py-1 text-amber-900 dark:text-amber-200 focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">天一遍</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetSpeedPreset(30)}
                    className={`px-2 py-1.5 rounded-xl border font-bold transition-colors shadow-2xs text-center ${
                      speedDays === 30
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    30 天一遍 (約8.7章/天)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSpeedPreset(60)}
                    className={`px-2 py-1.5 rounded-xl border font-bold transition-colors shadow-2xs text-center ${
                      speedDays === 60
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    60 天一遍 (約4.3章/天)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSpeedPreset(90)}
                    className={`px-2 py-1.5 rounded-xl border font-bold transition-colors shadow-2xs text-center ${
                      speedDays === 90
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    90 天一遍 (約2.9章/天)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSpeedPreset(120)}
                    className={`px-2 py-1.5 rounded-xl border font-bold transition-colors shadow-2xs text-center ${
                      speedDays === 120
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    120 天一遍 (約2.2章/天)
                  </button>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium pt-0.5">
                  📖 目標每 <strong>{speedDays}</strong> 天讀完一遍（每日約 <strong>{(260 / speedDays).toFixed(1)}</strong> 章）。
                  {startDate && endDate && (
                    <span>
                      {' '}整期時間 {startDate} 至 {endDate}（共 {Math.max(1, diffDaysUTC8(startDate, endDate) + 1)} 天），可一讀再讀（在此期程內預計可完成約 {(Math.max(1, diffDaysUTC8(startDate, endDate) + 1) / speedDays).toFixed(1)} 遍）！
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              主題簡介（選填）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="簡短說明本主題的追求目標..."
              className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Verses */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              相關經文（選填）
            </label>
            <input
              type="text"
              value={currentVerses}
              onChange={(e) => setCurrentVerses(e.target.value)}
              placeholder="例如：弗四 15-16、羅八 2"
              className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Summary / Quotes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              主題簡介與追求負擔（選填，無預設文字）
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="選填，無預設文字。可寫下本主題想要與同伴一起進入的負擔與禱讀方向..."
              rows={3}
              className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 focus:outline-none focus:border-amber-500 font-serif text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex gap-2 pt-3 justify-end border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存主題設定</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
