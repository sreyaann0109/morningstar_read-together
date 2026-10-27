/**
 * UTC+8 (Asia/Taipei) 時間標準處理工具
 * 召會晨興與追求時間嚴格以 UTC+8 為基準，確保全天候（特別是清晨 05:00~08:00 晨興時段）日期計算精確不跳日
 */

const UTC8_TIMEZONE = 'Asia/Taipei';

const utc8Formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: UTC8_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * 取得指定時間或當前的 UTC+8 日期字串 (格式: YYYY-MM-DD)
 */
export function getUTC8DateString(date: Date = new Date()): string {
  return utc8Formatter.format(date);
}

/**
 * 將 "YYYY-MM-DD" 字串轉為 UTC+8 零點的毫秒時間戳
 */
export function parseDateToUTC8Ms(dateStr: string): number {
  const cleanStr = (dateStr || '').split('T')[0];
  if (!cleanStr) return Date.now();
  return new Date(`${cleanStr}T00:00:00+08:00`).getTime();
}

/**
 * 計算兩個日期在 UTC+8 日曆上的相差天數 (endDate - startDate)
 */
export function diffDaysUTC8(startStr: string, endStr: string): number {
  const startMs = parseDateToUTC8Ms(startStr);
  const endMs = parseDateToUTC8Ms(endStr);
  return Math.round((endMs - startMs) / 86400000);
}

/**
 * 在給定的 UTC+8 日期字串上增加或減少天數，回傳 "YYYY-MM-DD"
 */
export function addDaysUTC8(dateStr: string, days: number): string {
  const ms = parseDateToUTC8Ms(dateStr) + days * 86400000;
  return getUTC8DateString(new Date(ms));
}

/**
 * 將貼文或通知的時間字串轉為簡潔動態相對時間 (m, h, d, w)
 * 例如: 0m, 1m, 15m, 2h, 3d, 1w
 * 若舊資料無有效時間字串，嘗試自 ID 解析時間戳（如 post-1729864234567）
 */
export function formatRelativeTime(timeStr?: string, entityId?: string): string {
  let timeMs: number | null = null;

  if (timeStr && timeStr !== '剛剛') {
    const parsed = Date.parse(timeStr);
    if (!isNaN(parsed) && parsed > 0) {
      timeMs = parsed;
    }
  }

  // Fallback: 嘗試自 ID 解析時間戳（如 post-1729864234567、c-1729864234567、notif-1729864234567）
  if (!timeMs && entityId) {
    const match = entityId.match(/\d{12,14}/);
    if (match) {
      const parsedNum = parseInt(match[0], 10);
      if (!isNaN(parsedNum) && parsedNum > 1600000000000) {
        timeMs = parsedNum;
      }
    }
  }

  if (!timeMs) {
    return '0m';
  }

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timeMs) / 1000));

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
}

/**
 * 依據真實追求歷史記錄 (dailyHistory) 精確計算連續追求天數 (Streak)
 * 1. 若今日已打卡追求 (dailyHistory[today] > 0)：由今日往前回溯計算連續天數
 * 2. 若今日尚未打卡：檢視昨日是否有追求。若昨日有追求，連續紀錄仍保持（等待今日追求）；若昨日無追求，連續紀錄中斷為 0
 * 嚴格杜絕幽靈天數與未更新卻假造統計，唯有實際追求方納入統計！
 */
export function calculateStreakDaysFromHistory(
  dailyHistory: Record<string, number> | undefined,
  currentDateStr: string = getUTC8DateString()
): number {
  if (!dailyHistory || typeof dailyHistory !== 'object') return 0;

  const todayUnits = dailyHistory[currentDateStr] || 0;
  let streak = 0;
  let checkDateStr = currentDateStr;

  if (todayUnits > 0) {
    while ((dailyHistory[checkDateStr] || 0) > 0) {
      streak++;
      checkDateStr = addDaysUTC8(checkDateStr, -1);
    }
  } else {
    const yesterdayStr = addDaysUTC8(currentDateStr, -1);
    if ((dailyHistory[yesterdayStr] || 0) > 0) {
      checkDateStr = yesterdayStr;
      while ((dailyHistory[checkDateStr] || 0) > 0) {
        streak++;
        checkDateStr = addDaysUTC8(checkDateStr, -1);
      }
    } else {
      streak = 0;
    }
  }

  return streak;
}
