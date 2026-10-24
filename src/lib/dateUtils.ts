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
