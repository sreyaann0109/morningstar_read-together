# 《晨星共行 Morning Star Companions》產品規格與系統架構書 (spec.md)

> **當前系統版本**：`v1.1.0`  
> **正式站點 (Production)**：[https://morningstar-read-together.vercel.app/](https://morningstar-read-together.vercel.app/)（對應 `main` 分支）  
> **預覽站點 (Staging / Preview)**：Vercel 自動部署預覽（對應 `develop` 分支）  
> **核心資料庫架構**：100% Pure Cloud Supabase PostgreSQL (Zero-Mock Clean Schema，徹底棄用本地 SQLite 與檔案持久化)  
> 
> *「我們並有申言者更確定的話，你們留意這話，如同留意照在暗處的燈，直等到天發亮，晨星在你們心裏出現，你們就作得好了。」——彼得後書一章 19 節*  
> *「你要逃避青年人的私慾，同那清心呼求主的人，竭力追求公義、信、愛、和平。」——提摩太後書二章 22 節*

---

## 0. 開發助手與協作規範 (AI Assistant & Engineering Protocols)

> [!IMPORTANT]
> **全體工程開發與 AI 助手之最高遵循準則**：
> 1. **任務前必先閱讀本規格書**：每次開始任何開發、除錯、重構或微調任務前，**必須首先讀取並核對本《spec.md》**，確認所有業務邏輯、召會生活用語規範與架構原則。
> 2. **召會生活用語規範（嚴格禁止世俗/宗派名詞）**：
>    - **嚴格禁用**：「靈修」、「靈程」、「靈修進度」、「打卡」、「靜修」、「信徒」、「教友」。
>    - **必須採用**：「晨興」、「追求」、「追求進度」、「摸著」、「亮光」、「同伴」、「聖徒」、「阿們」、「神聖帳幕」。
> 3. **部署與 Git 分支紀律（嚴禁自動推送）**：
>    - **日常工作分支**：一律在 `develop` 分支作業。
>    - **本地優先提交**：修改完成後必須於本機執行 `npx tsc --noEmit` 驗證，並使用清晰語義的 Conventional Commits 於本機提交。
>    - **嚴禁自動 Push**：未經使用者明確發布「push」指令前，**絕對不可執行 `git push`**，以維護遠端部署紀錄之整潔。
>    - **本機服務常態運行**：任何修改與重構完成後，必須確保本機 `http://localhost:3000` 正常運作且隨時可供驗證。

---

## 1. 系統願景與核心定位 (Vision & Purpose)

《晨星共行》是專為基督徒召會生活打造之專用晨興追求與同伴激勵應用程式。不同於一般世俗之習慣養成工具或公用社交平台，《晨星共行》旨在落實「二人成隊、三人成組」之召會生活同伴原則，使聖徒們在清晨享受主話（如半年新約讀經、職事信息研讀），藉由同伴即時進度激勵、靈中亮光交通、彼此「阿們」扶持，一同在基督的生命中長大。

---

## 2. 系統架構與技術棧 (Architecture & Tech Stack)

### 2.1 技術棧組成
* **前端框架**：Next.js 14 (App Router) + React 18
* **樣式體系**：Tailwind CSS + Tailwind Aspect Ratio，完整支援 Light Mode / Dark Mode 主題切換
* **圖示庫**：Lucide React
* **雲端資料庫**：100% Pure Cloud Supabase (PostgreSQL 15+)，全域解耦本地 SQLite，確保全站單一資料來源（Single Source of Truth）
* **身分驗證與安全**：加鹽雜湊密碼體系（PBKDF2/SHA-256 Web Crypto 相容）+ 臨時密碼強制更換機制
* **郵件發送服務**：Nodemailer 整合 Google Gmail SMTP (Port 465 SSL 協定)，支援 6 碼驗證碼與直達安全 Token 連結

### 2.2 雙分支與版本部署策略 (Dual-Branch Strategy)
* **`main` 分支（Production）**：
  * 當前版本標籤：`v1.0.0`
  * 綁定線上生產環境網域：`https://morningstar-read-together.vercel.app/`
  * 保持最高穩定性，僅在功能於 `develop` 完整驗證並完成 Milestone 總結後方由管理者核准合併。
* **`develop` 分支（Development & Staging）**：
  * 當前版本標籤：`v1.1.0`
  * 進行所有新功能開發、測試驗證、UI 微調與使用者體驗優化。
  * Vercel 依此分支生成預覽部署環境，供同工測試。

---

## 3. 資料庫設計與雲端模型 (Database Schema)

系統採用 Supabase PostgreSQL 作為唯一資料來源，包含以下 6 張核心資料表：

```
+-----------------------------------------------------------------------------------+
|                                  SUPABASE CLOUD                                   |
+-------------------+--------------------+--------------------+---------------------+
| plans             | users              | posts              | notifications       |
| - id (PK)         | - id (PK)          | - id (PK)          | - id (PK)           |
| - title           | - name             | - plan_id          | - user_id (Recipient|
| - category        | - email            | - user_id          | - actor_id          |
| - total_units     | - password_hash    | - user_name        | - actor_name        |
| - completed_units | - role             | - user_avatar      | - type              |
| - members_json    | - locality         | - chapter_tag      | - plan_title        |
| - invite_code     | - streak_days      | - content          | - comment_text      |
| - admin_id        | - sanctuary_json   | - amens_json       | - post_id           |
|                   |                    | - comments_json    | - is_read           |
+-------------------+--------------------+--------------------+---------------------+
| user_state                             | site_settings                            |
| - user_id (PK part 1)                  | - id (PK, 'global')                      |
| - state_key (PK part 2)                | - settings_json                          |
| - value_json                           | - updated_at                             |
+----------------------------------------+------------------------------------------+
```

### 3.1 `plans`（追求主題表）
* `id` (text, PK)：主題唯一識別碼（如 `theme-1792851571261`）。
* `title` (text)：追求主題全名（如「半年新約讀經一遍」）。
* `category` (text)：分類代碼，包含 `nt-half-year`（半年讀經）、`nt-speed-reading`（新約速讀）、`bible`（聖經各卷）、`ministry`（職事信息）。
* `unit_name` (text)：追求單位名稱（聖經類預設為「章」，信息類預設為「篇」）。
* `total_units` (int4)：主題總單位數（半年新約固定為 260）。
* `completed_units` (int4)：預設進度基準。
* `members_json` (jsonb)：參與該主題之聖徒名單陣列，內含每位聖徒之獨立進度：
  ```json
  [
    {
      "userId": "user-123",
      "userName": "提摩太弟兄",
      "userAvatar": "🌱",
      "completedUnits": 24,
      "currentUnitTitle": "馬太福音 第 25 章",
      "currentVerses": "馬太福音 第 25 ～ 26 章",
      "joinedAt": "2026-10-20T08:00:00Z"
    }
  ]
  ```
* `invite_code` (text)：6-Emoji 專屬邀請碼（如 `🌱🕊️☀️🌅🌾📖`）。
* `admin_id` (text)：建立/負責此主題之管理員 ID。

### 3.2 `users`（聖徒資料表）
* `id` (text, PK)：聖徒識別碼。
* `name` (text)：聖徒姓名或稱呼（如「保羅弟兄」）。
* `email` (text, Unique)：登入與重設密碼信箱。
* `password` (text)：經 PBKDF2/SHA-256 雜湊後的密碼。
* `role` (text)：權限角色，`admin`（管理同工）或 `user`（一般追求聖徒）。
* `locality` (text)：所在召會與會所（如「台北市召會第一會所」）。
* `streak_days` (int4)：晨興連續追求天數（晨興同伴天數）。
* `total_chapters_read` (int4)：累計追求總章/篇數。
* `total_shares_count` (int4)：累計分享摸著亮光次數。
* `total_amen_received` (int4)：累計榮獲同伴「阿們」次數。
* `sanctuary_json` (jsonb)：神聖帳幕陳設配置（信物清單、宣告題詞與主題）。

### 3.3 `posts`（摸著與亮光動態分享表）
* `id` (text, PK)：分享篇章唯一識別碼。
* `plan_id` (text)：所屬追求主題 ID。
* `user_id` (text)、`user_name` (text)、`user_avatar` (text)：發布聖徒資訊。
* `chapter_tag` (text)：具體追求章節（如「馬太福音 第 1 ～ 2 章」）。
* `content` (text)：靈中摸著與亮光交通內容。
* `amens_json` (jsonb)：阿們聖徒陣列 `[{"userId": "...", "userName": "..."}]`。
* `comments_json` (jsonb)：同伴交通留言陣列 `[{"id": "...", "userId": "...", "userName": "...", "text": "...", "createdAt": "..."}]`。

### 3.4 `notifications`（互動通知表）
* 支援三段式互動通知語義，即時通知聖徒其分享獲得同伴之阿們或留言。

### 3.5 `user_state` 與 `site_settings`
* 複合鍵持久化聖徒個人獨立偏好與全站動態開關設定，支援無檔案純雲端存儲。

---

## 4. 核心功能規格詳細說明 (Functional Specifications)

### 4.1 今日追求雙核對照儀表板 (Twin Progress Dashboard)
* **左側【我目前進度】**：
  * 清晰呈現聖徒個人之實際已完成章節，精準對應聖經卷名與章名（例如：「已讀完：馬太福音 第 2 章」）。
  * 標註下一期待讀章節（例如：「下一期待讀：馬太福音 第 3 ～ 4 章」）。
  * 動態比對落後/超前狀態（如「落後 2 天 (4 章)」或「進度正常」）。
* **右側【今日表定進度】**：
  * 呈現全召會表定追求期程之目標書卷章節（例如：「今日表定：馬太福音 第 5 ～ 6 章」）。
  * 標註全主題期程總天數與當前天數。
* **⚡ 一鍵追上進度 (One-Click Catch-Up) 與 10 秒防呆復原**：
  * 當聖徒進度落後時，提供一鍵將進度更新至今日表定目標。
  * 提供「10 秒倒數防呆復原 (Undo)」浮動提示條，10 秒內聖徒可隨時取消復原；逾時後自動鎖定，防止誤觸往回修改。
* **單日打卡 (+1 章/篇)**：
  * 點擊「今日追求完成」按鈕，進度自動加 1 單元，更新追求地圖熱力值並增加 streak 天數。

### 4.2 聖徒個人獨立進度架構 (Per-User Independent Progress)
* 嚴格落實 **100% 聖徒個人獨立進度**，任何成員的打卡與推進絕不影響同伴之進度數字。
* 主題成員進度權威來源為 `plan.members[i].completedUnits`。聖徒加入即顯示、退出即移除，杜絕幽靈進度。
* **管理員視圖與主題成員資格嚴格分離**：
  * 管理員在個人追求視圖（今日追求卡片、動態牆、切換追求主題彈窗）中，**嚴格僅能看到自己已加入的主題，絕不顯示自己所沒有加入的追求主題**。
  * 管理員若尚未加入任何追求主題，追求首頁將呈現引導至「管理控制台」之清爽引導畫面，絕不疊加他人主題。
  * 管理員可於控制台中隨時將自己加入任一主題成員，加入後方於個人追求首頁中顯示。

### 4.3 追求主題標準化與 6-Emoji 邀請碼管理
* **標題樣式統一**：首頁「當前追求主題」卡片採用圓角圖示、標準標題與鼓勵副標，消除突兀字首。
* **書卷篇章具體化**：半年新約讀經（260 章）完整映射自馬太福音至啟示錄各卷各章，徹底廢除抽象數字。
* **複製邀請碼功能統整於控制台 (Admin Panel Only)**：
  * 個人追求卡片徹底移除邀請碼與複製按鈕，維護追求介面之沉浸與隱私。
  * 複製 6-Emoji 專屬邀請碼一律做在「管理控制台」的主題管理卡片中（支援卡片頂部一鍵複製與展開詳情複製），專供服事同工發布使用。

### 4.4 摸著與亮光動態牆與互動體系 (Feed & Interactions)
* **發表亮光**：聖徒依當前追求進度分享靈中摸著，自動帶入當前章節標籤。
* **原位修改與刪除**：作者可隨時修改或刪除自身發布之分享。
* **同伴阿們激勵**：一鍵「阿們」，動態計數並發送通知。
* **留言互動與撤銷復原**：
  * 支援留言即時發布與刪除。
  * 留言刪除後提供 10 秒即時「復原留言」Toast 機制。
* **三段式通知格式標準**：
  * 通知格式嚴格遵循：`[誰] 在您的 [什麼分享] 留言：「[說了什麼]」`。
  * 例：「卡皮 在您的 《半年新約讀經一遍》【馬太福音 第 1 ～ 2 章】亮光分享 留言：『阿們！這話很有膏油！』」

### 4.5 晨興神聖帳幕與走訪同伴 (Sanctuary & Companions)
* **神聖信物陳設**：
  * 金香壇（常時禱告）、約櫃（神聖見證）、金燈臺（照耀生命）、陳設餅桌（話語餧養）、燔祭壇（完全奉獻）、洗濯盆（每日洗滌）等。
* **宣告題詞與晨興主題**：
  * 支援聖徒自訂靈深處的宣告題詞。
  * 提供晨曦 (Dawn)、黃昏 (Twilight)、深夜 (Night) 等帳幕光影氛圍切換。
* **走訪同伴晨興帳幕**：
  * 點擊同伴頭像可走訪其神聖帳幕，觀摩其信物陳設與宣告題詞。
* **袖珍型純觀看追求地圖 (Pocket-Sized Pursuit Map)**：
  * 同伴帳幕視窗底部整合小巧精緻的熱力追求地圖（`compact={true}` & `interactive={false}`）。
  * 顯示同伴近期追求熱度，純觀看無點擊干擾，完美適配 Dark Mode。

### 4.6 管理員後台工作台 (Admin Control Center)
* **同頁即時切換**：管理員於頂部工具列可一鍵無刷新切換「聖徒追求視圖」與「管理員工作台」。
* **追求主題管理**：建立、編輯、進度排程重設、刪除主題、成員批次加入與移出。
* **聖徒名單維護**：指派/解除管理同工權限、重設聖徒密碼、清理離組帳號。
* **全站功能開關中心 (Site Settings)**：
  * 開放/關閉聖徒自行註冊。
  * 開放/關閉摸著亮光分享。
  * 開放/關閉留言與彼此阿們。
  * 開放/關閉帳幕走訪與邀請碼加入。

### 4.7 密碼安全與 Gmail SMTP 發信機制
* **忘記密碼自我重設**：
  * 整合 Google Gmail SSL 465 專屬發信伺服器。
  * 郵件主旨與內容冠以 `晨星共行` 專屬識別。
  * 支援安全 6 碼數字驗證碼與一鍵點擊直達重設連結。
* **管理員輔助重設**：
  * 產生臨時隨機密碼，聖徒首次以此密碼登入時觸發「強制更換新密碼」全螢幕強制視窗，必須更新密碼後方可進入系統。

---

## 5. 介面設計與視覺標準 (Design System)

### 5.1 配色與主題規範
* **Light Mode**：
  * 背景：柔和暖象牙白（`bg-amber-50/40`）與純白卡片（`bg-white`）。
  * 主色調：晨星金（`amber-500`）、晨曦橘（`orange-500`）與生命綠（`emerald-600`）。
* **Dark Mode**：
  * 背景：沉靜深邃藍夜（`bg-slate-900`）與深灰卡片（`bg-slate-800`）。
  * 文字：高對比清晰文字（`text-slate-100` / `text-slate-300`）。
* **無障礙響應式適配**：
  * 電腦端：雙欄/三欄流暢網格，頂部整合追求進度與右側同伴動態。
  * 行動端：底部專屬導覽列（`BottomNav`：今日追求、同伴動態、神聖帳幕、追求統計）。

---

## 6. 部署驗證與測試維護手冊 (Operations & Maintenance)

### 6.1 本機開發與除錯
```bash
# 啟動本機開發伺服器（必須確保具備外網存取權限以連線 Supabase 雲端）
npm run dev

# 靜態型別與編譯檢查（每次提交前必跑）
npx tsc --noEmit

# 正式環境建置測試
npm run build
```

### 6.2 Supabase 資料庫連線檢驗
本機或雲端環境皆可透過 GET `/api/data` 快速驗證資料庫通訊：
* 當回傳 `success: true` 且 `database: "supabase"` 時，表示直連雲端 PostgreSQL 運作正常。
* 若發生異常，檢查 `.env.local` 之 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否配置正確。

---

## 7. 版本發行歷程總結 (Release History)

* **v1.0.0 (2026-10-24)**：
  * 正式發布里程碑。
  * 確立 100% Pure Cloud Supabase 架構，全面淘汰本地 SQLite。
  * 召會生活用語規範全面落實。
  * 神聖帳幕、動態牆、阿們機制、管理員同頁後台、Gmail SMTP 密碼重設上線。
* **v1.1.0 (2026-10-24)**：
  * 今日追求雙核對照儀表板（我目前進度 vs 今日表定進度）。
  * 廢除 1-260 抽象數字，導入聖經具體卷章名稱。
  * 追求主題樣式標準化與邀請碼隱私保護。
  * 三段式互動通知語義重構（誰在我的什麼分享說了什麼）。
  * 同伴晨興帳幕袖珍型追求地圖整合。
  * 徹底棄用本地檔案持久化，全站設定與資料 100% 直連 Supabase。
  * 管理員個人追求視圖與未加入主題嚴格分離（僅顯示自身實際加入之主題，未加入時提供清爽管理引導）。
  * 複製 6-Emoji 專屬邀請碼功能全數統整於管理員控制台（Admin Panel）。
  * Git 雙分支歷史整肅與 Local-First 嚴謹提交紀律。

---

*規格書制定維護：晨星共行同工服事組*  
*最新修訂時間：2026-10-24*
