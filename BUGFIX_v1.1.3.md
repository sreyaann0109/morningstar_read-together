# 晨星共行 Bug 修正與功能發布紀錄 (v1.1.3)

**發布日期**：2026-10-28  
**版本號**：`v1.1.3`  
**核心主旨**：Google 帳號快速登入整合、幽靈連勝統計修復、Supabase 使用者防誤刪保護、追求地圖與七天紀錄跨裝置雲端同步。

---

## 📋 修正問題清單 (Bug Fixes & Enhancements)

### 1. 整合 Google 帳號快速登入 (Google Identity Services / OAuth 2.0)
* **問題描述**：使用者期望可以使用既有的 Google / Gmail 帳號直接登入，免去記憶額外密碼之不便。
* **解決方案**：
  * 於 `.env.local` 與 `.env.example` 配置 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（`1021252042341-arg3f5db6tbm6virngfmkk2i4dpipe7g.apps.googleusercontent.com`）。
  * 於 [`LoginPage.tsx`](src/components/LoginPage.tsx) 引入 Google Identity Services (GIS) 客戶端腳本，使用 `google.accounts.id.initialize` 與 `google.accounts.id.renderButton` 實裝標準 Google 登入按鈕。
  * 實裝 JWT Payload 解碼器，取得使用者的 Google Email、姓名與大頭貼。
  * **帳號安全融合機制**：若資料庫已存在相同 Email 之聖徒，自動保留原先的角色（Admin/User）、神聖帳幕佈置（Sanctuary）、追求計畫與歷史紀錄，完成無縫對接；若為初次登入的新聖徒，則自動建立個人檔案並同步寫入 Supabase PostgreSQL 雲端資料庫。

---

### 2. 根除「未每日更新卻統計有進度」之幽靈連勝與假資料
* **問題描述**：部分使用者反應明明沒有每日打卡更新進度，追求統計面板卻顯示「已連續追求 X 天」，且追求地圖出現非真實的點數。
* **原因剖析**：
  * 早期開發時，`loadUserDailyHistory` 在本機尚無歷史紀錄時，自動合成了預設值 `initialHistory[dateStr] = i === 0 ? 2 : (i % 3 === 0 ? 3 : 2)` 作為展示假資料。
  * 舊版連續天數算法未嚴格校驗日期連續性，在非連續日期下仍誤判為連續追求。
* **解決方案**：
  * 徹底移除 `loadUserDailyHistory` 中的虛構資料生成邏輯，無打卡紀錄即為空物件 `{}`，回歸 100% 真實資料。
  * 於 [`src/lib/dateUtils.ts`](src/lib/dateUtils.ts) 重構 `calculateStreakDaysFromHistory` 演算法：
    - 嚴格採用**台北時間（UTC+8）**為基準。
    - 自今日或昨日開始，逐日往前回溯檢查每日追求篇數是否大於 0。一旦中斷立即停止計算，杜絕虛報。
  * 追求卡片與神聖帳幕之「今日已完成（`todayCompleted`）」嚴格比對台北時間 `lastCompletedDate === currentUtc8Date`，未打卡者絕不點亮或計算已完成。

---

### 3. 修復 Supabase `supabaseSaveUsers` 誤刪其他聖徒資料之重大風險
* **問題描述**：在多裝置或不同聖徒登入時，資料庫其他聖徒帳號與進度偶發性遺失。
* **原因剖析**：
  * 在 [`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts) 中的 `supabaseSaveUsers` 函式，`fullSync` 參數預設為 `true`。
  * 當系統僅儲存當前登入者或部分使用者名單時，觸發了 `.delete().not('id', 'in', ...)`，將不在該次清單中的雲端聖徒全部從資料庫中刪除！
* **解決方案**：
  * 將 `fullSync` 的預設值修正為安全的 `false`。
  * 僅執行 `upsert` 操作，僅在顯式傳入 `fullSync = true`（例如完整的管理員全量同步）時才進行差異修剪，徹底杜絕任何單人儲存誤刪其他聖徒之風險。

---

### 4. 修復追求地圖與「最近七天紀錄」未連線同步與顯示 0 之 Bug
* **問題描述**：使用者開啟「追求統計」彈窗時，「最近七天紀錄」全部顯示 0 或未反映雲端資料庫的完成狀態；追求地圖跨裝置時未同步。
* **原因剖析**：
  * [`StatsModal.tsx`](src/components/StatsModal.tsx) 內部讀取 `user.dailyHistory`，但在使用者登入或切換時，該物件未即時綁定於 `user` 狀態中，且彈窗未接收主頁面的 `dailyPursuitHistory` 狀態，導致 fallback 為空物件。
  * 主頁面在初次加載與雲端輪詢時，遠端與本機歷史紀錄僅以單向賦值處理，且未將各追求計畫中成員的打卡完成時間（`member.lastCompletedDate`）回填彙整。
* **解決方案**：
  * 於 [`StatsModal.tsx`](src/components/StatsModal.tsx) 新增 `dailyHistory?: Record<string, number>` 屬性，內部計算統一採用 `effectiveDailyHistory = dailyHistory || user.dailyHistory || {}`，確保任何途徑皆能讀取權威歷史。
  * 在 [`src/app/page.tsx`](src/app/page.tsx) 傳遞 `dailyHistory={dailyPursuitHistory}` 給 `<StatsModal />`。
  * 在初次掛載解析時，立即同步賦值 `activeProfile.dailyHistory = loadedDailyHistory`，使 `user` 狀態在第一時間即完整具備歷史紀錄。
  * 於初次抓取與 2.5 秒輪詢中，採用三方深度聚合合併：
    - `remote.dailyHistory`（雲端資料庫儲存之每日追求紀錄）
    - `currentUser.dailyHistory`（本機即時打卡快取）
    - `plan.members[].lastCompletedDate`（各追求計畫中已打卡完成之真實日期）
    - 合併後統一存回 `authoritativeDailyHistory` 並同步寫入 Supabase，確保跨裝置、跨使用者皆能 100% 即時呈現完整追求地圖與七天紀錄。

---

## 📂 變更檔案清單

| 檔案路徑 | 變更類型 | 說明 |
| :--- | :---: | :--- |
| `package.json` | 修改 | 版本號遞增至 `1.1.3` |
| `src/app/page.tsx` | 修改 | 清理假資料生成、聚合雲端打卡歷史、向 StatsModal 傳遞 dailyHistory |
| `src/components/LoginPage.tsx` | 修改 | 整合 Google Identity Services 快速登入按鈕與帳號融合邏輯 |
| `src/components/StatsModal.tsx` | 修改 | 接收外部 dailyHistory 屬性，正確顯示七天柱狀圖與篇數統計 |
| `src/components/SanctuaryCard.tsx` | 修改 | 今日完成判斷嚴格綁定 UTC+8 台北時間 |
| `src/lib/dateUtils.ts` | 修改 | 重構嚴格連勝天數回溯演算法 |
| `src/lib/supabaseDb.ts` | 修改 | `supabaseSaveUsers` 預設 `fullSync = false` 防止誤刪雲端使用者 |
| `spec.md` | 修改 | 更新系統規格書 v1.1.3 版本條目 |
| `BUGFIX_v1.1.3.md` | 新增 | 本修復日誌說明文件 |

---

## 🔍 驗證結果

1. **TypeScript 類型檢查**：`npx tsc --noEmit` 通過，零錯誤。
2. **Next.js 伺服器運作**：`GET /api/data` 與 `POST /api/users` 均穩定回應 `200 OK`。
3. **Google 登入測試**：GIS Client ID 正常掛載，按鈕正常渲染。
4. **連勝統計與地圖比對**：歷史紀錄無虛構資料，台北時間當日完成即時反映。
