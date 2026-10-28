# 《晨星共行 Morning Star Companions》Bug 修復與防護日誌 (BUGFIX.md)

> [!IMPORTANT]
> **Bug 處理與查詢標準作業規範 (Bug Triage & Resolution Protocol)**：
> 1. **發現 Bug 優先查閱**：當使用者或工程開發發現任何 Bug 時，**AI 助手與工程人員必須優先檢索並查閱本檔案**，確認是否為已知問題、過去是否有類似根因、以及相關模組既有的安全防護架構，嚴禁盲目修改而破壞既有防護機制。
> 2. **修復完成即時登錄**：任何 Bug 一旦修復驗證通過，**必須立即將問題描述、根因剖析、架構級修復方案、變更檔案清單與驗證步驟完整寫入本檔案**，保持紀錄之完整與可追溯性。

---

## 🗂️ 修復歷程目錄 (Table of Contents)

* [v1.1.3 修復紀錄 (2026-10-28)](#v113-修復紀錄-2026-10-28)
  * [1. Google 帳號快速登入與自動帳號融合](#1-google-帳號快速登入與自動帳號融合)
  * [2. 根除「未每日更新卻統計有進度」之幽靈連勝與假資料](#2-根除未每日更新卻統計有進度之幽靈連勝與假資料)
  * [3. 修復 Supabase `supabaseSaveUsers` 誤刪其他聖徒資料之連鎖風險](#3-修復-supabase-supabasesaveusers-誤刪其他聖徒資料之連鎖風險)
  * [4. 修復追求地圖與「最近七天紀錄」跨裝置雲端連線同步顯示 0 之問題](#4-修復追求地圖與最近七天紀錄跨裝置雲端連線同步顯示-0-之問題)
  * [5. 本機開發伺服器快取衝突導致 localhost 卡死 (Dev Server Chunk 404)](#5-本機開發伺服器快取衝突導致-localhost-卡死-dev-server-chunk-404)
  * [6. 新 Google 帳號首次登入觸發 Client-side Exception (removeChild NotFoundError)](#6-新-google-帳號首次登入觸發-client-side-exception-removechild-notfounderror)
  * [7. 管理員刪除人員即時跨裝置強制登出機制 (Real-time Forced Logout on User Deletion)](#7-管理員刪除人員即時跨裝置強制登出機制-real-time-forced-logout-on-user-deletion)
  * [8. 全面校正追求統計「虛增加一 (+1)」之邏輯偏差與跨日殘留問題](#8-全面校正追求統計虛增加一-1之邏輯偏差與跨日殘留問題)
  * [9. 實裝追求主題獨立每日閱讀歷史 (Theme-Isolated Daily History) 與即時統計基準](#9-實裝追求主題獨立每日閱讀歷史-theme-isolated-daily-history-與即時統計基準)
  * [10. 重設進度未徹底清空雲端每日歷史與主題歷程導致統計殘留](#10-重設進度未徹底清空雲端每日歷史與主題歷程導致統計殘留)
  * [11. 移除忘記密碼與臨時密碼文案中之字數/位數標記 (Generic Auth Copy Refinement)](#11-移除忘記密碼與臨時密碼文案中之字數/位數標記-generic-auth-copy-refinement)
  * [12. 管理員撤銷重設密碼申請與原密碼安全還原機制 (Admin Revoke Password Reset & Reversion)](#12-管理員撤銷重設密碼申請與原密碼安全還原機制-admin-revoke-password-reset--reversion)
* [v1.1.2 修復紀錄 (2026-10-26)](#v112-修復紀錄-2026-10-26)
  * [1. 追求帳幕自訂佈置零回溯雲端持久化 (五重架構級安全防護)](#1-追求帳幕自訂佈置零回溯雲端持久化-五重架構級安全防護)
* [v1.1.1 修復紀錄 (2026-10-25)](#v111-修復紀錄-2026-10-25)
  * [1. 全站浮動彈窗背景滾動穿透 (Body Scroll Lock)](#1-全站浮動彈窗背景滾動穿透-body-scroll-lock)
  * [2. 手機端導覽列提醒浮空彈窗右對齊與位置偏移修正](#2-手機端導覽列提醒浮空彈窗右對齊與位置偏移修正)
  * [3. 動態發文相對時間 mhdw 與排程重繪](#3-動態發文相對時間-mhdw-與排程重繪)
  * [4. 「多讀一天」0 進度防呆與跨日自動重設](#4-多讀一天-0-進度防呆與跨日自動重設)

---

## v1.1.3 修復紀錄 (2026-10-28)

### 1. Google 帳號快速登入與自動帳號融合
* **問題描述**：使用者期望可以使用既有的 Google / Gmail 帳號直接登入，免去記憶額外密碼之不便。
* **原因剖析**：原系統僅支援 Email + 加鹽密碼登入機制，未配置第三方 OAuth 身分驗證。
* **解決方案**：
  * 於 `.env.local` 與 `.env.example` 配置 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（`1021252042341-arg3f5db6tbm6virngfmkk2i4dpipe7g.apps.googleusercontent.com`）。
  * 於 [`src/components/LoginPage.tsx`](src/components/LoginPage.tsx) 引入 Google Identity Services (GIS) 客戶端，使用 `google.accounts.id.initialize` 與 `renderButton` 實裝標準 Google 登入。
  * 實裝 JWT Payload 解碼器解析使用者之 Email、姓名與大頭貼。
  * **帳號安全融合機制**：若資料庫已存在相同 Email 之聖徒，自動保留原先的角色（Admin/User）、追求帳幕（Sanctuary）、追求計畫與歷史紀錄，完成無縫對接；若為初次登入的新聖徒，則自動建立個人檔案並寫入 Supabase PostgreSQL。
* **影響檔案**：[`src/components/LoginPage.tsx`](src/components/LoginPage.tsx), `.env.local`, `.env.example`

### 2. 根除「未每日更新卻統計有進度」之幽靈連勝與假資料
* **問題描述**：部分使用者反應明明沒有每日打卡更新進度，追求統計面板卻顯示「已連續追求 X 天」，且追求地圖出現非真實的點數。
* **原因剖析**：
  * 早期開發時，`loadUserDailyHistory` 在本機尚無歷史紀錄時，自動合成了預設值 `initialHistory[dateStr] = i === 0 ? 2 : (i % 3 === 0 ? 3 : 2)` 作為展示假資料。
  * 舊版連續天數演算法未嚴格校驗日期連續性，在非連續日期下仍誤判為連續追求。
* **解決方案**：
  * 徹底移除 `loadUserDailyHistory` 中的虛構資料生成邏輯，無打卡紀錄即為空物件 `{}`，回歸 100% 真實資料。
  * 於 [`src/lib/dateUtils.ts`](src/lib/dateUtils.ts) 重構 `calculateStreakDaysFromHistory` 演算法：
    - 嚴格採用**台北時間（UTC+8）**為基準。
    - 自今日或昨日開始，逐日往前回溯檢查每日追求篇數是否大於 0。一旦中斷立即停止計算，杜絕虛報。
  * 追求卡片與神聖帳幕之「今日已完成（`todayCompleted`）」嚴格比對台北時間 `lastCompletedDate === currentUtc8Date`，未打卡者絕不點亮或計算已完成。
* **影響檔案**：[`src/app/page.tsx`](src/app/page.tsx), [`src/lib/dateUtils.ts`](src/lib/dateUtils.ts), [`src/components/SanctuaryCard.tsx`](src/components/SanctuaryCard.tsx)

### 3. 修復 Supabase `supabaseSaveUsers` 誤刪其他聖徒資料之連鎖風險
* **問題描述**：在多裝置或不同聖徒登入時，資料庫中其他聖徒帳號與進度偶發性遺失。
* **原因剖析**：
  * 在 [`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts) 中的 `supabaseSaveUsers` 函式，`fullSync` 參數預設為 `true`。
  * 當系統僅儲存當前登入者或部分使用者名單時，觸發了 `.delete().not('id', 'in', ...)`，將不在該次清單中的雲端聖徒全部從資料庫中刪除！
* **解決方案**：
  * 將 `fullSync` 的預設值修正為安全的 `false`。
  * 僅執行安全 `upsert` 操作，僅在顯式傳入 `fullSync = true`（例如完整的管理員全量同步）時才進行差異修剪，徹底杜絕任何單人儲存誤刪其他聖徒之風險。
* **影響檔案**：[`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts)

### 4. 修復追求地圖與「最近七天紀錄」跨裝置雲端連線同步顯示 0 之問題
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
* **影響檔案**：[`src/components/StatsModal.tsx`](src/components/StatsModal.tsx), [`src/app/page.tsx`](src/app/page.tsx)

### 5. 本機開發伺服器快取衝突導致 localhost 卡死 (Dev Server Chunk 404)
* **問題描述**：使用者在瀏覽器訪問 `http://localhost:3000` 時頁面卡住、白屏無回應。
* **原因剖析**：
  * 先前為驗證發布版本執行了 `npm run build`，生產建置重構覆寫了 `.next` 快取目錄，導致背景常駐運行的 `next dev` 開發伺服器找不到先前的開發版 chunks（前端請求 `app/page.js`、`main-app.js` 全數傳回 404），進而導致 dev 行程崩潰中斷退出。
* **解決方案**：
  * 清除殘留快取 `rm -rf .next`。
  * 重新以常態背景守護模式（`BypassSandbox: true`，確保 Supabase 雲端網路通暢）啟動 `next dev`。
  * 經驗證 `GET /api/data` 立即回復 `200 OK`，雲端資料庫連線與熱載入恢復正常。
* **防護守則**：執行 `npm run build` 進行生產驗證時，若本機有 `next dev` 在運行，完成後應即時重啟 dev 伺服器並清理 `.next` 快取。
* **影響檔案**：運行環境與建置腳本

### 6. 新 Google 帳號首次登入觸發 Client-side Exception (removeChild NotFoundError)
* **問題描述**：使用者使用新 Google 帳號登入時，畫面拋出 `Unhandled Runtime Error: NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.` 崩潰白屏，但手動重新整理頁面後即可正常運作。
* **原因剖析**：
  1. **React 虛擬 DOM 與第三方 Google GIS DOM 竄改衝突（根本病因）**：
     - 在 `LoginPage` 中，原先 JSX 寫法為 `{isGoogleLoading ? <Loader /> : <div id="googleSignInBtn"><button>...</button></div>}`。
     - Google Identity Services 載入時執行 `btnElement.innerHTML = ''`，在 React 背後強行清空了 `<button>` 子節點並塞入 Google iframe。
     - 當登入中 `isGoogleLoading` 切換為 `true` 或登入成功組件卸載時，React 試圖遍歷並卸載虛擬 DOM 中記憶的 `<button>` 節點，調用 `parentNode.removeChild(buttonNode)`；但該節點早被 Google GIS 抹除，導致瀏覽器原生拋出 `NotFoundError: The node to be removed is not a child of this node` 致命錯誤。
  2. **`googleSignInBtn` DOM ID 重複衝突**：
     - 登入（Login）與註冊（Register）表單同時宣告了同名的 `id="googleSignInBtn"`，導致 `document.getElementById` 指向錯亂。
  3. **`allUsers` 變更連鎖觸發按鈕在回調中重複初始化**：
     - 新使用者註冊更新 `allUsers` 時，觸發了依賴 `allUsers` 的 `useEffect` 重複執行 `renderButton`，破壞了進行中的回調。
* **解決方案**：
  * **非侵入式純淨容器與浮層載入器 (Non-Intrusive Container Pattern)**：
    - 將 Google 按鈕容器純化為空 `<div id="googleSignInBtn" className="w-full flex justify-center" />`，JSX 內部絕不放任何 React 子節點，讓 React 虛擬 DOM 永遠視其為空節點，徹底阻斷 React `removeChild` 衝突。
    - 載入狀態改用絕對定位覆蓋浮層（`absolute inset-0 z-10`），杜絕條件式卸載 DOM。
  * **獨立分離 DOM ID**：
    - 登入表單使用 `googleSignInBtn`，註冊表單使用 `googleSignUpBtn`，依模式精確渲染。
  * **解耦 GIS 渲染依賴**：
    - 改用 `allUsersRef = useRef(allUsers)`，將初始化 `useEffect` 依賴純化為 `[mode]`。
  * **非同步生命週期緩衝**：
    - 將 `onLoginSuccess` 移入 `setTimeout(..., 100)` 微任務緩衝，確保 Google GIS 腳本於底層乾淨結束 postMessage 回調結算後，React 才進行視圖切換與組件卸載。
* **影響檔案**：[`src/components/LoginPage.tsx`](src/components/LoginPage.tsx)

### 7. 管理員刪除人員即時跨裝置強制登出機制 (Real-time Forced Logout on User Deletion)
* **問題描述**：管理員在控制台刪除某位聖徒或 Google 帳號後，該人員在其自己的裝置（手機或不同瀏覽器）上仍保持已登入狀態，甚至定時輪詢會將已刪除帳號再次同步回雲端。
* **原因剖析**：
  * 原先定時輪詢與掛載拉取雲端資料時，僅在雲端找到該使用者時進行合併更新；若雲端已無該使用者紀錄（已被刪除），系統未作任何判斷，導致被刪除的使用者裝置繼續使用本地 `localStorage` 與 `sessionStorage` 的過期憑證。
* **解決方案**：
  * **主動校驗雲端留存狀態**：於初次掛載（Mount Fetch）及每 3.5 秒定時輪詢中，校驗當前已登入之 `currentUid` 與 `currentEmail` 是否仍存在於 Supabase 雲端資料庫 `backendData.users` 中。
  * **立即強制登出 (Forced Logout)**：
    - 一旦確認雲端已無該使用者紀錄，立即調用 `triggerForcedLogout()`。
    - 徹底銷毀其 `sessionStorage`、`localStorage` 中的 `profile`、`joined_plans`、`completed_today`、`daily_units_history`、`sanctuary` 與 `plan_sanctuaries` 快取。
    - 強制關閉全站所有開啟中的浮動彈窗，重置身分為 `defaultUser`，切換 `isLoggedIn = false` 退回登入畫面。
    - 彈出溫馨提示：`⚠️ 您的帳號已被管理同工移除，系統已為您安全登出。`
  * **跨分頁即時聯動監聽**：加入 `window.addEventListener('storage')` 監聽 `morningstar_is_logged_in`，同裝置多分頁即刻同步登出。
* **影響檔案**：[`src/app/page.tsx`](src/app/page.tsx)

### 8. 全面校正追求統計「虛增加一 (+1)」之邏輯偏差與跨日殘留問題
* **問題描述**：使用者回報追求統計數字出現非預期的「自動加一」或數據虛高現象。
* **原因剖析與盤查**：
  1. **常規專題追求進度標籤混淆已完成與下一篇目**：
     - 在 [`TodayPursuitCard.tsx`](src/components/TodayPursuitCard.tsx)、[`ThemesDrawer.tsx`](src/components/ThemesDrawer.tsx) 與 [`PlanSelectorModal.tsx`](src/components/PlanSelectorModal.tsx) 中，常規追求主題的當前進度顯示原先寫為 `Math.min(plan.completedUnits + 1, plan.totalUnits)`。
     - 當聖徒剛加入、已完成篇數為 0 時，進度條顯示 `0%`，上方標籤卻寫為「第 1 篇 / 共 12 篇」；當聖徒讀完第 1 篇打卡後（`completedUnits = 1`），標籤赫然跳成「第 2 篇 / 共 12 篇 (8%)」，導致進度顯示始終比實際已讀篇數多加了 1。
  2. **管理員後台統計未校驗打卡日期造成跨日累加**：
     - 在 [`AdminPanel.tsx`](src/components/AdminPanel.tsx) 中，計算「今日已追求完成總人次」、主題完成人次與聖徒列表完成狀態時，直接使用布林值 `m.todayCompleted`，未比對 `m.lastCompletedDate === currentUtc8Date`。
     - 由於系統無跨日伺服器 cron 自動重置資料庫欄位，昨日（或前日）已完成的聖徒在今日仍被後台判定為「今日已完成」，造成後台統計人數異常虛高加一或多人。
  3. **主頁面掛載與輪詢時寬鬆判空強行寫入今日歷史**：
     - 在 [`src/app/page.tsx`](src/app/page.tsx) 的 `mergedDailyHistory` 邏輯中，原先有 `if (m.todayCompleted && (!m.lastCompletedDate || m.lastCompletedDate === currentUtc8))`。
     - 若資料庫舊成員資料遺漏了 `lastCompletedDate`，系統誤將其視為「今天完成」，強行把今日歷史打卡設為 1，進而觸發連續天數 streak 自動多加 1 天。
  4. **發表亮光分享心得時無端累加追求篇數**：
     - 在 `handlePublishLight` 中，若分享標題未解析出具體篇號（`sharedUnitNum === null`），系統誤執行 `prev.totalChaptersRead + 1`，導致聖徒僅發表心得感想，累計追求篇數就被錯誤累加。
  5. **打卡切換按鈕跨日狀態判斷**：
     - `handleToggleComplete` 中取得 `prevPlanCompleted` 時未驗證是否為「今日」完成，造成跨日後點擊打卡可能發生狀態倒置。
  6. **新約速讀與半年一遍期程未開始時的負值天數鉗位**：
     - 在 [`ntBibleData.ts`](src/data/ntBibleData.ts) 中，若追求主題起始日大於今日（尚未開始），原先直接強制 Clamp 為第 1 天，導致期程未開始就提示「落後進度」。
* **解決方案**：
  * **進度標籤語義清晰統一**：
    - 將 `TodayPursuitCard`、`ThemesDrawer` 與 `PlanSelectorModal` 之常規專題進度標籤修正為 `已追求 {completedUnits} / {totalUnits} {unit} ({percent}%)`，真實忠實反映聖徒實際完成之篇數，徹底移除人工 `+ 1`。
  * **後台今日完成人數嚴格校準日期**：
    - 在 `AdminPanel.tsx` 引入 `getUTC8DateString()`，統計今日完成時嚴格比對 `Boolean(m.todayCompleted && m.lastCompletedDate === currentUtc8Date)`，徹底解決跨日人數殘留。
  * **杜絕幽靈今日歷史**：
    - 移除 `mergedDailyHistory` 的 `!m.lastCompletedDate` 寬鬆回退，僅在 `m.todayCompleted && m.lastCompletedDate === currentUtc8` 時寫入今日打卡。
  * **純化亮光分享計數**：
    - `handlePublishLight` 僅累加 `totalSharesCount`，`totalChaptersRead` 僅在分享篇號大於當前累計篇數時才進行推進，絕不再盲目 `+ 1`。
  * **優化未開始期程判定**：
    - `calculateNTHalfYearPace` 與 `calculateNTSpeedPace` 增加 `isStarted` 判定，起始日在未來的期程 `daysElapsed` 為 0，預期章數為 0，提示期程即將開始。
* **影響檔案**：
  * [`src/components/TodayPursuitCard.tsx`](src/components/TodayPursuitCard.tsx)
  * [`src/components/ThemesDrawer.tsx`](src/components/ThemesDrawer.tsx)
  * [`src/components/PlanSelectorModal.tsx`](src/components/PlanSelectorModal.tsx)
  * [`src/components/AdminPanel.tsx`](src/components/AdminPanel.tsx)
  * [`src/app/page.tsx`](src/app/page.tsx)
  * [`src/data/ntBibleData.ts`](src/data/ntBibleData.ts)

### 9. 實裝追求主題獨立每日閱讀歷史 (Theme-Isolated Daily History) 與即時統計基準
* **問題描述**：使用者要求「在資料庫紀錄哪一天讀了多少（跟隨主題），統計資料就根據這個」。原系統之每日追求紀錄（`dailyHistory`）以全域單一對映儲存，不同追求主題間互相干擾混淆，且全站統計（今日打卡完成狀態、連續天數 streak、累計篇數、週進度 7 日圈圈、追求熱力圖）未能 100% 嚴格以該主題每日閱讀歷史為單一真相來源（Single Source of Truth）。
* **原因剖析**：
  1. **主題間資料未隔離**：聖徒若同時參與《新約一年一遍》與《晨興聖言》，在任一主題打卡會直接寫入全域 `user.dailyHistory`，導致切換至另一主題時，追求熱力圖與週進度仍然顯示其他主題之打卡點。
  2. **缺少主題專屬每日打卡歷史容器**：`ThematicMember` 僅記錄累計 `completedUnits` 與 `lastCompletedDate`，缺乏 `dailyHistory: Record<string, number>` 紀錄「哪一天讀了多少章/篇」。
  3. **統計邏輯散落且依賴布林值快照**：今日已完成狀態與連續天數計算若僅依賴非同步儲存的 `todayCompleted` 布林值，容易受跨日未重設、裝置時差影響。
* **架構級解決方案**：
  1. **型別定義與資料模型擴充 (`src/types/index.ts`)**：
     - `ThematicMember` 新增 `dailyHistory?: Record<string, number>`：精確記錄該成員在該主題中每一天（`YYYY-MM-DD`）所讀章/篇數。
     - `Companion` 新增 `dailyHistory?: Record<string, number>`：供帳幕互訪與同伴列表直接存取。
     - `UserProfile` 新增 `planDailyHistory?: Record<string, Record<string, number>>`：以 `planId` 為鍵之第二層主題獨立閱讀歷史容器。
  2. **雲端序列化零遷移無縫持久化 (`src/lib/supabaseDb.ts`)**：
     - 利用 Supabase PostgreSQL 的 `plans.members_json` (jsonb) 天然支援物件欄位擴展特性，自動序列化與反序列化 `m.dailyHistory`，**完全不需更動資料庫 Schema 或執行遷移腳本**。
     - 於 `users.sanctuary_json` 內部打包 `_planDailyHistory` 提供雙重安全備援，即使跨裝置換機亦可毫秒級恢復各主題閱讀歷史。
  3. **動態打卡推進與進度回原 (`src/app/page.tsx`)**：
     - `handleToggleComplete` 與 `handleSetProgressBatch`：打卡或批量更新進度時，直接精確計算增量 `deltaChapters`，寫入該成員在當前主題的 `m.dailyHistory[dateStr]`。
     - 連續天數 `streakDays` 立即由 `calculateStreakDaysFromHistory(prevDaily, todayStr)` 即時演算。
     - 10 秒防呆復原 `handleUndoProgress`：還原快照中之 `prevMemberDailyHistory`，精準消除當次增量。
  4. **全站統計 100% 錨定主題閱讀歷史**：
     - **今日完成判定**：`isCurrentPlanCompletedToday`、`currentCompanions`、`SanctuaryCard` 與 `AdminPanel` 全面更新為 `Boolean((m.dailyHistory?.[currentUtc8Date] || 0) > 0 || (m.todayCompleted && m.lastCompletedDate === currentUtc8Date))`。
     - **追求熱力圖 (`PursuitMap`)**：傳入當前主題獨立之 `activePlanDailyHistory`，切換主題時熱力圖即刻切換為該主題的專屬歷程。
     - **歷程彈窗 (`StatsModal`)**：連續天數由 `effectiveDailyHistory` 動態計算，累積篇數若有每日紀錄則由 `computedTotalUnits` 加總得出，週進度 7 日圈圈直接映射 `effectiveDailyHistory[dStr] > 0`。
     - **同伴帳幕地圖 (`CompanionSanctuaryModal`)**：傳入該同伴在該主題之 `dailyHistory`，忠實展現同伴之主題追求熱力。
* **影響檔案**：
  * [`src/types/index.ts`](src/types/index.ts)
  * [`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts)
  * [`src/app/page.tsx`](src/app/page.tsx)
  * [`src/components/StatsModal.tsx`](src/components/StatsModal.tsx)
  * [`src/components/AdminPanel.tsx`](src/components/AdminPanel.tsx)
  * [`src/components/SanctuaryCard.tsx`](src/components/SanctuaryCard.tsx)

### 10. 重設進度未徹底清空雲端每日歷史與主題歷程導致統計殘留
* **問題描述**：使用者回報「我把資料清除重設進度，統計沒有重設，是不是資料庫也沒有」。執行重設進度或清空瀏覽器快取後，連續追求天數、累計已讀篇數、追求熱力圖、今日打卡狀態依然殘留舊資料，未歸零。
* **原因剖析**：
  1. **重設函式未清理主題專屬歷史**：`handleResetUserProgress` 與 `handleBatchResetUserProgress` 僅重設了 `streakDays: 0, totalChaptersRead: 0, completedUnits: 0`，但未將成員物件內的 `m.dailyHistory` 清空為 `{}`，亦未將 `m.lastCompletedDate` 清空為 `undefined`，且未重設 `target.planDailyHistory = {}`。
  2. **本地主題快取未清除**：重設時未移除 `localStorage` 中的 `plan_${planId}_daily_units`，使得 `loadUserDailyHistory` 仍能讀回舊打卡點。
  3. **資料庫未同步抹除**：因送出給 Supabase 的成員清單與聖徒封包中仍保有 `dailyHistory` 與 `_planDailyHistory`，雲端資料庫（`plans.members_json` 與 `users.sanctuary_json`）繼續保存該員的歷史記錄；前端背景輪詢或重整頁面時，資料庫資料立即將舊統計與熱力圖復原。
  4. **雲端序列化底層殘留防護**：`supabaseSaveUsers` 在打包 `packedSanctuary` 時，若 `u.sanctuary` 曾意外混入舊私有欄位（以 `_` 開頭），會覆蓋清空後的空值。
* **解決方案**：
  1. **重設函式全維度歸零 (`src/app/page.tsx`)**：
     - 單人與批量重設時，將 `user.dailyHistory` 與 `user.planDailyHistory` 徹底指派為 `{}`。
     - 於所有追求主題的成員物件中，明確指派 `m.dailyHistory = {}`、`m.lastCompletedDate = undefined`、`m.todayCompleted = false`、`m.completedUnits = 0`、`m.streakDays = 0`。
     - 清除 `localStorage` 中所有主題鍵（`plan_${p.id}_completed_units`、`plan_${p.id}_completed_today`、`plan_${p.id}_daily_units`、`completed_today_date`）。
     - 同步調用 `saveAllUsers` 與 `savePlans`，即刻原子化推播至雲端 Supabase 資料庫，保證資料庫一併歸零。
  2. **雲端打包徹底過濾私有欄位 (`src/lib/supabaseDb.ts`)**：
     - 在 `supabaseSaveUsers` 中過濾所有開頭為 `_` 的舊殘留鍵，確保清空後的 `_dailyHistory: {}` 與 `_planDailyHistory: {}` 權威寫入 Supabase。
  3. **資料庫髒資料清理驗證**：
     - 已透過管理腳本校準雲端資料庫中該帳號的主題歷史與篇數，確認各追求主題進度與統計全數歸零。
* **影響檔案**：
  * [`src/app/page.tsx`](src/app/page.tsx)
  * [`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts)
  * [`BUGFIX.md`](BUGFIX.md)

### 11. 移除忘記密碼與臨時密碼文案中之字數/位數標記 (Generic Auth Copy Refinement)
* **問題描述**：使用者回報「忘記密碼不用顯示幾位認證碼或密碼」，期望介面不要鎖死或過度強調「6 位數」、「10 位」等具體字數說明，使文案更加簡潔大方且具彈性。
* **原因剖析**：
  * 原先在驗證碼寄送通知、輸入欄位標籤、佔位符號、後台核發臨時密碼按鈕、彈窗提示與發信模板中，多處硬編碼「6 位數驗證碼」及「10 位臨時密碼」，造成視覺干擾與不必要的文案限制。
* **解決方案**：
  * **保留後端驗證邏輯與長度安全機制**：維持驗證碼 6 位數字與臨時密碼英數亂數產生器的運作不受影響。
  * **全面精簡介面文案**：
    - 將所有「6 位數驗證碼」、「6 位數字驗證碼」統一精簡為「驗證碼」或「安全驗證碼」。
    - 將所有「10 位臨時密碼」、「10 位英數臨時密碼」、「10 位安全臨時密碼」統一精簡為「臨時密碼」或「隨機臨時密碼」。
    - 同步更新電子郵件通知模板（[`src/lib/email.ts`](src/lib/email.ts)）、後台管理中心（[`src/components/AdminPanel.tsx`](src/components/AdminPanel.tsx)）、登入與找回密碼頁面（[`src/components/LoginPage.tsx`](src/components/LoginPage.tsx)）、主頁 Toast 通知（[`src/app/page.tsx`](src/app/page.tsx)）以及型別註解（[`src/types/index.ts`](src/types/index.ts)、[`src/lib/password.ts`](src/lib/password.ts)）。
* **影響檔案**：
  * [`src/components/LoginPage.tsx`](src/components/LoginPage.tsx)
  * [`src/components/AdminPanel.tsx`](src/components/AdminPanel.tsx)
  * [`src/app/page.tsx`](src/app/page.tsx)
  * [`src/lib/email.ts`](src/lib/email.ts)
  * [`src/lib/password.ts`](src/lib/password.ts)
  * [`src/types/index.ts`](src/types/index.ts)
  * [`BUGFIX.md`](BUGFIX.md)

### 12. 管理員撤銷重設密碼申請與原密碼安全還原機制 (Admin Revoke Password Reset & Reversion)
* **問題描述**：聖徒若因誤觸、他人誤填信箱、或隨後自行記起原始密碼，重設密碼申請會一直掛在管理員後台面板；管理員原先無法主動「撤銷」重設申請，且一旦發出申請，原始密碼即被臨時密碼覆蓋，無法安全復原。
* **原因剖析**：
  1. 系統未提供管理員取消或駁回重設申請的機制，導致該帳號始終停留在 `passwordResetRequested: true` 或 `mustChangePassword: true`。
  2. 原密碼在生成臨時密碼時被即時覆寫為臨時密碼 Hash，缺乏快照機制（`previousPassword`），導致撤銷申請時無法還原使用者原密碼。
* **解決方案**：
  1. **原始密碼快照備存 (`UserProfile.previousPassword`)**：
     - 在聖徒送出忘記密碼申請或管理員產生臨時密碼時，自動將原密碼安全保存於 `u.previousPassword`，並透過 Supabase `packedSanctuary._previousPassword` 進行雲端持久化備援。
  2. **管理員單人與批量撤銷操作**：
     - **密碼管理中心專區**：在每位待重設聖徒列提供「撤銷申請」快捷按鈕；在詳情展開卡中提供「撤銷此重設申請（清除臨時碼並恢復原密碼）」；名單大於 1 位時更提供「一鍵全部撤銷」。
     - **聖徒名冊管理彈窗**：在聖徒個人管理詳情中提供「撤銷重設密碼申請」按鈕。
  3. **原狀態零延遲即時還原**：
     - 點擊撤銷時彈出確認提示，確認後立即清空 `tempPassword`、重設 `mustChangePassword = false`、`passwordResetRequested = false`，並將 `u.password` 還原為 `u.previousPassword`，清空 `previousPassword`。
     - 同步更新本地 `localStorage`、主頁狀態與 Supabase PostgreSQL 資料庫，彈出成功提示。
* **影響檔案**：
  * [`src/types/index.ts`](src/types/index.ts)
  * [`src/lib/supabaseDb.ts`](src/lib/supabaseDb.ts)
  * [`src/components/LoginPage.tsx`](src/components/LoginPage.tsx)
  * [`src/components/AdminPanel.tsx`](src/components/AdminPanel.tsx)
  * [`src/app/page.tsx`](src/app/page.tsx)
  * [`BUGFIX.md`](BUGFIX.md)

---

## v1.1.2 修復紀錄 (2026-10-26)

### 1. 追求帳幕自訂佈置零回溯雲端持久化 (五重架構級安全防護)
* **問題描述**：聖徒在「佈置追求帳幕」更換器具（金香壇、約櫃、金燈臺等）或座右銘並點擊保存後，經過數秒或重新整理頁面，帳幕經常被自動回溯（Rollback）重置回初始或舊配置。
* **原因剖析**：
  1. **彈窗狀態被背景輪詢強制重置**：`currentSanctuaryConfig` 原先在每次主層重新渲染時生成新物件引用，觸發彈窗內部 `useEffect` 在聖徒編輯時無預警將表單重置回舊設定。
  2. **遠端合併順序覆寫本地 (Merge Priority Bug)**：輪詢時原先將遠端放在展開運算子右側，導致遠端尚未寫入完畢之舊資料覆寫了本地剛儲存好的設定。
  3. **掛載時參照脫靶 (Mount Ref Desync)**：初次掛載解析 `loadUserData` 時未同步賦值 `userRef.current`，導致非同步操作短暫將儲存對象指向預設同工帳號。
  4. **突變無冷卻鎖引發競態 (Race Condition)**：儲存帳幕時未調用突變鎖，使背景輪詢拉回寫入中的舊資料。
* **五重架構級安全解決方案**：
  1. **① 彈窗開闔狀態單向邊緣保護 (Modal State Open-Transition Guard)**：
     - 於 `SanctuaryCustomizeModal` 內實裝 `prevIsOpenRef` 守衛，嚴格限制「僅在彈窗由關閉轉換為開啟（`isOpen && !prevIsOpenRef.current`）時初始化一次」，編輯過程中即使主頁面重渲染亦絕不重置。
     - 主頁面透過 `useMemo` 將 `currentSanctuaryConfig` 深度鎖定，確保物件引用在設定未實質變更時保持絕對穩定。
  2. **② 本地權威優先合併準則 (Local-Authoritative Merge Principle)**：
     - 確立「聖徒本機當前操作為追求帳幕自訂陳設之最高權威來源」。
     - 於初次資料獲取與 2.5 秒定時輪詢中，專屬主題陳設一律採用 `{ ...remote.planSanctuaries, ...currentUser.planSanctuaries }` 合併順序，本地最新配置享有最高優先權。
     - 雙向校驗機制：若偵測到本地設定與遠端不一致，即刻由本地主動觸發雙向推播同步至 Supabase PostgreSQL，使雲端權威庫自動校準更新。
  3. **③ 掛載同步參照鎖定 (Mount Synchronous Ref Binding)**：
     - 在 `useEffect` 初次掛載解析 `loadUserData` 當下，立即同步賦值 `userRef.current = activeProfile`，杜絕任何微任務時差造成的參照錯位。
  4. **④ 突變狀態冷卻鎖 (Mutation Cooldown Lock)**：
     - 點擊「保存帳幕佈置」及底層 `rawSyncUsers` 執行時，全面調用 `markMutationStart()` 觸發 4 秒突變保護期，期間所有定時輪詢自動靜默屏蔽，徹底阻斷競態拉回舊資料。
  5. **⑤ 專屬本機備援持久化 (Dedicated Storage Fallback)**：
     - 每次儲存同步原子化寫入專屬本地鍵（`getUserStorageKey(uid, 'sanctuary')` 與 `getUserStorageKey(uid, 'plan_sanctuaries')`），離線與頁面刷新皆可立時精準復原。
* **影響檔案**：[`src/app/page.tsx`](src/app/page.tsx), [`src/components/SanctuaryCustomizeModal.tsx`](src/components/SanctuaryCustomizeModal.tsx), [`src/components/SanctuaryCard.tsx`](src/components/SanctuaryCard.tsx)

---

## v1.1.1 修復紀錄 (2026-10-25)

### 1. 全站浮動彈窗背景滾動穿透 (Body Scroll Lock)
* **問題描述**：在手機或桌機瀏覽器開啟任何彈窗或左側抽屜時，滑動彈窗內容會連帶滾動底層主頁面，造成嚴重的滾動鏈結 (Scroll Chaining) 與版面跳動 (Layout Shift)。
* **解決方案**：
  * 實裝 `src/lib/scrollLock.ts`，以參考計數管理多層彈窗之 body scroll lock。
  * 在 `globals.css` 中注入 `body.scroll-locked` 與 `.overscroll-contain`，從底層 CSS 杜絕手勢滾動滲透。
* **影響檔案**：[`src/lib/scrollLock.ts`](src/lib/scrollLock.ts), `src/app/globals.css`, 全站 18 組浮動彈窗與抽屜元件。

### 2. 手機端導覽列提醒浮空彈窗右對齊與位置偏移修正
* **問題描述**：手機端點擊提醒鈴鐺時，通知浮窗偏左甚至遮蔽導覽列按鈕。
* **解決方案**：將通知浮窗對齊基準改為右側邊緣與「登出」按鈕右側齊平，並設定自適應寬度限制。
* **影響檔案**：[`src/components/Header.tsx`](src/components/Header.tsx)

### 3. 動態發文相對時間 mhdw 與排程重繪
* **問題描述**：所有貼文與留言皆顯示寫死的「剛剛」，未隨時間真實反映發布歷時。
* **解決方案**：封裝動態計算函式，計算相差分鐘、小時、天數或週數，以 `m / h / d / w` 呈現，並加入每 30 秒自動觸發的輕量定時重繪。
* **影響檔案**：[`src/components/PostCard.tsx`](src/components/PostCard.tsx), [`src/app/page.tsx`](src/app/page.tsx)

### 4. 「多讀一天」0 進度防呆與跨日自動重設
* **問題描述**：尚未完成當日追求時，點擊多讀一天會造成進度天數標記紊亂；跨日後打卡狀態未重設。
* **解決方案**：加入防呆檢查（未完成當日不可直接多讀一天），並以 UTC+8 台北時間在偵測到換日時自動重設打卡狀態。
* **影響檔案**：[`src/app/page.tsx`](src/app/page.tsx), [`src/components/TodayPursuitCard.tsx`](src/components/TodayPursuitCard.tsx)

---

*日誌維護：晨星共行同工服事組*  
*最新修訂時間：2026-10-28*
