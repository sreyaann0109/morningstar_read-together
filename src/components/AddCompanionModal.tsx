'use client';

import React, { useState } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { Companion } from '../types';

interface AddCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompanion: (companion: Omit<Companion, 'id' | 'todayCompleted' | 'streakDays' | 'lastActive' | 'encouragedToday'>) => void;
}

const AVATAR_OPTIONS = ['🌱', '🕊️', '🌊', '✨', '☀️', '🌿', '📖', '🛡️', '🍇'];

export const AddCompanionModal: React.FC<AddCompanionModalProps> = ({
  isOpen,
  onClose,
  onAddCompanion,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('同伴');
  const [avatar, setAvatar] = useState('🌱');
  const [planTitle, setPlanTitle] = useState('羅馬書生命讀經');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCompanion({
      name: name.trim(),
      role: role.trim() || '同伴',
      avatar,
      currentPlanTitle: planTitle,
    });

    setName('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">邀請 / 新增同伴</h3>
            <p className="text-xs text-stone-500">同那清心呼求主的人一同竭力追求</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              同伴姓名 / 稱呼
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：忠信弟兄、喜樂姊妹"
              className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              關係 / 角色
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 bg-white"
            >
              <option value="清晨同伴">清晨同伴</option>
              <option value="同區聖徒">同區聖徒</option>
              <option value="小排同伴">小排同伴</option>
              <option value="大專青職">大專青職</option>
              <option value="家人同伴">家人同伴</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              選擇頭像 Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'bg-amber-100 border-2 border-amber-500 scale-105'
                      : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm"
            >
              確認加入同伴
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
