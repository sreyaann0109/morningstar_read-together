import { getUTC8DateString, diffDaysUTC8, addDaysUTC8 } from '../lib/dateUtils';

export interface NTBook {
  name: string;      // 例如：馬太福音
  shortName: string; // 例如：太
  chapters: number;  // 例如：28
}

/**
 * 新約聖經 27 卷書卷名稱、簡稱與章數（共 260 章）
 */
export const NT_BOOKS: NTBook[] = [
  { name: '馬太福音', shortName: '太', chapters: 28 },
  { name: '馬可福音', shortName: '可', chapters: 16 },
  { name: '路加福音', shortName: '路', chapters: 24 },
  { name: '約翰福音', shortName: '約', chapters: 21 },
  { name: '使徒行傳', shortName: '徒', chapters: 28 },
  { name: '羅馬書', shortName: '羅', chapters: 16 },
  { name: '哥林多前書', shortName: '林前', chapters: 16 },
  { name: '哥林多後書', shortName: '林後', chapters: 13 },
  { name: '加拉太書', shortName: '加', chapters: 6 },
  { name: '以弗所書', shortName: '弗', chapters: 6 },
  { name: '腓立比書', shortName: '腓', chapters: 4 },
  { name: '歌羅西書', shortName: '西', chapters: 4 },
  { name: '帖撒羅尼迦前書', shortName: '帖前', chapters: 5 },
  { name: '帖撒羅尼迦後書', shortName: '帖後', chapters: 3 },
  { name: '提摩太前書', shortName: '提前', chapters: 6 },
  { name: '提摩太後書', shortName: '提後', chapters: 4 },
  { name: '提多書', shortName: '多', chapters: 3 },
  { name: '腓利門書', shortName: '門', chapters: 1 },
  { name: '希伯來書', shortName: '來', chapters: 13 },
  { name: '雅各書', shortName: '雅', chapters: 5 },
  { name: '彼得前書', shortName: '彼前', chapters: 5 },
  { name: '彼得後書', shortName: '彼後', chapters: 3 },
  { name: '約翰一書', shortName: '約一', chapters: 5 },
  { name: '約翰二書', shortName: '約二', chapters: 1 },
  { name: '約翰三書', shortName: '約三', chapters: 1 },
  { name: '猶大書', shortName: '猶', chapters: 1 },
  { name: '啟示錄', shortName: '啟', chapters: 22 },
];

export const TOTAL_NT_CHAPTERS = 260;
export const TOTAL_NT_DAYS = 130; // 每天 2 章，130 天剛好讀完新約一遍（約半年）

export interface ChapterLocation {
  globalChapter: number; // 1 ~ 260
  bookName: string;      // 例如：馬太福音
  bookShortName: string; // 例如：太
  chapterInBook: number; // 例如：1
  displayText: string;   // 例如：馬太福音 第 1 章
}

/**
 * 依累計章數（1 ~ 260）獲取對應的書卷與章節位置
 */
export function getNTChapterLocation(globalChapter: number): ChapterLocation {
  const clamped = Math.max(1, Math.min(TOTAL_NT_CHAPTERS, globalChapter));
  let accumulated = 0;

  for (const book of NT_BOOKS) {
    if (clamped <= accumulated + book.chapters) {
      const chapterInBook = clamped - accumulated;
      return {
        globalChapter: clamped,
        bookName: book.name,
        bookShortName: book.shortName,
        chapterInBook,
        displayText: `${book.name} 第 ${chapterInBook} 章`,
      };
    }
    accumulated += book.chapters;
  }

  // Fallback to Revelation 22
  const lastBook = NT_BOOKS[NT_BOOKS.length - 1];
  return {
    globalChapter: TOTAL_NT_CHAPTERS,
    bookName: lastBook.name,
    bookShortName: lastBook.shortName,
    chapterInBook: lastBook.chapters,
    displayText: `${lastBook.name} 第 ${lastBook.chapters} 章`,
  };
}

export interface NTDaySchedule {
  dayNumber: number;          // 1 ~ 130
  startChapter: number;       // 全書章數起點 (1 ~ 260)
  endChapter: number;         // 全書章數終點 (1 ~ 260)
  displayText: string;        // 例如：「馬太福音 第 1 ～ 2 章」或跨卷「約翰福音 第 21 章、使徒行傳 第 1 章」
  shortDisplayText: string;   // 例如：「太 1~2」或「約 21、徒 1」
  startLocation: ChapterLocation;
  endLocation: ChapterLocation;
}

/**
 * 取得特定天數（第 1 ~ 130 天）之進度
 */
export function getNTDaySchedule(dayNumber: number): NTDaySchedule {
  const clampedDay = Math.max(1, Math.min(TOTAL_NT_DAYS, dayNumber));
  const startChapter = (clampedDay - 1) * 2 + 1;
  const endChapter = Math.min(TOTAL_NT_CHAPTERS, clampedDay * 2);

  const startLoc = getNTChapterLocation(startChapter);
  const endLoc = getNTChapterLocation(endChapter);

  let displayText: string;
  let shortDisplayText: string;

  if (startLoc.bookName === endLoc.bookName) {
    if (startLoc.chapterInBook === endLoc.chapterInBook) {
      displayText = `${startLoc.bookName} 第 ${startLoc.chapterInBook} 章`;
      shortDisplayText = `${startLoc.bookShortName} ${startLoc.chapterInBook}`;
    } else {
      displayText = `${startLoc.bookName} 第 ${startLoc.chapterInBook} ～ ${endLoc.chapterInBook} 章`;
      shortDisplayText = `${startLoc.bookShortName} ${startLoc.chapterInBook}~${endLoc.chapterInBook}`;
    }
  } else {
    displayText = `${startLoc.bookName} 第 ${startLoc.chapterInBook} 章、${endLoc.bookName} 第 ${endLoc.chapterInBook} 章`;
    shortDisplayText = `${startLoc.bookShortName} ${startLoc.chapterInBook}、${endLoc.bookShortName} ${endLoc.chapterInBook}`;
  }

  return {
    dayNumber: clampedDay,
    startChapter,
    endChapter,
    displayText,
    shortDisplayText,
    startLocation: startLoc,
    endLocation: endLoc,
  };
}

/**
 * 依已完成章數（completedChapters）計算當前所屬天數與今日待讀進度
 */
export function getTodayNTSchedule(completedChapters: number): {
  dayNumber: number;
  isAllCompleted: boolean;
  schedule: NTDaySchedule;
  remainingChapters: number;
} {
  const isAllCompleted = completedChapters >= TOTAL_NT_CHAPTERS;
  const currentChapter = Math.min(TOTAL_NT_CHAPTERS, completedChapters + 1);
  const dayNumber = Math.min(TOTAL_NT_DAYS, Math.floor((currentChapter - 1) / 2) + 1);
  const schedule = getNTDaySchedule(dayNumber);

  return {
    dayNumber,
    isAllCompleted,
    schedule,
    remainingChapters: Math.max(0, TOTAL_NT_CHAPTERS - completedChapters),
  };
}

/**
 * 預先生成全 130 天之完整讀經對照表
 */
export const FULL_130_DAYS_SCHEDULE: NTDaySchedule[] = Array.from(
  { length: TOTAL_NT_DAYS },
  (_, idx) => getNTDaySchedule(idx + 1)
);

/**
 * 新約速讀 (NT Speed Reading) 期程進度與遍數計算結構
 */
export interface NTSpeedPaceInfo {
  currentRound: number;              // 目前正在追求第幾遍 (從 1 開始)
  completedRounds: number;           // 已完整讀完幾遍
  currentRoundUnits: number;         // 當前這遍已讀章數 (0 ~ 260)
  currentLocation: ChapterLocation;  // 當前讀到的書卷章節
  speedDays: number;                 // 目標幾天讀完一遍 (自選節奏，例如 30, 60, 90 天)
  totalDays: number;                 // 整期追求設定總天數 (由開始至結束時間決定)
  daysElapsed: number;               // 開始迄今經過天數
  daysRemaining: number;             // 距結束時間剩餘天數
  targetTotalRounds: number;         // 在此追求期程內預計可完成總遍數
  dailyTargetChapters: number;       // 每日目標章數 (由 260 / speedDays 計算，例如 8.7 章/天)
  expectedChaptersToday: number;     // 截至今日預期應讀章數 (1 ~ 260)
  expectedLocation: ChapterLocation; // 預期應讀到的書卷章節
  paceDelta: number;                 // 實際章數 - 預期章數 (正值代表超前，負值代表落後)
  paceStatus: 'ahead' | 'on-track' | 'behind';
  statusMessage: string;
}

/**
 * 計算新約速讀的即時進度、遍數與趕上提醒（支援一讀再讀，目標幾天一遍與總期程脫鉤）
 */
export function calculateNTSpeedPace(
  startDateStr?: string,
  endDateStr?: string,
  completedUnits: number = 0,
  speedDaysParam?: number
): NTSpeedPaceInfo {
  const currentRound = Math.floor(completedUnits / TOTAL_NT_CHAPTERS) + 1;
  const completedRounds = Math.floor(completedUnits / TOTAL_NT_CHAPTERS);
  const currentRoundUnits = completedUnits % TOTAL_NT_CHAPTERS;
  const nextChapter = Math.min(TOTAL_NT_CHAPTERS, currentRoundUnits + 1);
  const currentLocation = getNTChapterLocation(nextChapter);

  // Date calculations in UTC+8
  const todayStr = getUTC8DateString();
  const startStr = (startDateStr || todayStr).split('T')[0];
  const endStr = (endDateStr || addDaysUTC8(startStr, 60)).split('T')[0];

  // 整期追求總天數 (由 startDate 到 endDate 決定，不可被覆蓋)
  const totalDays = Math.max(1, diffDaysUTC8(startStr, endStr) + 1);
  const rawElapsed = diffDaysUTC8(startStr, todayStr) + 1;
  const daysElapsed = Math.max(1, Math.min(totalDays, rawElapsed));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // 目標幾天讀完一遍 (預設 60 天，或由使用者自選 30/60/90 天)
  const speedDays = speedDaysParam && speedDaysParam > 0 ? speedDaysParam : 60;
  const dailyTargetChapters = Math.round((TOTAL_NT_CHAPTERS / speedDays) * 10) / 10;
  const targetTotalRounds = Math.max(1, Math.round((totalDays / speedDays) * 10) / 10);

  // 累計預期章數與落後/超前差距 (支援跨遍累計)
  const totalExpectedChapters = Math.ceil(dailyTargetChapters * daysElapsed);
  const expectedRoundUnits = ((totalExpectedChapters - 1) % TOTAL_NT_CHAPTERS) + 1;
  const expectedLocation = getNTChapterLocation(expectedRoundUnits);

  const paceDelta = completedUnits - totalExpectedChapters;
  let paceStatus: 'ahead' | 'on-track' | 'behind' = 'on-track';
  let statusMessage = '';

  const dailyTargetInt = Math.max(2, Math.ceil(dailyTargetChapters));
  if (paceDelta > 2) {
    paceStatus = 'ahead';
    statusMessage = `🔥 進度超前 ${paceDelta} 章！已讀至第 ${currentRound} 遍【${currentLocation.displayText}】（累計已完成 ${completedRounds} 遍全書），感謝主跑在時間前面！`;
  } else if (paceDelta < -dailyTargetInt) {
    paceStatus = 'behind';
    statusMessage = `⚠️ 落後預定進度 ${Math.abs(paceDelta)} 章！今日目標應讀至【${expectedLocation.displayText}】（第 ${Math.floor(totalExpectedChapters / TOTAL_NT_CHAPTERS) + 1} 遍），建議今日補讀以跟上每 ${speedDays} 天一遍的節奏！`;
  } else {
    paceStatus = 'on-track';
    statusMessage = `✨ 穩健跟上今日進度！目前第 ${currentRound} 遍追求中，今日目標約讀至【${expectedLocation.displayText}】，靈裡剛強齊步前行！`;
  }

  return {
    currentRound,
    completedRounds,
    currentRoundUnits,
    currentLocation,
    speedDays,
    totalDays,
    daysElapsed,
    daysRemaining,
    targetTotalRounds,
    dailyTargetChapters,
    expectedChaptersToday: expectedRoundUnits,
    expectedLocation,
    paceDelta,
    paceStatus,
    statusMessage,
  };
}

/**
 * 半年新約讀經一遍 (NT Half-Year 130 Days) 期程進度與追進度結構
 */
export interface NTHalfYearPaceInfo {
  totalDays: number;                 // 130 天
  totalChapters: number;             // 260 章
  daysElapsed: number;               // 開始迄今經過天數 (1 ~ 130)
  daysRemaining: number;             // 剩餘天數
  expectedDayToday: number;          // 今日對應進度天數 (1 ~ 130)
  expectedChaptersToday: number;     // 截至今日累計應讀完章數 (2 ~ 260)
  expectedSchedule: NTDaySchedule;   // 今日表定進度 (例如 第 1 天: 馬太福音 1~2 章)
  completedChapters: number;         // 實際已讀章數
  currentLocation: ChapterLocation;  // 當前讀到的書卷章節
  paceDelta: number;                 // 實際章數 - 預期章數 (負值為落後，正值為超前)
  paceStatus: 'ahead' | 'on-track' | 'behind';
  behindDays: number;                // 落後天數 (若落後)
  behindChapters: number;            // 落後章數 (若落後)
  statusMessage: string;
}

/**
 * 計算半年新約讀經一遍的期程進度與追進度資訊
 */
export function calculateNTHalfYearPace(
  startDateStr?: string,
  completedUnits: number = 0
): NTHalfYearPaceInfo {
  const completedChapters = Math.min(TOTAL_NT_CHAPTERS, Math.max(0, completedUnits));
  const nextChapter = Math.min(TOTAL_NT_CHAPTERS, completedChapters + 1);
  const currentLocation = getNTChapterLocation(nextChapter);

  // Date calculations in UTC+8
  const todayStr = getUTC8DateString();
  const startStr = (startDateStr || todayStr).split('T')[0];

  // If start is in the future, daysElapsed is clamped to 1
  const daysDiff = diffDaysUTC8(startStr, todayStr) + 1;
  const daysElapsed = Math.max(1, Math.min(TOTAL_NT_DAYS, daysDiff));
  const daysRemaining = Math.max(0, TOTAL_NT_DAYS - daysElapsed);

  const expectedDayToday = daysElapsed;
  const expectedChaptersToday = Math.min(TOTAL_NT_CHAPTERS, expectedDayToday * 2);
  const expectedSchedule = getNTDaySchedule(expectedDayToday);

  // paceDelta: 實際已讀章數 - 今日應讀章數
  const paceDelta = completedChapters - expectedChaptersToday;
  let paceStatus: 'ahead' | 'on-track' | 'behind' = 'on-track';
  let behindDays = 0;
  let behindChapters = 0;
  let statusMessage = '';

  if (paceDelta > 0) {
    paceStatus = 'ahead';
    statusMessage = `🔥 進度超前 ${paceDelta} 章！已讀至【${currentLocation.displayText}】（今日為第 ${expectedDayToday} 天：目標應至第 ${expectedChaptersToday} 章【${expectedSchedule.shortDisplayText}】），感謝主恩典豐厚！`;
  } else if (paceDelta < -2) {
    paceStatus = 'behind';
    behindChapters = Math.abs(paceDelta);
    behindDays = Math.ceil(behindChapters / 2);
    statusMessage = `⚠️ 落後預定進度 ${behindChapters} 章（約 ${behindDays} 天進度）！今日為第 ${expectedDayToday} 天，進度應讀至第 ${expectedChaptersToday} 章【${expectedSchedule.shortDisplayText}】，建議把握時間追進度！`;
  } else {
    paceStatus = 'on-track';
    statusMessage = `✨ 穩健跟上今日進度！今日（第 ${expectedDayToday} 天）指定進度為【${expectedSchedule.displayText}】，靈裡剛強齊步前行！`;
  }

  return {
    totalDays: TOTAL_NT_DAYS,
    totalChapters: TOTAL_NT_CHAPTERS,
    daysElapsed,
    daysRemaining,
    expectedDayToday,
    expectedChaptersToday,
    expectedSchedule,
    completedChapters,
    currentLocation,
    paceDelta,
    paceStatus,
    behindDays,
    behindChapters,
    statusMessage,
  };
}


