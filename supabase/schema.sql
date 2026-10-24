-- =========================================================================
-- 晨星共行 (Morning Star Pursuit) - Supabase PostgreSQL Cloud Schema
-- =========================================================================
-- 請直接在 Supabase 控制台的 SQL Editor 中執行此腳本，即可一鍵完成資料表結構、
-- 索引、Row Level Security (RLS) 與預設種子資料初始化。
-- =========================================================================

-- 1. 追求主題 (plans)
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  unit_name TEXT DEFAULT '篇',
  description TEXT,
  total_units INTEGER DEFAULT 0,
  completed_units INTEGER DEFAULT 0,
  current_unit_title TEXT,
  current_verses TEXT,
  summary TEXT,
  start_date TEXT,
  end_date TEXT,
  invite_code TEXT,
  admin_id TEXT,
  admin_name TEXT,
  members_json JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 摸著與分享 (posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT '同伴',
  author_avatar TEXT DEFAULT '🌱',
  plan_id TEXT,
  plan_title TEXT,
  unit_title TEXT,
  key_verse TEXT,
  reflection TEXT,
  tags_json JSONB DEFAULT '[]'::jsonb,
  created_at TEXT NOT NULL,
  reactions_json JSONB DEFAULT '{"amenCount": 0, "prayCount": 0}'::jsonb,
  comments_json JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 聖徒帳號 (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  locality TEXT DEFAULT '',
  streak_days INTEGER DEFAULT 0,
  total_chapters_read INTEGER DEFAULT 0,
  total_shares_count INTEGER DEFAULT 0,
  total_amen_received INTEGER DEFAULT 0,
  avatar TEXT DEFAULT '🌱',
  role TEXT DEFAULT 'user',
  display_mode TEXT DEFAULT 'light',
  sanctuary_json JSONB,
  password_reset_requested BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 系統與同伴提醒通知 (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_user_id TEXT,
  plan_id TEXT,
  actor_name TEXT,
  actor_avatar TEXT,
  type TEXT NOT NULL,
  target_title TEXT,
  created_at TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 密碼重設動態驗證碼 (password_reset_codes)
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TEXT NOT NULL
);

-- 6. 使用者專屬分頁狀態 (user_state)
CREATE TABLE IF NOT EXISTS public.user_state (
  user_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  value_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, state_key)
);

-- =========================================================================
-- 建立高效索引 (Indexes)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_posts_plan_id ON public.posts(plan_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_plans_admin_id ON public.plans(admin_id);

-- =========================================================================
-- 啟用 Row Level Security (RLS) 並設定公開讀寫原則（或依 API Key / Service Role 授權）
-- =========================================================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

-- 允許 Anon Key 與 Authenticated 角色全功能操作（後端 API 統一處理與防護）
DO $$
BEGIN
  -- plans policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'allow_all_plans') THEN
    CREATE POLICY allow_all_plans ON public.plans FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- posts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'allow_all_posts') THEN
    CREATE POLICY allow_all_posts ON public.posts FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- users policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'allow_all_users') THEN
    CREATE POLICY allow_all_users ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- notifications policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'allow_all_notifications') THEN
    CREATE POLICY allow_all_notifications ON public.notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- password_reset_codes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_codes' AND policyname = 'allow_all_reset_codes') THEN
    CREATE POLICY allow_all_reset_codes ON public.password_reset_codes FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- user_state policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_state' AND policyname = 'allow_all_user_state') THEN
    CREATE POLICY allow_all_user_state ON public.user_state FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =========================================================================
-- 純淨初始架構 (Zero Mock Data - 100% 乾淨無預設資料)
-- 不預設任何追求主題、示範貼文或測試假帳號。
-- 僅建立系統必要之唯一管理員帳號 (admin@morningstar / 預設密碼 111111) 以供首次登入
-- =========================================================================

-- 清理過往歷史示範用測試資料（若曾載入過舊版種子資料）
DELETE FROM public.posts WHERE id IN ('post-1', 'post-2', 'post-3');
DELETE FROM public.plans WHERE id IN ('plan-romans-2026', 'plan-john-reading', 'plan-genesis-speed', 'plan-romans-ls', 'plan-custom-sit-walk-stand', 'plan-morning-revival', 'plan-nt-half-year', 'plan-nt-reading', 'plan-nt-speed');
DELETE FROM public.users WHERE id IN ('user-t1', 'user-t2', 'user-t3', 'user-t4') OR email LIKE 't%@test';

-- 建立預設系統管理員（管理員 admin@morningstar / 111111）
INSERT INTO public.users (
  id, name, email, password, locality, streak_days, total_chapters_read,
  total_shares_count, total_amen_received, avatar, role, display_mode,
  password_reset_requested, must_change_password, created_at, updated_at
) VALUES 
(
  'user-admin',
  '管理同工',
  'admin@morningstar',
  'sha256$fixedsaltforadmin111111$70bab25006d54c8cfe5a9be6dcb7035c7b938687a5077dc9125ddff6edd06a96',
  '全召會服事處',
  0, 0, 0, 0,
  '🛡️',
  'admin',
  'light',
  FALSE, FALSE, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  avatar = EXCLUDED.avatar,
  locality = EXCLUDED.locality,
  updated_at = NOW();

-- 7. 重新整理 PostgREST API 快取（立即解決 PGRST205 找不到表格問題）
NOTIFY pgrst, 'reload schema';

-- 8. 驗證資料表清單（執行完畢後下方將直接列出建立好的 6 張資料表）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

