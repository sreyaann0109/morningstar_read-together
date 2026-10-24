'use client';

import React from 'react';
import { BookOpen, Sparkles, Users, BarChart3 } from 'lucide-react';

export type MobileTab = 'today' | 'feed' | 'companions' | 'stats';

interface BottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  feedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  feedCount,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 safe-area-bottom">
      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={() => onChangeTab('today')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
            activeTab === 'today'
              ? 'text-amber-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">今日追求</span>
        </button>

        <button
          onClick={() => onChangeTab('feed')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
            activeTab === 'feed'
              ? 'text-amber-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">動態牆</span>
          {feedCount > 0 && (
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => onChangeTab('companions')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
            activeTab === 'companions'
              ? 'text-amber-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">同伴</span>
        </button>

        <button
          onClick={() => onChangeTab('stats')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
            activeTab === 'stats'
              ? 'text-amber-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">追求統計</span>
        </button>
      </div>
    </div>
  );
};
