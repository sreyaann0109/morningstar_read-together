'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  LogIn,
  Sparkles,
  ShieldCheck,
  BookOpen,
  KeyRound,
  HeartHandshake,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UserProfile, SiteSettings, DEFAULT_SITE_SETTINGS } from '../types';
import { demoUsers } from '../data/initialData';
import { hashPasswordWeb, verifyPasswordWeb, generateRandomTempPassword } from '../lib/password';
import { syncUsersToBackend, fetchInitialDataFromBackend } from '../lib/api';

interface LoginPageProps {
  allUsers: UserProfile[];
  onLoginSuccess: (user: UserProfile, isNewRegistration?: boolean) => void;
  siteSettings?: SiteSettings;
}

const AVATAR_OPTIONS = ['🦁', '🐑', '🕊️', '🦅', '🌾', '🌿', '💧', '🔥', '📖', '⛺'];

// 解析 Google OAuth JWT 憑證 payload
function parseJwtPayload(token: string): { email: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ allUsers, onLoginSuccess, siteSettings }) => {
  const effectiveAllowEmail = siteSettings ? siteSettings.allowEmailReset : true;
  const effectiveAllowAdmin = siteSettings ? siteSettings.allowAdminAssistedReset : true;
  const effectiveAllowRegister = siteSettings ? siteSettings.allowUserRegistration : true;

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'force_change_password'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState('🕊️');
  const [regError, setRegError] = useState<string | null>(null);

  // Forgot Password Channels: 'email_code' (Primary) vs 'admin_request' (Alternative)
  const [forgotChannel, setForgotChannel] = useState<'email_code' | 'admin_request'>(
    effectiveAllowEmail ? 'email_code' : 'admin_request'
  );

  React.useEffect(() => {
    if (!effectiveAllowEmail && effectiveAllowAdmin) {
      setForgotChannel('admin_request');
    } else if (effectiveAllowEmail && !effectiveAllowAdmin) {
      setForgotChannel('email_code');
    }
  }, [effectiveAllowEmail, effectiveAllowAdmin]);

  // Primary Email Verification Code State
  const [forgotEmail, setForgotEmail] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [sentTargetEmail, setSentTargetEmail] = useState('');
  const [sentTargetName, setSentTargetName] = useState('');
  const [forgotInputCode, setForgotInputCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotInfoMsg, setForgotInfoMsg] = useState<string | null>(null);

  // Alternative Admin Request State
  const [adminReqEmail, setAdminReqEmail] = useState('');
  const [adminReqError, setAdminReqError] = useState<string | null>(null);
  const [adminReqSuccessMsg, setAdminReqSuccessMsg] = useState<string | null>(null);

  // Force Change Password State (Triggered when user mustChangePassword === true)
  const [forceChangeUser, setForceChangeUser] = useState<UserProfile | null>(null);
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [forceConfirmPassword, setForceConfirmPassword] = useState('');
  const [forceChangeError, setForceChangeError] = useState<string | null>(null);

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('morningstar_registered_users');
      if (saved) {
        setRegisteredUsers(JSON.parse(saved));
      }
    } catch (e) {}
  }, [allUsers]);

  // Countdown timer for resending verification code
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const allUsersRef = useRef(allUsers);
  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);

  // Google 快速登入狀態與回調處理
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      if (!response || !response.credential) {
        throw new Error('未接收到 Google 授權憑證');
      }
      setIsGoogleLoading(true);
      setLoginError(null);
      setRegError(null);

      const payload = parseJwtPayload(response.credential);
      if (!payload || !payload.email) {
        throw new Error('無法取得 Google 帳號 Email 資訊');
      }

      const googleEmail = payload.email.toLowerCase().trim();
      const googleName = payload.name || googleEmail.split('@')[0] || '聖徒';

      // 1. 比對現有使用者中是否已有該信箱
      const combined = getCombinedUsers(allUsersRef.current);
      const matched = combined.find(
        (u) => u.email.toLowerCase().trim() === googleEmail
      );

      if (matched) {
        // 直接登入既有帳號，延遲 100ms 讓 Google GIS 腳本優雅結束 postMessage 回調後再切換 React 狀態
        setTimeout(() => {
          onLoginSuccess(matched, false);
        }, 100);
        return;
      }

      // 2. 自動為初次登入之聖徒建立專屬檔案
      const newUserId = `user-g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newUserProfile: UserProfile = {
        id: newUserId,
        name: googleName,
        email: googleEmail,
        password: '', // Google OAuth 授權，免密碼
        streakDays: 0,
        totalChaptersRead: 0,
        totalSharesCount: 0,
        totalAmenReceived: 0,
        avatar: '🕊️',
        role: 'user',
        displayMode: 'light',
        joinedInviteCodes: [],
        sanctuary: {
          placedRelicIds: ['relic-sun', 'relic-shield', 'relic-scroll', 'relic-crown'],
          motto: '同那清心呼求主的人，竭力追求公義、信、愛、和平。',
          theme: 'dawn',
        },
      };

      try {
        localStorage.setItem(`morningstar_user_${newUserId}_profile`, JSON.stringify(newUserProfile));
        localStorage.setItem(`morningstar_user_${newUserId}_joined_plans`, JSON.stringify([]));
        localStorage.setItem(`morningstar_user_${newUserId}_completed_today`, JSON.stringify(false));
        const regStr = localStorage.getItem('morningstar_registered_users');
        let updatedReg: UserProfile[] = [];
        if (regStr) {
          const list: UserProfile[] = JSON.parse(regStr);
          if (Array.isArray(list)) {
            updatedReg = [...list, newUserProfile];
          }
        } else {
          updatedReg = [newUserProfile];
        }
        localStorage.setItem('morningstar_registered_users', JSON.stringify(updatedReg));
        setRegisteredUsers(updatedReg);
        await syncUsersToBackend([...allUsersRef.current, newUserProfile]);
      } catch (e) {
        console.error('Failed to sync new Google user to backend:', e);
      }

      // 延遲 100ms 移交登入狀態，確保 Google GIS 腳本底層生命週期乾淨結算，杜絕組件強制卸載引發之 Client Exception
      setTimeout(() => {
        onLoginSuccess(newUserProfile, true);
      }, 100);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setLoginError(err.message || 'Google 登入失敗，請稍後重試。');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'login' && mode !== 'register') return;

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '1021252042341-arg3f5db6tbm6virngfmkk2i4dpipe7g.apps.googleusercontent.com';

    if (!clientId) return;

    const initializeGsi = () => {
      if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) return;

      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const targetId = mode === 'register' ? 'googleSignUpBtn' : 'googleSignInBtn';
        const btnElement = document.getElementById(targetId);
        if (btnElement) {
          btnElement.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: Math.min(btnElement.parentElement?.offsetWidth || 340, 360),
            text: mode === 'register' ? 'signup_with' : 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
          });
        }
      } catch (e) {
        console.error('Google GSI Init Error:', e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initializeGsi();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGsi;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initializeGsi);
      }
    }
  }, [mode]);

  const getCombinedUsers = (sourceUsers: UserProfile[] = allUsers): UserProfile[] => {
    const userMap = new Map<string, UserProfile>();
    demoUsers.forEach((u) => userMap.set(u.id, u));
    sourceUsers.forEach((u) => userMap.set(u.id, u));

    return Array.from(userMap.values()).map((u) => {
      let scoped = u;
      try {
        const scopedStr = localStorage.getItem(`morningstar_user_${u.id}_profile`);
        if (scopedStr) {
          const parsed = JSON.parse(scopedStr);
          scoped = {
            ...parsed,
            ...u,
            // Authoritative role from cloud/allUsers takes strict precedence!
            role: u.role || parsed.role || 'user',
          };
        }
      } catch (e) {}
      return scoped;
    });
  };

  const combinedUsers = getCombinedUsers();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccessMsg(null);

    // Try to get freshest users from backend database to ensure promotions & updates take immediate effect
    let sourceUsers = allUsers;
    try {
      const freshData = await fetchInitialDataFromBackend();
      if (freshData?.users && freshData.users.length > 0) {
        sourceUsers = freshData.users;
      }
    } catch (e) {}

    const latestList = getCombinedUsers(sourceUsers);
    const matchedUser = latestList.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matchedUser) {
      const isMatch = await verifyPasswordWeb(loginPassword, matchedUser.password || '');
      if (!isMatch) {
        setLoginError('密碼輸入不正確，請重新確認或點選下方「忘記密碼？」。');
        return;
      }

      // Check if user has mustChangePassword flag
      if (matchedUser.mustChangePassword) {
        setForceChangeUser(matchedUser);
        setForceNewPassword('');
        setForceConfirmPassword('');
        setForceChangeError(null);
        setMode('force_change_password');
        return;
      }

      onLoginSuccess(matchedUser, false);
      return;
    }

    setLoginError('找不到此電子信箱帳號，請點選下方「註冊新帳號」建立專屬帳號！');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('請完整填寫姓名、電子信箱與登入密碼。');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('密碼長度請至少設定 6 位字元。');
      return;
    }

    if (!regConfirmPassword.trim()) {
      setRegError('請再次輸入密碼以進行比對確認。');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('兩次輸入的密碼不一致，請重新確認。');
      return;
    }

    const latestList = getCombinedUsers();
    const emailExists = latestList.some(
      (u) => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setRegError('此電子信箱已經註冊過，請點選下方返回登入！');
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const hashedPassword = await hashPasswordWeb(regPassword);
    const newUser: UserProfile = {
      id: newUserId,
      name: regName.trim(),
      email: regEmail.trim(),
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
      const updatedReg = [newUser, ...registeredUsers];
      setRegisteredUsers(updatedReg);
      localStorage.setItem('morningstar_registered_users', JSON.stringify(updatedReg));
      localStorage.setItem(`morningstar_user_${newUserId}_profile`, JSON.stringify(newUser));
      localStorage.setItem(`morningstar_user_${newUserId}_joined_plans`, JSON.stringify([]));
      localStorage.setItem(`morningstar_user_${newUserId}_completed_today`, JSON.stringify(false));
      syncUsersToBackend(updatedReg);
    } catch (e) {}

    onLoginSuccess(newUser, true);
  };

  // Primary Forgot Password: Send 6-digit verification code to email via real SMTP
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError(null);
    setForgotInfoMsg(null);

    const target = (sentTargetEmail || forgotEmail).trim().toLowerCase();
    if (!target) {
      setForgotError('請先輸入您註冊的電子信箱 (Email)。');
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || '寄送驗證碼失敗，請稍後再試。');
        return;
      }

      setSentTargetEmail(data.email || data.targetEmail || target);
      setSentTargetName(data.name || data.targetName || '');
      setIsCodeSent(true);
      setResendCountdown(60);

      const targetDisplay = data.email || data.targetEmail || target;
      setForgotInfoMsg(
        `驗證碼已成功寄送至您的信箱「${targetDisplay}」！\n請至您的電子信箱收取驗證碼，並於 10 分鐘內輸入完成重設。`
      );
    } catch (err: any) {
      setForgotError(err?.message || '網路連線異常，請稍後再試。');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Primary Forgot Password: Verify code and set new password
  const handleVerifyCodeAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const code = forgotInputCode.trim();
    if (!code || code.length !== 6) {
      setForgotError('請輸入正確的驗證碼。');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('新密碼長度請至少設定 6 位字元。');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('兩次輸入的新密碼不一致，請重新確認。');
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sentTargetEmail,
          code,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || '驗證碼無效或已過期，請重新索取。');
        return;
      }

      // Sync local state if user is stored locally
      const latestList = getCombinedUsers();
      const user = latestList.find((u) => u.email.toLowerCase() === sentTargetEmail.toLowerCase());
      if (user) {
        const updated: UserProfile = {
          ...user,
          password: data.user?.password || (await hashPasswordWeb(forgotNewPassword)),
          mustChangePassword: false,
          passwordResetRequested: false,
        };
        try {
          localStorage.setItem(`morningstar_user_${user.id}_profile`, JSON.stringify(updated));
          const regStr = localStorage.getItem('morningstar_registered_users');
          if (regStr) {
            const regList: UserProfile[] = JSON.parse(regStr);
            const updatedReg = regList.map((u) => (u.id === user.id ? updated : u));
            setRegisteredUsers(updatedReg);
            localStorage.setItem('morningstar_registered_users', JSON.stringify(updatedReg));
          }
        } catch (e) {}
      }

      setLoginSuccessMsg('🎉 密碼已成功重新設定！請使用您的全新密碼登入。');
      setMode('login');
      setLoginEmail(sentTargetEmail);
      setLoginPassword('');
      setIsCodeSent(false);
      setForgotInputCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      setForgotError(err?.message || '重設密碼失敗，請稍後再試。');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Alternative Channel: Submit request for Admin to reset password
  const handleAdminResetRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminReqError(null);
    setAdminReqSuccessMsg(null);

    const normalizedEmail = adminReqEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setAdminReqError('請先輸入您註冊的電子信箱。');
      return;
    }

    const latestList = getCombinedUsers();
    const targetUser = latestList.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!targetUser) {
      setAdminReqError('找不到此電子信箱對應的帳號，請確認信箱是否正確。');
      return;
    }

    const tempCode = generateRandomTempPassword(10);
    const hashed = await hashPasswordWeb(tempCode);

    const updatedUser: UserProfile = {
      ...targetUser,
      password: hashed,
      tempPassword: tempCode,
      mustChangePassword: true,
      passwordResetRequested: true,
    };

    try {
      localStorage.setItem(
        `morningstar_user_${targetUser.id}_profile`,
        JSON.stringify(updatedUser)
      );
      const regStr = localStorage.getItem('morningstar_registered_users');
      let updatedReg: UserProfile[] = [];
      if (regStr) {
        const regList: UserProfile[] = JSON.parse(regStr);
        if (Array.isArray(regList)) {
          updatedReg = regList.map((u) => (u.id === targetUser.id ? updatedUser : u));
          if (!updatedReg.some((u) => u.id === targetUser.id)) {
            updatedReg.push(updatedUser);
          }
        }
      } else {
        updatedReg = [updatedUser];
      }
      setRegisteredUsers(updatedReg);
      localStorage.setItem('morningstar_registered_users', JSON.stringify(updatedReg));
      await syncUsersToBackend(updatedReg);
    } catch (e) {}

    setAdminReqSuccessMsg(
      `已為「${targetUser.name}」(${targetUser.email}) 提交重設申請！\n系統已自動為您產生臨時密碼並已送達管理員面板。請向管理員索取臨時密碼，登入後即可設定您的新密碼。`
    );
  };

  // Force Change Password: User sets new password when logging in with temporary password
  const handleForceChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForceChangeError(null);

    if (!forceChangeUser) {
      setMode('login');
      return;
    }

    if (!forceNewPassword || forceNewPassword.length < 6) {
      setForceChangeError('新密碼長度請至少設定 6 位字元。');
      return;
    }

    if (forceNewPassword !== forceConfirmPassword) {
      setForceChangeError('兩次輸入的新密碼不一致，請重新確認。');
      return;
    }

    const hashedPassword = await hashPasswordWeb(forceNewPassword);
    const updatedUser: UserProfile = {
      ...forceChangeUser,
      password: hashedPassword,
      tempPassword: undefined,
      mustChangePassword: false,
      passwordResetRequested: false,
    };

    try {
      localStorage.setItem(
        `morningstar_user_${updatedUser.id}_profile`,
        JSON.stringify(updatedUser)
      );
      const regStr = localStorage.getItem('morningstar_registered_users');
      let updatedReg: UserProfile[] = [];
      if (regStr) {
        const regList: UserProfile[] = JSON.parse(regStr);
        if (Array.isArray(regList)) {
          updatedReg = regList.map((u) => (u.id === updatedUser.id ? updatedUser : u));
          if (!updatedReg.some((u) => u.id === updatedUser.id)) {
            updatedReg.push(updatedUser);
          }
        }
      } else {
        updatedReg = [updatedUser];
      }
      setRegisteredUsers(updatedReg);
      localStorage.setItem('morningstar_registered_users', JSON.stringify(updatedReg));
      await syncUsersToBackend(updatedReg);
    } catch (e) {}

    onLoginSuccess(updatedUser, false);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Ambient Dawn Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-b from-amber-300/25 via-amber-100/15 to-transparent rounded-full blur-3xl" />

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
            <span className="text-xl">🌅</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 text-lg tracking-tight">晨星共行</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
                Morning Star Companions
              </span>
            </div>
            <p className="text-xs text-stone-500">召會生活・聖徒主題共讀與屬靈追求平台</p>
          </div>
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Vision & Scripture (6 cols on Desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>晨更清明・靈裡火熱・同伴同行</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
                直等到天發亮，
                <span className="text-amber-700 block sm:inline">晨星在你們心裏出現。</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-serif">
                「我們並有申言者更確定的話，你們留意這話，如同留意照在暗處的燈，直等到天發亮，晨星在你們心裏出現，你們就作得好了。」——彼得後書一章19節
              </p>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-serif">
                「你要逃避青年人的私慾，同那清心呼求主的人，竭力追求公義、信、愛、和平。」——提摩太後書二章22節
              </p>
            </div>

            {/* Platform Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-white/90 border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-800 mb-1">主題與篇數共讀</div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  依生命讀經、晨興聖言或職事書報主題與篇數，每日穩步追求打卡。
                </p>
              </div>

              <div className="bg-white/90 border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-800 mb-1">6-Emoji 邀請碼連線</div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  貼上或點選 6 個 Emoji 邀請碼加入追求小組，在共同主題內分享摸著。
                </p>
              </div>

              <div className="bg-white/90 border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-800 mb-1">個人追求帳幕陳設</div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  隨追求天數與篇數解鎖屬靈信物，陳設架由外院至新耶路撒冷漸進擴充。
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card (6 cols on Desktop) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden max-w-md mx-auto">
              {/* Card Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-50/40 border-b border-stone-100">
                <h3 className="text-lg font-bold text-stone-900">
                  {mode === 'login'
                    ? '登入'
                    : mode === 'register'
                    ? '註冊新帳號'
                    : mode === 'force_change_password'
                    ? '設定全新個人密碼'
                    : '忘記密碼'}
                </h3>
                {mode !== 'forgot' && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {mode === 'login'
                      ? '請輸入電子信箱與密碼進入您的專屬追求空間'
                      : mode === 'register'
                      ? '填寫基本資料，建立您的全新空白獨立追求檔案'
                      : '您的密碼已由管理員重設為臨時密碼，請先設定專屬新密碼'}
                  </p>
                )}
              </div>

              <div className="p-6 space-y-4">
                {mode === 'login' && (
                  /* DEFAULT VIEW: Login Form */
                  <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                    {loginSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{loginSuccessMsg}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>電子信箱 (Email)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="請輸入電子郵件"
                        className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        <span>登入密碼</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="請輸入密碼"
                        className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>登入帳號</span>
                    </button>

                    {/* Google 快速登入區塊 */}
                    <div className="space-y-3 pt-2">
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink mx-3 text-xs text-stone-400 font-medium">或使用 Google 快速登入</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                      </div>

                      <div className="relative w-full flex justify-center min-h-[44px]">
                        {isGoogleLoading && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center py-2.5 px-4 rounded-full border border-stone-200 bg-stone-50/95 text-stone-600 text-sm gap-2 backdrop-blur-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            <span>正在透過 Google 驗證身分...</span>
                          </div>
                        )}
                        <div id="googleSignInBtn" className="w-full flex justify-center" />
                      </div>
                    </div>

                    {/* Small Text Links for Forgot Password & Registration */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      {(effectiveAllowEmail || effectiveAllowAdmin) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setForgotChannel(effectiveAllowEmail ? 'email_code' : 'admin_request');
                            setForgotEmail(loginEmail);
                            setIsCodeSent(false);
                            setForgotInputCode('');
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                            setForgotError(null);
                            setForgotInfoMsg(null);
                            setAdminReqEmail(loginEmail);
                            setAdminReqError(null);
                            setAdminReqSuccessMsg(null);
                          }}
                          className="text-stone-500 hover:text-amber-700 underline transition-colors"
                        >
                          忘記密碼？
                        </button>
                      ) : (
                        <span />
                      )}


                      {effectiveAllowRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setRegError(null);
                            setLoginError(null);
                            setRegPassword('');
                            setRegConfirmPassword('');
                          }}
                          className="text-stone-500 hover:text-amber-700 transition-colors"
                        >
                          還沒有帳號？<span className="font-semibold text-amber-700 underline ml-0.5">註冊新帳號</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {mode === 'register' && (
                  /* REGISTER VIEW */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        選擇代表頭像 Emoji
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVATAR_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setRegAvatar(emoji)}
                            className={`w-8 h-8 rounded-xl text-base flex items-center justify-center border transition-all ${
                              regAvatar === emoji
                                ? 'bg-amber-100 border-amber-400 scale-105 shadow-2xs'
                                : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        姓名 / 稱謂 *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="例如：恩典姊妹"
                        className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-stone-700">
                          電子信箱 (Email) *
                        </label>
                        <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          💡 建議使用 Gmail 帳戶為佳
                        </span>
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[11px] text-stone-500 mt-1 leading-tight flex items-center gap-1">
                        <span>💡</span>
                        <span>註冊建議優先填寫 Gmail 帳戶，以利即時順暢收取驗證信與提醒通知。</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        設定密碼 (至少 6 位字元) *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="請設定您的登入密碼"
                        className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        再次確認密碼 *
                      </label>
                      <input
                        type="password"
                        required
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

                    {regError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {regError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>完成註冊並進入平台</span>
                    </button>

                    {/* Google 快速註冊區塊 */}
                    <div className="space-y-3 pt-2">
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink mx-3 text-xs text-stone-400 font-medium">或使用 Google 快速註冊</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                      </div>

                      <div className="relative w-full flex justify-center min-h-[44px]">
                        {isGoogleLoading && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center py-2.5 px-4 rounded-full border border-stone-200 bg-stone-50/95 text-stone-600 text-sm gap-2 backdrop-blur-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            <span>正在透過 Google 建立帳號...</span>
                          </div>
                        )}
                        <div id="googleSignUpBtn" className="w-full flex justify-center" />
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setRegError(null);
                          setRegPassword('');
                          setRegConfirmPassword('');
                        }}
                        className="text-xs text-stone-500 hover:text-amber-700 transition-colors"
                      >
                        已經有帳號了？<span className="font-semibold text-amber-700 underline ml-0.5">返回登入</span>
                      </button>
                    </div>
                  </form>
                )}

                {mode === 'forgot' && (
                  /* FORGOT PASSWORD VIEW: Dual Channels (Email Code vs Admin Request) controlled by siteSettings */
                  <div className="space-y-4">
                    {!effectiveAllowEmail && !effectiveAllowAdmin ? (
                      <div className="py-8 px-4 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
                        <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto mb-1" />
                        <h4 className="text-sm font-bold text-stone-800">線上密碼重設服務暫未開放</h4>
                        <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                          召會管理同工目前暫停線上密碼重設通道。若您忘記登入密碼，請直接聯繫各會所管理同工協助。
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Channel Selector Tabs: only show if BOTH are enabled */}
                        {effectiveAllowEmail && effectiveAllowAdmin && (
                          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl text-xs font-semibold text-stone-600">
                            <button
                              type="button"
                              onClick={() => {
                                setForgotChannel('email_code');
                                setForgotError(null);
                              }}
                              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                forgotChannel === 'email_code'
                                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                  : 'hover:text-stone-900'
                              }`}
                            >
                              <Mail className="w-3.5 h-3.5 text-amber-600" />
                              <span>信箱驗證碼 (主要)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setForgotChannel('admin_request');
                                setForgotError(null);
                              }}
                              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                forgotChannel === 'admin_request'
                                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                                  : 'hover:text-stone-900'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>聯繫管理員協助</span>
                            </button>
                          </div>
                        )}

                        {(effectiveAllowEmail && (forgotChannel === 'email_code' || !effectiveAllowAdmin)) ? (
                          /* CHANNEL 1: Real Email Verification Code */
                      <div className="space-y-4">
                        {!isCodeSent ? (
                          /* Step 1: Input email and send real code */
                          <form onSubmit={handleSendVerificationCode} className="space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-amber-600" />
                                <span>註冊的電子信箱 (Email)</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                              />
                              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                                系統將會寄送安全驗證碼至此信箱，請確保信箱可正常收信。
                              </p>
                            </div>

                            {forgotError && (
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                                {forgotError}
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={isSendingCode}
                              className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              {isSendingCode ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>正在寄送驗證碼...</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-4 h-4" />
                                  <span>寄送驗證碼至信箱</span>
                                </>
                              )}
                            </button>
                          </form>
                        ) : (
                          /* Step 2: Input code and new password */
                          <form onSubmit={handleVerifyCodeAndReset} className="space-y-3.5">
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-amber-950">收件信箱：{sentTargetEmail}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCodeSent(false);
                                    setForgotError(null);
                                    setForgotInfoMsg(null);
                                  }}
                                  className="text-[11px] text-amber-700 underline hover:text-amber-900"
                                >
                                  更換信箱
                                </button>
                              </div>
                              {forgotInfoMsg && (
                                <p className="text-[11px] text-amber-800 whitespace-pre-line leading-relaxed mt-1">
                                  {forgotInfoMsg}
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                  <span>驗證碼</span>
                                </label>
                                <button
                                  type="button"
                                  disabled={resendCountdown > 0 || isSendingCode}
                                  onClick={() => handleSendVerificationCode()}
                                  className="text-xs text-amber-700 disabled:text-stone-400 hover:underline transition-colors"
                                >
                                  {resendCountdown > 0 ? `重新發送 (${resendCountdown}s)` : '重新發送驗證碼'}
                                </button>
                              </div>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={forgotInputCode}
                                onChange={(e) => setForgotInputCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="請輸入驗證碼"
                                className="w-full text-base tracking-widest font-mono font-bold rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500 text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                                <span>設定新密碼 (至少 6 位字元)</span>
                              </label>
                              <input
                                type="password"
                                required
                                minLength={6}
                                value={forgotNewPassword}
                                onChange={(e) => setForgotNewPassword(e.target.value)}
                                placeholder="請設定您的專屬新密碼"
                                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                                <span>再次確認新密碼</span>
                              </label>
                              <input
                                type="password"
                                required
                                minLength={6}
                                value={forgotConfirmPassword}
                                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                placeholder="請再次輸入新密碼"
                                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {forgotError && (
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                                {forgotError}
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={isSendingCode}
                              className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              {isSendingCode ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>正在驗證並更新密碼...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>驗證並重設密碼</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      /* CHANNEL 2: Alternative Admin Request */
                      <div className="space-y-4">
                        {adminReqSuccessMsg ? (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2">
                              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>申請已成功送出</span>
                              </div>
                              <p className="whitespace-pre-line leading-relaxed text-stone-700">
                                {adminReqSuccessMsg}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setMode('login');
                                setAdminReqSuccessMsg(null);
                                setAdminReqError(null);
                              }}
                              className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <LogIn className="w-4 h-4" />
                              <span>返回登入頁面</span>
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleAdminResetRequestSubmit} className="space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-stone-400" />
                                <span>已註冊的電子信箱 (Email)</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={adminReqEmail}
                                onChange={(e) => setAdminReqEmail(e.target.value)}
                                className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                              />
                              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                                若您無法使用信箱收取驗證碼，管理員可在後台為您產生一組 10 碼臨時密碼。使用該臨時密碼登入後，系統將強制您設定新密碼。
                              </p>
                            </div>

                            {adminReqError && (
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                                {adminReqError}
                              </div>
                            )}

                            <button
                              type="submit"
                              className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>送出管理員重設申請</span>
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                      </>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setForgotError(null);
                          setForgotInfoMsg(null);
                          setAdminReqError(null);
                          setAdminReqSuccessMsg(null);
                        }}
                        className="text-stone-500 hover:text-amber-700 underline transition-colors"
                      >
                        ← 返回登入
                      </button>

                      {effectiveAllowRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setForgotError(null);
                            setForgotInfoMsg(null);
                            setAdminReqError(null);
                            setAdminReqSuccessMsg(null);
                          }}
                          className="text-stone-500 hover:text-amber-700 hover:underline transition-colors"
                        >
                          註冊新帳號
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {mode === 'force_change_password' && forceChangeUser && (
                  /* FORCE CHANGE PASSWORD VIEW: Mandatory when mustChangePassword === true */
                  <form onSubmit={handleForceChangePasswordSubmit} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>需先完成密碼更新</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        親愛的 <strong className="text-stone-900">{forceChangeUser.name}</strong> 聖徒，管理員已為您的帳號產生臨時密碼。為了保障您的追求記錄與帳號安全，請在此設定全新的個人專屬密碼方可進入系統。
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>設定新密碼 (至少 6 位字元)</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={forceNewPassword}
                        onChange={(e) => setForceNewPassword(e.target.value)}
                        placeholder="請輸入您的專屬新密碼"
                        className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        <span>再次確認新密碼</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={forceConfirmPassword}
                        onChange={(e) => setForceConfirmPassword(e.target.value)}
                        placeholder="請再次輸入新密碼"
                        className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {forceChangeError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {forceChangeError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>儲存新密碼並進入系統</span>
                    </button>

                    <div className="text-center pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setForceChangeUser(null);
                          setForceChangeError(null);
                        }}
                        className="text-stone-500 hover:text-amber-700 underline transition-colors"
                      >
                        取消並返回登入頁
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 border-t border-stone-200/60 text-center text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>晨星共行 © 2026 · 與清心呼求主的人一同竭力追求</span>
        <span className="font-serif text-stone-400">
          「你的言語一解開，就發出亮光，使愚蒙人通達。」（詩一一九130）
        </span>
      </footer>
    </div>
  );
};
