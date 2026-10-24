/**
 * Database module for Morning Star Companions.
 * Uses 100% Supabase PostgreSQL cloud database exclusively.
 * Local SQLite engine and database files have been completely removed.
 */

export { hashPassword, verifyPassword } from './serverPassword';
export { isSupabaseConfigured } from './supabase';

import {
  supabaseGetAllPlans,
  supabaseSavePlans,
  supabaseDeletePlan,
  supabaseGetAllPosts,
  supabaseSavePosts,
  supabaseDeletePost,
  supabaseGetAllUsers,
  supabaseSaveUsers,
  supabaseDeleteUser,
  supabaseGetAllNotifications,
  supabaseSaveNotifications,
  supabaseDeleteNotification,
  supabaseSaveResetCode,
  supabaseVerifyAndConsumeResetCode,
  supabaseUpdateUserPassword,
} from './supabaseDb';

// Re-export standard database access functions directly bound to Supabase PostgreSQL
export const dbGetAllPlans = supabaseGetAllPlans;
export const dbSavePlans = supabaseSavePlans;
export const dbDeletePlan = supabaseDeletePlan;

export const dbGetAllPosts = supabaseGetAllPosts;
export const dbSavePosts = supabaseSavePosts;
export const dbDeletePost = supabaseDeletePost;

export const dbGetAllUsers = supabaseGetAllUsers;
export const dbSaveUsers = supabaseSaveUsers;
export const dbDeleteUser = supabaseDeleteUser;

export const dbGetAllNotifications = supabaseGetAllNotifications;
export const dbSaveNotifications = supabaseSaveNotifications;
export const dbDeleteNotification = supabaseDeleteNotification;

export const dbSaveResetCode = supabaseSaveResetCode;
export const dbVerifyAndConsumeResetCode = supabaseVerifyAndConsumeResetCode;
export const dbUpdateUserPassword = supabaseUpdateUserPassword;
