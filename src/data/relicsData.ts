import { SpiritualRelic, SanctuaryConfig, PursuitPlan, UserProfile, SharingPost } from '../types';

export const ALL_SPIRITUAL_RELICS: SpiritualRelic[] = [
  // 光照系列
  {
    id: 'relic-oil-lamp',
    name: '清晨油燈',
    emoji: '🪔',
    category: 'light',
    categoryLabel: '光照系列',
    requirement: '完成第 1 篇追求',
    verseQuote: '「你的話是我腳前的燈，是我路上的光。」（詩一一九105）',
    meaning: '清晨隨主引導，點亮一天的腳步',
  },
  {
    id: 'relic-candle',
    name: '明亮燭光',
    emoji: '🕯️',
    category: 'light',
    categoryLabel: '光照系列',
    requirement: '連續追求 3 天',
    verseQuote: '「如同留意照在暗處的燈。」（彼後一19上）',
    meaning: '在暗處堅定守望，持續照亮心中',
  },
  {
    id: 'relic-morning-star',
    name: '晨星微光',
    emoji: '✨',
    category: 'light',
    categoryLabel: '光照系列',
    requirement: '連續追求 7 天（晨星初現）',
    verseQuote: '「直等到天發亮，晨星在你們心裏出現。」（彼後一19下）',
    meaning: '基督晨星在深處升起，驅散一切黑暗',
  },
  {
    id: 'relic-sun',
    name: '公義日頭',
    emoji: '☀️',
    category: 'light',
    categoryLabel: '光照系列',
    requirement: '連續追求 21 天',
    verseQuote: '「向你們敬畏我名的人，必有公義的日頭出現，其光線有醫治之能。」（瑪四2）',
    meaning: '得著基督作公義之日照耀醫治',
  },

  // 話語系列
  {
    id: 'relic-scroll',
    name: '典藏古卷',
    emoji: '📜',
    category: 'word',
    categoryLabel: '話語系列',
    requirement: '累計完成 5 篇',
    verseQuote: '「我將你的話珍藏在心裡，免得我得罪你。」（詩一一九11）',
    meaning: '沉潛進入聖經與職事信息精金真理',
  },
  {
    id: 'relic-bible',
    name: '敞開聖經',
    emoji: '📖',
    category: 'word',
    categoryLabel: '話語系列',
    requirement: '累計完成 15 篇',
    verseQuote: '「你的言語一解開，就發出亮光，使愚蒙人通達。」（詩一一九130）',
    meaning: '主話向著靈敞開，天天得著新鮮啟示',
  },
  {
    id: 'relic-quill',
    name: '抄經筆墨',
    emoji: '✍️',
    category: 'word',
    categoryLabel: '話語系列',
    requirement: '累計分享 5 篇今日摸著',
    verseQuote: '「我心裏湧出美辭...我的舌頭是快手筆。」（詩四五1）',
    meaning: '心被主話摸著，湧出美辭彼此供應',
  },
  {
    id: 'relic-shield',
    name: '信的盾牌',
    emoji: '🛡️',
    category: 'word',
    categoryLabel: '話語系列',
    requirement: '累計完成 30 篇',
    verseQuote: '「此外，拿起信的盾牌，藉此就能滅盡那惡者一切燒著的箭。」（弗六16）',
    meaning: '真理的話化作信的盾牌，保全靈裡的安息',
  },

  // 生命系列
  {
    id: 'relic-sprout',
    name: '溪旁嫩芽',
    emoji: '🌱',
    category: 'life',
    categoryLabel: '生命系列',
    requirement: '首次打卡追求',
    verseQuote: '「他要像一棵樹，栽在溪水旁，按時候結果子，葉子也不枯乾。」（詩一3）',
    meaning: '神聖生命的種子在心土中萌芽長大',
  },
  {
    id: 'relic-lily',
    name: '谷中百合',
    emoji: '🪴',
    category: 'life',
    categoryLabel: '生命系列',
    requirement: '累計完成 10 篇',
    verseQuote: '「我是沙崙的番紅花，是谷中的百合花。」（歌二1）',
    meaning: '在低微谷中活出純潔單一信靠主的生活',
  },
  {
    id: 'relic-dove',
    name: '和平之鴿',
    emoji: '🕊️',
    category: 'life',
    categoryLabel: '生命系列',
    requirement: '連續追求 14 天（靈裡得力）',
    verseQuote: '「神的靈彷彿鴿子降下，落在祂身上。」（太三16）',
    meaning: '眼目單純如鴿子，在安息中順服主靈引導',
  },
  {
    id: 'relic-grape',
    name: '葡萄美果',
    emoji: '🍇',
    category: 'life',
    categoryLabel: '生命系列',
    requirement: '累計完成 20 篇',
    verseQuote: '「我是葡萄樹，你們是枝子；住在我裏面的，我也住在他裏面，這人就多結果子。」（約十五5）',
    meaning: '與基督生機聯結，結出豐盈神聖果實',
  },

  // 讚美系列
  {
    id: 'relic-harp',
    name: '讚美琴瑟',
    emoji: '🎻',
    category: 'praise',
    categoryLabel: '讚美系列',
    requirement: '累計分享亮光 10 則',
    verseQuote: '「你們應當彈琴稱謝耶和華，用十弦瑟向祂歌頌。」（詩三三2）',
    meaning: '心被恩感向主歌唱，同伴在愛中彼此建造',
  },
  {
    id: 'relic-crown',
    name: '生命冠冕',
    emoji: '👑',
    category: 'praise',
    categoryLabel: '讚美系列',
    requirement: '累計追求達 50 篇或完成專案',
    verseQuote: '「你務要至死忠信，我就賜給你生命的冠冕。」（啟二10下）',
    meaning: '奔跑當跑賽程，活出基督以得著生命的冠冕',
  },
];

export interface UserStatsCriteria {
  totalChaptersRead: number;
  streakDays: number;
  totalSharesCount: number;
  totalAmenReceived: number;
  hasJoinedPlans?: boolean;
  planCompleted?: boolean;
}

export function isRelicUnlocked(relicId: string, stats: UserStatsCriteria): boolean {
  // 沒有加入任何追求主題時，不應獲得任何屬靈信物
  if (stats.hasJoinedPlans === false) {
    return false;
  }

  switch (relicId) {
    case 'relic-oil-lamp':
      return stats.totalChaptersRead >= 1;
    case 'relic-candle':
      return stats.streakDays >= 3;
    case 'relic-morning-star':
      return stats.streakDays >= 7;
    case 'relic-sun':
      return stats.streakDays >= 21;
    case 'relic-scroll':
      return stats.totalChaptersRead >= 5;
    case 'relic-bible':
      return stats.totalChaptersRead >= 15;
    case 'relic-quill':
      return stats.totalSharesCount >= 5;
    case 'relic-shield':
      return stats.totalChaptersRead >= 30;
    case 'relic-sprout':
      return stats.totalChaptersRead >= 1;
    case 'relic-lily':
      return stats.totalChaptersRead >= 10;
    case 'relic-dove':
      return stats.streakDays >= 14;
    case 'relic-grape':
      return stats.totalChaptersRead >= 20;
    case 'relic-harp':
      return stats.totalSharesCount >= 10;
    case 'relic-crown':
      return stats.totalChaptersRead >= 50 || !!stats.planCompleted;
    default:
      return false;
  }
}

/**
 * 計算使用者在單一追求主題 (PursuitPlan) 下的屬靈信物解鎖條件數據
 */
export function getPlanRelicStats(
  plan: PursuitPlan,
  user: UserProfile,
  posts: SharingPost[] = []
): UserStatsCriteria {
  const member = (plan.members || []).find(
    (m) => m.userId === user.id || m.name === user.name
  );

  // 該追求主題聖徒獨立完成之篇數（嚴格跟隨該主題，絕不混入其他主題之總篇數）
  const planChapters = member?.completedUnits !== undefined
    ? member.completedUnits
    : (plan.completedUnits || 0);

  // 該追求主題之連續追求天數
  const planStreak = member?.streakDays !== undefined
    ? member.streakDays
    : (user.streakDays || 0);

  // 該追求主題內由該聖徒分享之亮光摸著（嚴格跟隨該主題）
  const userPlanPosts = posts.filter(
    (p) =>
      (p.planId === plan.id || p.planTitle === plan.title) &&
      (p.authorId === user.id || p.authorName === user.name)
  );
  const planShares = userPlanPosts.length;

  // 該追求主題內獲得之阿們數
  const planAmenFromPosts = userPlanPosts.reduce(
    (sum, p) => sum + (p.reactions?.amenCount || 0),
    0
  );

  return {
    totalChaptersRead: planChapters,
    streakDays: planStreak,
    totalSharesCount: planShares,
    totalAmenReceived: planAmenFromPosts,
    hasJoinedPlans: true,
    planCompleted: plan.totalUnits > 0 && planChapters >= plan.totalUnits,
  };
}

/**
 * 取得單一追求主題已獲得的所有屬靈信物
 */
export function getPlanUnlockedRelics(
  plan: PursuitPlan,
  user: UserProfile,
  posts: SharingPost[] = []
): SpiritualRelic[] {
  const planStats = getPlanRelicStats(plan, user, posts);
  return ALL_SPIRITUAL_RELICS.filter((r) => isRelicUnlocked(r.id, planStats));
}

export interface SanctuaryTierInfo {
  tier: number;
  tierName: string;
  stageName: string;
  maxSlots: number;
  nextRequirementText?: string;
  isUnlocked: (stats: UserStatsCriteria) => boolean;
}

export const SANCTUARY_SLOT_TIERS: SanctuaryTierInfo[] = [
  {
    tier: 1,
    tierName: '一階・外院祭壇桌',
    stageName: '外院子',
    maxSlots: 4,
    nextRequirementText: '主題進度達 5 篇或連續 7 天，可擴充至 6 格聖所陳設桌',
    isUnlocked: () => true,
  },
  {
    tier: 2,
    tierName: '二階・聖所陳設桌',
    stageName: '聖所陳設桌',
    maxSlots: 6,
    nextRequirementText: '主題進度達 15 篇或連續 14 天，可擴充至 8 格金燈臺照耀台',
    isUnlocked: (s) => s.hasJoinedPlans !== false && (s.totalChaptersRead >= 5 || s.streakDays >= 7 || !!s.planCompleted),
  },
  {
    tier: 3,
    tierName: '三階・金燈臺照耀台',
    stageName: '金燈臺照耀台',
    maxSlots: 8,
    nextRequirementText: '主題進度達 30 篇或連續 21 天，可擴充至 10 格金香壇',
    isUnlocked: (s) => s.hasJoinedPlans !== false && (s.totalChaptersRead >= 15 || s.streakDays >= 14 || !!s.planCompleted),
  },
  {
    tier: 4,
    tierName: '四階・金香壇香氣之所',
    stageName: '金香壇祈求',
    maxSlots: 10,
    nextRequirementText: '主題進度達 50 篇，可擴充至 12 格至聖所約櫃榮耀架',
    isUnlocked: (s) => s.hasJoinedPlans !== false && (s.totalChaptersRead >= 30 || s.streakDays >= 21 || !!s.planCompleted),
  },
  {
    tier: 5,
    tierName: '五階・至聖所約櫃榮耀架',
    stageName: '至聖所約櫃',
    maxSlots: 12,
    nextRequirementText: '主題進度達 80 篇或圓滿完成，可擴充至 14 格新耶路撒冷圓滿座',
    isUnlocked: (s) => s.hasJoinedPlans !== false && (s.totalChaptersRead >= 50 || !!s.planCompleted),
  },
  {
    tier: 6,
    tierName: '圓滿階・新耶路撒冷豐盛座',
    stageName: '新耶路撒冷',
    maxSlots: 14,
    nextRequirementText: '已達最高階！14 件屬靈信物全數可陳列！',
    isUnlocked: (s) => s.hasJoinedPlans !== false && (s.totalChaptersRead >= 80 || !!s.planCompleted),
  },
];

export function getSanctuaryMaxSlots(stats: UserStatsCriteria): {
  maxSlots: number;
  currentTier: SanctuaryTierInfo;
  nextTier?: SanctuaryTierInfo;
} {
  if (stats.hasJoinedPlans === false) {
    return {
      maxSlots: SANCTUARY_SLOT_TIERS[0].maxSlots,
      currentTier: SANCTUARY_SLOT_TIERS[0],
      nextTier: SANCTUARY_SLOT_TIERS[1],
    };
  }

  let highest = SANCTUARY_SLOT_TIERS[0];
  let next: SanctuaryTierInfo | undefined = SANCTUARY_SLOT_TIERS[1];

  for (let i = 0; i < SANCTUARY_SLOT_TIERS.length; i++) {
    const tier = SANCTUARY_SLOT_TIERS[i];
    if (tier.isUnlocked(stats)) {
      highest = tier;
      next = SANCTUARY_SLOT_TIERS[i + 1];
    }
  }

  return {
    maxSlots: highest.maxSlots,
    currentTier: highest,
    nextTier: next,
  };
}

export const DEFAULT_SANCTUARY_CONFIG: SanctuaryConfig = {
  placedRelicIds: ['relic-oil-lamp', 'relic-morning-star', 'relic-dove', 'relic-scroll'],
  motto: '直等到天發亮，晨星在你們心裏出現。',
  theme: 'dawn',
};

export const SANCTUARY_THEMES: Record<
  string,
  { label: string; icon: string; bgGradient: string; cardBg: string; border: string; accentColor: string }
> = {
  dawn: {
    label: '清晨破曉',
    icon: '🌅',
    bgGradient: 'from-amber-100/90 via-orange-50/70 to-amber-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800',
    cardBg: 'bg-white/90 dark:bg-slate-800',
    border: 'border-amber-200/80 dark:border-transparent',
    accentColor: 'text-amber-900 dark:text-amber-300',
  },
  night: {
    label: '夜更寧靜',
    icon: '🌌',
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-900 text-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800',
    cardBg: 'bg-indigo-950/70 text-indigo-50 dark:bg-slate-800',
    border: 'border-indigo-700/60 dark:border-transparent',
    accentColor: 'text-amber-300',
  },
  meadow: {
    label: '青草水旁',
    icon: '🌿',
    bgGradient: 'from-emerald-100/80 via-teal-50/70 to-emerald-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800',
    cardBg: 'bg-white/90 dark:bg-slate-800',
    border: 'border-emerald-200/80 dark:border-transparent',
    accentColor: 'text-emerald-900 dark:text-emerald-300',
  },
  temple: {
    label: '聖殿安息',
    icon: '🏛️',
    bgGradient: 'from-stone-200/80 via-amber-50/60 to-stone-100/60 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800',
    cardBg: 'bg-white/90 dark:bg-slate-800',
    border: 'border-stone-300/80 dark:border-transparent',
    accentColor: 'text-stone-800 dark:text-stone-200',
  },
};
