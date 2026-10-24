import { NextResponse } from 'next/server';
import { dbGetAllNotifications, dbSaveNotifications, dbDeleteNotification } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notifications = await dbGetAllNotifications();
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notifications = Array.isArray(body) ? body : [body];
    await dbSaveNotifications(notifications);
    return NextResponse.json({ success: true, message: 'Notifications saved to cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || undefined;
    const recipientUserId = searchParams.get('recipientUserId') || undefined;
    await dbDeleteNotification(id, recipientUserId);
    return NextResponse.json({ success: true, message: 'Notifications deleted from cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
