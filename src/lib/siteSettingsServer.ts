import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../types';
import { getSupabase } from './supabase';
import fs from 'fs';
import path from 'path';

const LOCAL_SETTINGS_FILE = path.join(process.cwd(), 'src/data/persistedSettings.json');

export interface TimestampedSettings extends SiteSettings {
  _updatedAt?: number;
}

export function stripInternalFields(settings: TimestampedSettings): SiteSettings {
  const { _updatedAt, ...clean } = settings;
  return { ...DEFAULT_SITE_SETTINGS, ...clean };
}

function readLocalSettingsFile(): TimestampedSettings | null {
  try {
    if (fs.existsSync(LOCAL_SETTINGS_FILE)) {
      const content = fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SITE_SETTINGS, ...parsed };
    }
  } catch (e) {}
  return null;
}

function writeLocalSettingsFile(settings: TimestampedSettings) {
  try {
    const dir = path.dirname(LOCAL_SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {}
}

let inMemorySettings: TimestampedSettings = readLocalSettingsFile() || {
  ...DEFAULT_SITE_SETTINGS,
  _updatedAt: 0,
};

export async function getPersistedSiteSettings(): Promise<SiteSettings> {
  const local = readLocalSettingsFile();
  if (local && (local._updatedAt || 0) >= (inMemorySettings._updatedAt || 0)) {
    inMemorySettings = local;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      // 1. 嘗試由既有的 user_state 表取得 (複合主鍵 user_id + state_key)
      try {
        const { data, error } = await supabase
          .from('user_state')
          .select('value_json')
          .eq('user_id', '__global__')
          .eq('state_key', 'site_settings')
          .maybeSingle();

        if (!error && data && data.value_json && typeof data.value_json === 'object') {
          const remote: TimestampedSettings = { ...DEFAULT_SITE_SETTINGS, ...data.value_json };
          const remoteTs = remote._updatedAt || 0;
          const localTs = inMemorySettings._updatedAt || 0;
          if (remoteTs >= localTs) {
            inMemorySettings = remote;
            writeLocalSettingsFile(remote);
          } else if (localTs > remoteTs) {
            await supabase
              .from('user_state')
              .upsert(
                {
                  user_id: '__global__',
                  state_key: 'site_settings',
                  value_json: inMemorySettings,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,state_key' }
              );
          }
          return stripInternalFields(inMemorySettings);
        }
      } catch (e) {}

      // 2. 嘗試由專屬 site_settings 表取得
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('settings_json')
          .eq('id', 'global')
          .maybeSingle();

        if (!error && data && data.settings_json && typeof data.settings_json === 'object') {
          const remote: TimestampedSettings = { ...DEFAULT_SITE_SETTINGS, ...data.settings_json };
          const remoteTs = remote._updatedAt || 0;
          const localTs = inMemorySettings._updatedAt || 0;
          if (remoteTs >= localTs) {
            inMemorySettings = remote;
            writeLocalSettingsFile(remote);
          }
          return stripInternalFields(inMemorySettings);
        }
      } catch (e) {}
    }
  } catch (e) {}

  return stripInternalFields(inMemorySettings);
}

export async function savePersistedSiteSettings(body: Partial<SiteSettings>): Promise<SiteSettings> {
  const nowTs = Date.now();
  const newSettings: TimestampedSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...body,
    _updatedAt: nowTs,
  };
  inMemorySettings = newSettings;
  writeLocalSettingsFile(newSettings);

  const supabase = getSupabase();
  if (supabase) {
    // 1. 寫入 user_state (必須指定複合主鍵 onConflict: 'user_id,state_key')
    try {
      const { error: upsertErr } = await supabase
        .from('user_state')
        .upsert(
          {
            user_id: '__global__',
            state_key: 'site_settings',
            value_json: newSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,state_key' }
        );

      if (upsertErr) {
        await supabase
          .from('user_state')
          .update({
            value_json: newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', '__global__')
          .eq('state_key', 'site_settings');
      }
    } catch (e) {}

    // 2. 寫入 site_settings (若有建立此表)
    try {
      await supabase
        .from('site_settings')
        .upsert(
          {
            id: 'global',
            settings_json: newSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    } catch (e) {}
  }

  return stripInternalFields(newSettings);
}
