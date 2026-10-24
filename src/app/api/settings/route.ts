import { NextResponse } from 'next/server';
import { DEFAULT_SITE_SETTINGS } from '../../../types';
import { getPersistedSiteSettings, savePersistedSiteSettings } from '../../../lib/siteSettingsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPersistedSiteSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SITE_SETTINGS,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = await savePersistedSiteSettings(body);
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || '儲存全站設定失敗' },
      { status: 500 }
    );
  }
}
