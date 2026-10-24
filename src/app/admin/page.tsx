'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center text-stone-600 text-xs">
      正在為您導向晨星共行首頁（請以管理員身份登入後直接點擊頂部「切換管理模式」按鍵）...
    </div>
  );
}
