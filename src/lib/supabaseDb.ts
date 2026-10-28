import { getSupabase } from './supabase';
import { PursuitPlan, SharingPost, UserProfile, AppNotification } from '../types';
import { initialPlans, initialPosts, demoUsers, initialNotifications } from '../data/initialData';
import { hashPassword } from './serverPassword';

// ==========================================
// Plans operations in Supabase
// ==========================================

export async function supabaseGetAllPlans(): Promise<PursuitPlan[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching plans from Supabase:', error);
    return [];
  }

  // Return empty array if Supabase plans table is empty
  if (data.length === 0) {
    return [];
  }

  return data.map((r: any) => {
    const speedDaysMatch = typeof r.summary === 'string' ? r.summary.match(/\[speedDays:(\d+)\]/) : null;
    const speedDays = speedDaysMatch ? parseInt(speedDaysMatch[1], 10) : (r.category === 'nt-speed-reading' ? 60 : undefined);
    const cleanSummary = typeof r.summary === 'string' ? r.summary.replace(/\[speedDays:\d+\]/g, '').trim() : r.summary;

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      unitName: r.unit_name || (r.category === 'bible' ? '章' : '篇'),
      description: r.description,
      totalUnits: Number(r.total_units) || 0,
      completedUnits: Number(r.completed_units) || 0,
      currentUnitTitle: r.current_unit_title,
      currentVerses: r.current_verses,
      summary: cleanSummary || undefined,
      startDate: r.start_date,
      endDate: r.end_date,
      speedDays,
      inviteCode: r.invite_code,
      adminId: r.admin_id,
      adminName: r.admin_name,
      members: Array.isArray(r.members_json) ? r.members_json : (typeof r.members_json === 'string' ? JSON.parse(r.members_json || '[]') : []),
    };
  });
}

export async function supabaseSavePlans(plans: PursuitPlan[], fullSync = true) {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();

  if (fullSync) {
    const planIds = plans.map((p) => p.id);
    if (planIds.length === 0) {
      await supabase.from('plans').delete().neq('id', '___all___');
      await supabase.from('posts').delete().neq('id', '___all___');
      await supabase.from('notifications').delete().neq('id', '___all___');
    } else {
      // Delete removed plans
      await supabase.from('plans').delete().not('id', 'in', `(${planIds.join(',')})`);
      await supabase.from('posts').delete().not('plan_id', 'in', `(${planIds.join(',')})`);
      await supabase.from('notifications').delete().not('plan_id', 'in', `(${planIds.join(',')})`);
    }
  }

  if (plans.length === 0) return;

  const rows = plans.map((p) => {
    const cleanSummary = (p.summary || '').replace(/\[speedDays:\d+\]/g, '').trim();
    const encodedSummary = (cleanSummary + (p.speedDays ? ` [speedDays:${p.speedDays}]` : '')).trim();

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      unit_name: p.unitName || (p.category === 'bible' ? '章' : '篇'),
      description: p.description || '',
      total_units: p.totalUnits,
      completed_units: p.completedUnits,
      current_unit_title: p.currentUnitTitle || '',
      current_verses: p.currentVerses || '',
      summary: encodedSummary,
      start_date: p.startDate || '',
      end_date: p.endDate || '',
      invite_code: p.inviteCode || '',
      admin_id: p.adminId || '',
      admin_name: p.adminName || '',
      members_json: p.members || [],
      updated_at: now,
    };
  });

  const { error } = await supabase.from('plans').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting plans to Supabase:', error);
  }
}

export async function supabaseDeletePlan(planId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('plans').delete().eq('id', planId);
  await supabase.from('posts').delete().eq('plan_id', planId);
  await supabase.from('notifications').delete().eq('plan_id', planId);
}

// ==========================================
// Posts operations in Supabase
// ==========================================

export async function supabaseGetAllPosts(): Promise<SharingPost[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching posts from Supabase:', error);
    return [];
  }

  // Return empty array if Supabase posts table is empty
  if (data.length === 0) {
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    authorRole: r.author_role || '同伴',
    authorAvatar: r.author_avatar,
    planId: r.plan_id || undefined,
    planTitle: r.plan_title,
    unitTitle: r.unit_title,
    keyVerse: r.key_verse || '',
    reflection: r.reflection,
    tags: Array.isArray(r.tags_json) ? r.tags_json : (typeof r.tags_json === 'string' ? JSON.parse(r.tags_json || '[]') : []),
    createdAt: r.created_at,
    reactions: r.reactions_json && typeof r.reactions_json === 'object' ? r.reactions_json : { amenCount: 0, prayCount: 0 },
    comments: Array.isArray(r.comments_json) ? r.comments_json : (typeof r.comments_json === 'string' ? JSON.parse(r.comments_json || '[]') : []),
  }));
}

export async function supabaseSavePosts(posts: SharingPost[], fullSync = true) {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();

  if (fullSync) {
    const postIds = posts.map((p) => p.id);
    if (postIds.length === 0) {
      await supabase.from('posts').delete().neq('id', '___all___');
    } else {
      await supabase.from('posts').delete().not('id', 'in', `(${postIds.join(',')})`);
    }
  }

  if (posts.length === 0) return;

  const rows = posts.map((p) => ({
    id: p.id,
    author_id: p.authorId,
    author_name: p.authorName,
    author_role: p.authorRole || '同伴',
    author_avatar: p.authorAvatar || '',
    plan_id: p.planId || null,
    plan_title: p.planTitle || '',
    unit_title: p.unitTitle || '',
    key_verse: p.keyVerse || '',
    reflection: p.reflection || '',
    tags_json: p.tags || [],
    created_at: p.createdAt || now,
    reactions_json: p.reactions || { amenCount: 0, prayCount: 0 },
    comments_json: p.comments || [],
    updated_at: now,
  }));

  const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting posts to Supabase:', error);
  }
}

export async function supabaseDeletePost(postId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('posts').delete().eq('id', postId);
}

// ==========================================
// Users operations in Supabase
// ==========================================

export async function supabaseGetAllUsers(): Promise<UserProfile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching users from Supabase:', error);
    return [];
  }

  // Auto-seed if Supabase users table is empty
  if (data.length === 0) {
    try {
      await supabaseSaveUsers(demoUsers);
      return demoUsers;
    } catch (e) {
      console.error('Auto-seed users error:', e);
    }
  }

  return data.map((r: any) => {
    const rawSanctuary = r.sanctuary_json && typeof r.sanctuary_json === 'object' ? r.sanctuary_json : undefined;
    const tempPassword = rawSanctuary?._tempPassword || undefined;
    const joinedInviteCodes = Array.isArray(rawSanctuary?._joinedInviteCodes) ? rawSanctuary._joinedInviteCodes : undefined;
    const planSanctuaries = rawSanctuary?._planSanctuaries && typeof rawSanctuary._planSanctuaries === 'object' ? rawSanctuary._planSanctuaries : undefined;
    const dailyHistory = rawSanctuary?._dailyHistory && typeof rawSanctuary._dailyHistory === 'object' ? rawSanctuary._dailyHistory : undefined;
    const planDailyHistory = rawSanctuary?._planDailyHistory && typeof rawSanctuary._planDailyHistory === 'object' ? rawSanctuary._planDailyHistory : undefined;

    let cleanSanctuary = undefined;
    if (rawSanctuary) {
      const { _tempPassword, _previousPassword, _joinedInviteCodes, _planSanctuaries, _dailyHistory, _planDailyHistory, ...rest } = rawSanctuary;
      if (Object.keys(rest).length > 0 && (rest.theme !== undefined || rest.placedRelicIds !== undefined || rest.motto !== undefined || rest.treeStage !== undefined)) {
        cleanSanctuary = rest as any;
      }
    }
    const previousPassword = rawSanctuary?._previousPassword || undefined;

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      password: r.password,
      tempPassword,
      previousPassword,
      joinedInviteCodes,
      locality: r.locality,
      streakDays: Number(r.streak_days) || 0,
      totalChaptersRead: Number(r.total_chapters_read) || 0,
      totalSharesCount: Number(r.total_shares_count) || 0,
      totalAmenReceived: Number(r.total_amen_received) || 0,
      avatar: r.avatar,
      role: r.role,
      displayMode: r.display_mode,
      sanctuary: cleanSanctuary,
      planSanctuaries,
      dailyHistory,
      planDailyHistory,
      passwordResetRequested: Boolean(r.password_reset_requested),
      mustChangePassword: Boolean(r.must_change_password),
    };
  });
}

export async function supabaseSaveUsers(users: UserProfile[], fullSync = false) {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();

  if (fullSync) {
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      const { error: delError } = await supabase
        .from('users')
        .delete()
        .not('id', 'in', `(${userIds.join(',')})`);
      if (delError) {
        console.error('Error reconciling removed users in Supabase:', delError);
      }
    }
  }

  if (users.length === 0) return;

  const rows = users.map((u) => {
    const rawSanctuaryConfig = u.sanctuary || {};
    const cleanSanctuaryConfig: Record<string, any> = {};
    Object.keys(rawSanctuaryConfig).forEach((k) => {
      if (!k.startsWith('_')) {
        cleanSanctuaryConfig[k] = (rawSanctuaryConfig as any)[k];
      }
    });

    const packedSanctuary = {
      ...cleanSanctuaryConfig,
      _dailyHistory: u.dailyHistory || {},
      _planDailyHistory: u.planDailyHistory || {},
      ...(u.planSanctuaries ? { _planSanctuaries: u.planSanctuaries } : {}),
      ...(u.tempPassword ? { _tempPassword: u.tempPassword } : {}),
      ...(u.previousPassword ? { _previousPassword: u.previousPassword } : {}),
      ...(u.joinedInviteCodes ? { _joinedInviteCodes: u.joinedInviteCodes } : {}),
    };

    return {
      id: u.id,
      name: u.name,
      email: (u.email || '').toLowerCase().trim(),
      password: hashPassword(u.password || ''),
      locality: u.locality || '',
      streak_days: u.streakDays ?? 0,
      total_chapters_read: u.totalChaptersRead ?? 0,
      total_shares_count: u.totalSharesCount ?? 0,
      total_amen_received: u.totalAmenReceived ?? 0,
      avatar: u.avatar || '🌱',
      role: u.role || 'user',
      display_mode: u.displayMode || 'light',
      sanctuary_json: packedSanctuary,
      password_reset_requested: Boolean(u.passwordResetRequested),
      must_change_password: Boolean(u.mustChangePassword),
      updated_at: now,
    };
  });

  const { error } = await supabase.from('users').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting users to Supabase:', error);
  }
}

export async function supabaseDeleteUser(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('users').delete().eq('id', userId);
  await supabase.from('notifications').delete().eq('recipient_user_id', userId);

  // Also remove user from members_json across all plans in Supabase
  try {
    const { data: plansData } = await supabase.from('plans').select('id, members_json');
    if (plansData && plansData.length > 0) {
      for (const p of plansData) {
        const members = Array.isArray(p.members_json)
          ? p.members_json
          : (typeof p.members_json === 'string' ? JSON.parse(p.members_json || '[]') : []);
        const nextMembers = members.filter((m: any) => m.userId !== userId);
        if (nextMembers.length !== members.length) {
          await supabase
            .from('plans')
            .update({ members_json: nextMembers, updated_at: new Date().toISOString() })
            .eq('id', p.id);
        }
      }
    }
  } catch (e) {
    console.error('Error removing user from plans in Supabase:', e);
  }
}

// ==========================================
// Notifications operations in Supabase
// ==========================================

export async function supabaseGetAllNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching notifications from Supabase:', error);
    return [];
  }

  // Return empty array if Supabase notifications table is empty
  if (data.length === 0) {
    return [];
  }

  return data
    .filter((r: any) => r.id !== 'notif-1' && r.id !== 'notif-2')
    .map((r: any) => ({
      id: r.id,
      recipientUserId: r.recipient_user_id || undefined,
      planId: r.plan_id || undefined,
      actorName: r.actor_name,
      actorAvatar: r.actor_avatar,
      type: r.type,
      targetTitle: r.target_title,
      createdAt: r.created_at,
      read: Boolean(r.read),
    }));
}

export async function supabaseSaveNotifications(notifs: AppNotification[], fullSync = true) {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();

  if (fullSync) {
    const notifIds = notifs.map((n) => n.id);
    if (notifIds.length === 0) {
      await supabase.from('notifications').delete().neq('id', '___all___');
    } else {
      await supabase.from('notifications').delete().not('id', 'in', `(${notifIds.join(',')})`);
    }
  }

  if (notifs.length === 0) return;

  const rows = notifs.map((n) => ({
    id: n.id,
    recipient_user_id: n.recipientUserId || null,
    plan_id: n.planId || null,
    actor_name: n.actorName || '',
    actor_avatar: n.actorAvatar || '',
    type: n.type,
    target_title: n.targetTitle || '',
    created_at: n.createdAt || now,
    read: Boolean(n.read),
    updated_at: now,
  }));

  const { error } = await supabase.from('notifications').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting notifications to Supabase:', error);
  }
}

export async function supabaseDeleteNotification(id?: string, recipientUserId?: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  if (id) {
    await supabase.from('notifications').delete().eq('id', id);
  } else if (recipientUserId) {
    await supabase.from('notifications').delete().eq('recipient_user_id', recipientUserId);
  } else {
    await supabase.from('notifications').delete().neq('id', '___all___');
  }
}

// ==========================================
// Password Reset Verification Codes in Supabase
// ==========================================

export async function supabaseSaveResetCode(email: string, code: string, ttlSeconds = 600) {
  const supabase = getSupabase();
  if (!supabase) return;

  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const createdAt = new Date().toISOString();

  await supabase.from('password_reset_codes').upsert(
    {
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
      created_at: createdAt,
    },
    { onConflict: 'email' }
  );
}

export async function supabaseVerifyAndConsumeResetCode(email: string, inputCode: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('password_reset_codes')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) return false;

  const now = Date.now();
  if (data.expires_at < now) {
    await supabase.from('password_reset_codes').delete().eq('email', normalizedEmail);
    return false;
  }

  if (data.code !== inputCode.trim()) {
    return false;
  }

  // Consume code
  await supabase.from('password_reset_codes').delete().eq('email', normalizedEmail);
  return true;
}

export async function supabaseUpdateUserPassword(email: string, newHashedPassword: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase
    .from('users')
    .update({
      password: newHashedPassword,
      password_reset_requested: false,
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalizedEmail);

  return !error;
}
