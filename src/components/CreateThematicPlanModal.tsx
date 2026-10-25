'use client';

import React, { useState, useEffect } from 'react';
import { X, PlusCircle, RefreshCw, Sparkles, KeyRound, Check } from 'lucide-react';
import { PursuitPlan, PlanCategory, UserProfile } from '../types';
import { CODE_EMOJIS } from './JoinByCodeModal';
import { getUTC8DateString, addDaysUTC8, diffDaysUTC8 } from '../lib/dateUtils';
import { useBodyScrollLock } from '../lib/scrollLock';

interface CreateThematicPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: UserProfile;
  onCreateThematicPlan: (newPlan: PursuitPlan) => void;
}

export const CreateThematicPlanModal: React.FC<CreateThematicPlanModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  onCreateThematicPlan,
}) => {
  const todayStr = getUTC8DateString();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PlanCategory>('custom');
  const [unitName, setUnitName] = useState<'篇' | '章'>('篇');
  const [totalUnits, setTotalUnits] = useState('20');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');
  const [speedDays, setSpeedDays] = useState<number>(60);
  const [currentVerses, setCurrentVerses] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmojis, setInviteEmojis] = useState<string[]>(() => generateRandom6Emojis());

  function generateRandom6Emojis() {
    const shuffled = [...CODE_EMOJIS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }

  const handleCategoryChange = (newCat: PlanCategory) => {
    setCategory(newCat);
    const start = startDate ? new Date(startDate) : new Date();
    if (newCat === 'nt-speed-reading') {
      setTitle('新約速讀一遍');
      setUnitName('章');
      setTotalUnits('260');
      setCurrentVerses('新約全書 27 卷共 260 章');
      setDescription('堅定持續速讀新約聖經，進入主話大能，享受主生命豐富與靈裡火熱！');
      // Default to 60 days
      const baseStart = startDate || todayStr;
      setEndDate(addDaysUTC8(baseStart, 59));
      setSpeedDays(60);
    } else if (newCat === 'nt-half-year') {
      setTitle('半年新約讀經一遍');
      setUnitName('章');
      setTotalUnits('260');
      setCurrentVerses('馬太福音 第 1 ～ 2 章');
      setDescription('半年追求新約聖經一遍，每天固定進度兩章，從馬太福音讀到啟示錄，堅定持續在神的話上扎根。');
    } else if (newCat === 'bible') {
      setUnitName('章');
    } else {
      setUnitName('篇');
    }
  };

  const handleSetSpeedPreset = (days: number) => {
    setSpeedDays(days);
  };

  // Reset form and generate a fresh 6-Emoji invite code every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCategory('custom');
      setUnitName('篇');
      setTotalUnits('20');
      setStartDate(todayStr);
      setEndDate('');
      setCurrentVerses('');
      setSummary('');
      setDescription('');
      setInviteEmojis(generateRandom6Emojis());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || inviteEmojis.length !== 6) return;

    const formattedTitle = title.trim().replace(/^主題：/, '').trim();

    const newPlan: PursuitPlan = {
      id: `theme-${Date.now()}`,
      title: formattedTitle,
      category,
      unitName,
      totalUnits: parseInt(totalUnits) || 20,
      completedUnits: 0,
      currentUnitTitle: `第 1 ${unitName}`,
      currentVerses: currentVerses.trim() || undefined,
      summary: summary.trim() || undefined,
      description: description.trim(),
      startDate: startDate || todayStr,
      endDate: endDate.trim() || undefined,
      speedDays: category === 'nt-speed-reading' ? speedDays : undefined,
      inviteCode: inviteEmojis.join(''),
      adminId: adminUser.id,
      adminName: adminUser.name,
      members: [
        {
          userId: adminUser.id,
          name: adminUser.name,
          avatar: adminUser.avatar,
          locality: adminUser.locality,
          joinedAt: todayStr,
          todayCompleted: false,
          streakDays: adminUser.streakDays,
          lastActive: '剛剛',
          encouragedToday: false,
        },
      ],
    };

    onCreateThematicPlan(newPlan);
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
        className="bg-white rounded-3xl w-full max-w-lg max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-4 sm:p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">開啟新主題追求 (管理員)</h3>
            <p className="text-xs text-stone-500">
              設定追求專題、期間、篇數與 6-Emoji 邀請碼，讓同伴加入共行
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              主題追求名稱（可自訂任何書名或專題）<span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：羅馬書生命之律專題、初信造就基礎篇、以弗所書讀經..."
              className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* 6-Emoji Invite Code Setting */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>專屬 6-Emoji 邀請碼</span>
              </label>
              <button
                type="button"
                onClick={() => setInviteEmojis(generateRandom6Emojis())}
                className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="換一組 6-Emoji"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>換一組</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 py-2 bg-white rounded-xl border border-amber-200 shadow-2xs">
              {inviteEmojis.map((em, idx) => (
                <span key={idx} className="text-2xl animate-in zoom-in-50 duration-150">
                  {em}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-800/80 text-center mt-1.5">
              同伴在首頁貼上或點選這 6 個 Emoji 即可加入
            </p>
          </div>

          {/* Category & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                追求類別
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PlanCategory)}
                className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 bg-white"
              >
                <option value="custom">自訂專題追求</option>
                <option value="nt-speed-reading">⚡ 新約速讀（自選期程統計遍數）</option>
                <option value="nt-half-year">半年新約一遍（每天兩章）</option>
                <option value="bible">聖經加註解</option>
                <option value="life-study">生命讀經</option>
                <option value="spiritual-books">屬靈經典 / 書報</option>
                <option value="morning-revival">晨興聖言</option>
              </select>
            </div>

            <div className="grid grid-cols-3 sm:col-span-6 gap-2 sm:gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  追求總數 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  placeholder="例如：30"
                  className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  單位
                </label>
                <select
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value as '篇' | '章')}
                  className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 bg-white font-semibold"
                >
                  <option value="篇">篇</option>
                  <option value="章">章</option>
                </select>
              </div>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  開始追求時間 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  結束追求時間 {category === 'nt-speed-reading' ? <span className="text-rose-500 font-bold">*（速讀必填）</span> : '（選填）'}
                </label>
                <input
                  type="date"
                  required={category === 'nt-speed-reading'}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Speed Days Per Round Setting for NT Speed Reading */}
            {category === 'nt-speed-reading' && (
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-900 block">
                    ⚡ 速讀節奏設定：目標幾天讀完一遍新約（可一讀再讀，不影響結束時間）：
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <input
                      type="number"
                      min={10}
                      max={365}
                      value={speedDays}
                      onChange={(e) => setSpeedDays(Math.max(1, parseInt(e.target.value) || 60))}
                      className="w-16 text-center text-xs font-bold rounded-lg border border-amber-300 bg-white py-1 text-amber-900 focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-amber-800">天一遍</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetSpeedPreset(30)}
                    className={`px-2 py-1.5 rounded-xl border font-bold transition-colors shadow-2xs text-center ${
                      speedDays === 30
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-300 bg-white hover:bg-amber-100 text-amber-900'
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
                        : 'border-amber-300 bg-white hover:bg-amber-100 text-amber-900'
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
                        : 'border-amber-300 bg-white hover:bg-amber-100 text-amber-900'
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
                        : 'border-amber-300 bg-white hover:bg-amber-100 text-amber-900'
                    }`}
                  >
                    120 天一遍 (約2.2章/天)
                  </button>
                </div>
                <div className="text-[11px] text-amber-800 leading-relaxed font-medium pt-0.5">
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

          {/* Verses (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              追求經節範圍（選填）
            </label>
            <input
              type="text"
              value={currentVerses}
              onChange={(e) => setCurrentVerses(e.target.value)}
              placeholder="例如：弗四 1-16、羅八 1-14"
              className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Summary / Burdens */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              主題簡介與追求負擔（選填，無預設文字）
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="選填，無預設文字。可寫下這卷書或主題的核心負擔與禱讀方向..."
              rows={2}
              className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 font-serif"
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>發起主題並啟用 6-Emoji 邀請碼</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
