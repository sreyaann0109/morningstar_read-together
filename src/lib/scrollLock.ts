'use client';

import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * 鎖定全站背景滾動 (Lock Body & Document Scroll)
 * 防止在滑動浮動視窗、滑出側邊欄、設定彈窗時背景跟著捲動
 */
export function lockBodyScroll() {
  if (typeof window === 'undefined') return;
  lockCount++;
  if (lockCount === 1) {
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    // 計算桌機捲動軸寬度避免跳動 (Layout Shift)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('scroll-locked');
  }
}

/**
 * 解鎖全站背景滾動 (Unlock Body & Document Scroll)
 */
export function unlockBodyScroll() {
  if (typeof window === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
    document.documentElement.style.overflow = '';
    document.body.classList.remove('scroll-locked');
  }
}

/**
 * React Hook: 當 isLocked 為 true 時自動鎖定背景捲動，卸載或關閉時自動還原
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
