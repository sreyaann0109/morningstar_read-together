import { NextResponse } from 'next/server';
import { dbVerifyAndConsumeResetCode, dbUpdateUserPassword, hashPassword } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || '').trim().toLowerCase();
    const rawCode = (body.code || '').trim();
    const newPassword = body.newPassword || '';

    if (!rawEmail || !rawCode || !newPassword) {
      return NextResponse.json(
        { error: '請完整填寫信箱、驗證碼與新密碼。' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密碼長度請至少設定 6 位字元。' },
        { status: 400 }
      );
    }

    // Verify and consume code from database
    const isValid = await dbVerifyAndConsumeResetCode(rawEmail, rawCode);
    if (!isValid) {
      return NextResponse.json(
        { error: '驗證碼輸入不正確或已過期，請重新確認或重新寄送。' },
        { status: 400 }
      );
    }

    // Hash new password and update user in database
    const hashedPassword = hashPassword(newPassword);
    const updated = await dbUpdateUserPassword(rawEmail, hashedPassword);

    if (!updated) {
      return NextResponse.json(
        { error: '找不到對應的使用者帳號，密碼更新失敗。' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '🎉 密碼已成功更新！請使用全新密碼登入。',
    });
  } catch (error: any) {
    console.error('Error in verify-reset-code API:', error);
    return NextResponse.json(
      { error: '驗證或更新密碼時發生錯誤，請稍後再試。' },
      { status: 500 }
    );
  }
}
