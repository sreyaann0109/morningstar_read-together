import { NextResponse } from 'next/server';
import { dbGetAllUsers, dbSaveUsers, dbDeleteUser } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await dbGetAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const users = Array.isArray(body) ? body : [body];
    await dbSaveUsers(users);
    return NextResponse.json({ success: true, message: 'Users saved to cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
    }
    await dbDeleteUser(userId);
    return NextResponse.json({ success: true, message: 'User deleted from cloud database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
