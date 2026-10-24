import { NextResponse } from 'next/server';
import {
  dbGetAllPlans,
  dbGetAllPosts,
  dbGetAllUsers,
  dbGetAllNotifications,
  dbSavePlans,
  dbSavePosts,
  dbSaveUsers,
  dbSaveNotifications,
} from '../../../lib/db';
import { isSupabaseConfigured, getSupabase } from '../../../lib/supabase';
import { getPersistedSiteSettings } from '../../../lib/siteSettingsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isCloud = isSupabaseConfigured();
    const supabase = getSupabase();

    let diagnostics: any = undefined;
    if (supabase) {
      const [pCheck, uCheck, postCheck, nCheck] = await Promise.all([
        supabase.from('plans').select('id').limit(1),
        supabase.from('users').select('id').limit(1),
        supabase.from('posts').select('id').limit(1),
        supabase.from('notifications').select('id').limit(1),
      ]);
      const hasAnyError = pCheck.error || uCheck.error || postCheck.error || nCheck.error;
      if (hasAnyError) {
        diagnostics = {
          plansTable: pCheck.error ? { code: pCheck.error.code, message: pCheck.error.message } : 'ok',
          usersTable: uCheck.error ? { code: uCheck.error.code, message: uCheck.error.message } : 'ok',
          postsTable: postCheck.error ? { code: postCheck.error.code, message: postCheck.error.message } : 'ok',
          notificationsTable: nCheck.error ? { code: nCheck.error.code, message: nCheck.error.message } : 'ok',
          hint: 'Supabase 資料表尚未建立或權限未開放。請前往 Supabase 控制台的 SQL Editor 執行專案目錄下的 supabase/schema.sql 即可完成建立與開放存取。',
        };
      }
    }

    const [plans, posts, users, notifications, siteSettings] = await Promise.all([
      dbGetAllPlans(),
      dbGetAllPosts(),
      dbGetAllUsers(),
      dbGetAllNotifications(),
      getPersistedSiteSettings(),
    ]);

    return NextResponse.json({
      success: true,
      database: 'supabase',
      supabaseConfigured: true,
      supabaseHost: isCloud ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/https?:\/\//, '').split('/')[0] : null,
      counts: {
        plans: plans.length,
        posts: posts.length,
        users: users.length,
        notifications: notifications.length,
      },
      diagnostics,
      plans,
      posts,
      users,
      notifications,
      siteSettings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch database data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plans, posts, users, notifications } = body;

    if (Array.isArray(plans)) {
      await dbSavePlans(plans);
    }
    if (Array.isArray(posts)) {
      await dbSavePosts(posts);
    }
    if (Array.isArray(users)) {
      await dbSaveUsers(users);
    }
    if (Array.isArray(notifications)) {
      await dbSaveNotifications(notifications);
    }

    return NextResponse.json({
      success: true,
      message: 'Database synced successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync data' },
      { status: 500 }
    );
  }
}
