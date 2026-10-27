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
