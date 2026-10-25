'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Check,
  Mail,
  Lock,
  User,
  Sun,
  Moon,
  BookOpen,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, DisplayMode } from '../types';
import { demoUsers } from '../data/initialData';
import { hashPasswordWeb, verifyPasswordWeb } from '../lib/password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  isLoggedIn?: boolean;
  allUsers?: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onUpdateProfile?: (updatedUser: UserProfile) => void;
}

const AVATARS = ['☀️', '🌱', '🕊️', '✨', '🌊', '🌿', '📖', '🛡️', '🍇', '🔥'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isLoggedIn = true,
  allUsers,
  onLogin,
  onLogout,
  onUpdateProfile,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state (only used when !isLoggedIn)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state (only used when !isLoggedIn)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState('☀️');
  const [regError, setRegError] = useState<string | null>(null);

  // Personal Settings form state (used when isLoggedIn)
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editDisplayMode, setEditDisplayMode] = useState<DisplayMode>(
    currentUser.displayMode || 'light'
  );
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Track open state and user ID so that 3.5s background polling of currentUser doesn't wipe active form inputs
  const prevIsOpenRef = React.useRef(false);
  const prevUserIdRef = React.useRef(currentUser.id);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const userSwitched = currentUser.id !== prevUserIdRef.current;

    if (isOpen && isLoggedIn && (justOpened || userSwitched)) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditAvatar(currentUser.avatar);
      setEditPassword('');
      setEditConfirmPassword('');
      setEditDisplayMode(currentUser.displayMode || 'light');
      setSettingsSavedMsg(null);
      setSettingsError(null);
    }
    prevIsOpenRef.current = isOpen;
    prevUserIdRef.current = currentUser.id;
  }, [isOpen, isLoggedIn, currentUser.id, currentUser.name, currentUser.email, currentUser.avatar, currentUser.displayMode]);

  if (!isOpen) return null;

  const getKnownUsers = (): UserProfile[] => {
    const registeredUsers: UserProfile[] = (() => {
      try {
        return JSON.parse(localStorage.getItem('morningstar_registered_users') || '[]');
      } catch {
        return [];
      }
    })();
    const map = new Map<string, UserProfile>();
    demoUsers.forEach((u) => map.set(u.id, u));
    registeredUsers.forEach((u) => map.set(u.id, u));
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach((u) => map.set(u.id, u));
    }
    return Array.from(map.values());
  };

  // Handle saving personal settings when logged in
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSavedMsg(null);

    if (!editName.trim()) {
      setSettingsError('聖徒姓名不能為空');
      return;
    }
    if (!editEmail.trim()) {
      setSettingsError('電子信箱不能為空');
      return;
    }
    if (editPassword.trim().length > 0) {
      if (editPassword.trim().length < 6) {
        setSettingsError('新密碼長度至少需要 6 個字元');
        return;
      }
      if (!editConfirmPassword.trim()) {
        setSettingsError('請再次輸入新密碼以進行比對確認');
        return;
      }
      if (editPassword.trim() !== editConfirmPassword.trim()) {
        setSettingsError('兩次輸入的新密碼不一致，請重新確認');
        return;
      }
    }

    const hashedPassword = editPassword.trim().length >= 6
      ? await hashPasswordWeb(editPassword.trim())
      : currentUser.password;

    const updatedUser: UserProfile = {
      ...currentUser,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      avatar: editAvatar,
      displayMode: editDisplayMode,
      password: hashedPassword,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedUser);
    }
    setEditPassword('');
    setEditConfirmPassword('');
    setSettingsSavedMsg('✨ 個人設定已成功保存！');
  };

  // Handle Login with Email & Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('請輸入電子信箱與密碼');
      return;
    }

    const knownUsers = getKnownUsers();
    const matched = knownUsers.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matched) {
      const isMatch = await verifyPasswordWeb(loginPassword.trim(), matched.password || '');
      if (!isMatch) {
        setLoginError('密碼不正確，請重新輸入。');
        return;
      }

      let userToLogin = matched;
      try {
        const savedScopedProfile = localStorage.getItem(`morningstar_user_${matched.id}_profile`);
        if (savedScopedProfile) {
          const parsed = JSON.parse(savedScopedProfile);
          userToLogin = {
            ...parsed,
            ...matched,
            role: matched.role || parsed.role || 'user',
          };
        }
      } catch (e) {}

      onLogin(userToLogin);
      onClose();
      return;
    }

    setLoginError('找不到此電子信箱，請點選「新用戶註冊」建立帳號，或選擇下方示範帳號！');
  };

  // Handle Register with Email & Password
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regEmail.trim()) {
      setRegError('請輸入有效的電子信箱');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setRegError('密碼長度至少需要 6 個字元');
      return;
    }

    if (!regConfirmPassword.trim()) {
      setRegError('請再次輸入密碼以進行比對確認');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('兩次輸入的密碼不一致，請重新確認');
      return;
    }

    if (!regName.trim()) {
      setRegError('請填寫聖徒姓名或稱謂');
      return;
    }

    const knownUsers = getKnownUsers();
    if (knownUsers.some((u) => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setRegError('此電子信箱已被註冊，請切換至「電子信箱登入」或使用其他信箱。');
      return;
    }

    const hashedPassword = await hashPasswordWeb(regPassword);
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: hashedPassword,
      streakDays: 0,
      totalChaptersRead: 0,
      totalSharesCount: 0,
      totalAmenReceived: 0,
      avatar: regAvatar,
      role: 'user',
      displayMode: 'light',
      joinedInviteCodes: [],
      sanctuary: {
        placedRelicIds: [],
        motto: '直等到天發亮，晨星在你們心裏出現。',
        theme: 'dawn',
      },
    };

    try {
      const registeredUsers: UserProfile[] = JSON.parse(
        localStorage.getItem('morningstar_registered_users') || '[]'
      );
      localStorage.setItem(
        'morningstar_registered_users',
        JSON.stringify([...registeredUsers, newUser])
      );
      localStorage.setItem(`morningstar_user_${newUser.id}_profile`, JSON.stringify(newUser));
      localStorage.setItem(`morningstar_user_${newUser.id}_joined_plans`, JSON.stringify([]));
      localStorage.setItem(`morningstar_user_${newUser.id}_completed_today`, JSON.stringify(false));
    } catch (e) {}

    onLogin(newUser);
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
        className="bg-white rounded-3xl w-full max-w-md max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain shadow-2xl border border-stone-200 p-5 sm:p-7 relative text-stone-900"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoggedIn ? (
          /* =========================================================
             LOGGED-IN VIEW: PERSONAL SETTINGS ONLY (No Login/Register Forms)
             ========================================================= */
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl shadow-inner flex-shrink-0">
                {editAvatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">個人設定與帳號管理</h3>
                  {currentUser.role === 'admin' && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      管理員
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">
                  快速調整顯示模式、名字、信箱與密碼
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              {/* 1. Display Mode Setting (Instant Apply on Click) */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Settings className="w-3 h-3 text-amber-600" />
                  <span>頁面顯示模式（點擊立即切換）</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditDisplayMode('light');
                      if (onUpdateProfile) {
                        onUpdateProfile({ ...currentUser, displayMode: 'light' });
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      editDisplayMode === 'light'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>晨光淺色</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditDisplayMode('warm');
                      if (onUpdateProfile) {
                        onUpdateProfile({ ...currentUser, displayMode: 'warm' });
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      editDisplayMode === 'warm'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>溫潤書卷</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditDisplayMode('dark');
                      if (onUpdateProfile) {
                        onUpdateProfile({ ...currentUser, displayMode: 'dark' });
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      editDisplayMode === 'dark'
                        ? 'border-amber-500 bg-stone-900 text-amber-300 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>夜更深色</span>
                  </button>
                </div>
              </div>

              {/* 2. Avatar Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  代表頭像 Emoji
                </label>
                <div className="flex flex-wrap gap-1">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                        editAvatar === emoji
                          ? 'bg-amber-100 border-2 border-amber-500 scale-105'
                          : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Name & Email in Compact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-500" />
                    <span>名字更改</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-200 px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-500" />
                    <span>信箱更改</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-200 px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 4. Password Change */}
              <div className="space-y-2.5 pt-1 border-t border-stone-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-stone-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-500" />
                      <span>密碼更改（若不修改請留空）</span>
                    </label>
                    {editPassword.length > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-medium">
                        需輸入兩次比對確認
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="輸入至少 6 位新密碼以更改密碼..."
                    className="w-full text-xs rounded-xl border border-stone-200 px-2.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {editPassword.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-500" />
                      <span>再次確認新密碼 *</span>
                    </label>
                    <input
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="請再次輸入新密碼以進行比對確認..."
                      className={`w-full text-xs rounded-xl border px-2.5 py-2 focus:outline-none transition-colors ${
                        editConfirmPassword && editPassword !== editConfirmPassword
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : editConfirmPassword && editPassword === editConfirmPassword
                          ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                          : 'border-stone-200 focus:border-amber-500'
                      }`}
                    />
                    {editConfirmPassword && editPassword !== editConfirmPassword && (
                      <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>兩次輸入的新密碼不一致，請重新確認</span>
                      </p>
                    )}
                    {editConfirmPassword && editPassword === editConfirmPassword && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                        <span>✓</span>
                        <span>兩次新密碼輸入一致</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {settingsError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {settingsError}
                </p>
              )}

              {settingsSavedMsg && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 font-medium">
                  {settingsSavedMsg}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存設定</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出帳號</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================
             LOGGED-OUT VIEW: LOGIN & REGISTER FORMS
             ========================================================= */
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                ✨
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">聖徒登入與註冊</h3>
                <p className="text-xs text-stone-500">
                  請登入您的帳號或註冊新帳號以進入個人追求空間
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-stone-100 p-1 mb-5 text-xs font-semibold">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                電子信箱登入
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                新用戶註冊
              </button>
            </div>

            {/* Tab 1: Email & Password Login */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span>電子信箱 (Email)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="請輸入電子郵件"
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>登入密碼</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-all"
                >
                  登入帳號
                </button>
              </form>
            )}

            {/* Tab 2: Email & Password Register */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span>電子信箱 (Email) <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>設定密碼（至少 6 位字元） <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="請設定登入密碼"
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>再次確認密碼 <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="請再次輸入密碼以進行比對確認"
                    className={`w-full text-sm rounded-xl border p-2.5 focus:outline-none transition-colors ${
                      regConfirmPassword && regPassword !== regConfirmPassword
                        ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                        : regConfirmPassword && regPassword === regConfirmPassword
                        ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                        : 'border-stone-200 focus:border-amber-500'
                    }`}
                  />
                  {regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>兩次輸入的密碼不一致，請重新確認</span>
                    </p>
                  )}
                  {regConfirmPassword && regPassword === regConfirmPassword && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                      <span>✓</span>
                      <span>兩次密碼輸入一致</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>聖徒姓名 / 稱謂 <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="例如：同心弟兄、喜樂姊妹"
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    選擇代表頭像 Emoji
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setRegAvatar(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          regAvatar === emoji
                            ? 'bg-amber-100 border-2 border-amber-500 scale-105'
                            : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {regError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                    {regError}
                  </p>
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
                    className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm"
                  >
                    註冊並登入
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
