import { NextResponse } from 'next/server';
import { dbGetAllUsers, dbSaveResetCode } from '../../../../lib/db';
import { sendPasswordResetEmail } from '../../../../lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || '').trim().toLowerCase();

    if (!rawEmail) {
      return NextResponse.json(
        { error: '請輸入電子信箱' },
        { status: 400 }
      );
    }

    const allUsers = await dbGetAllUsers();
    const targetUser = allUsers.find(
      (u) => (u.email || '').trim().toLowerCase() === rawEmail
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: '找不到此電子信箱對應的帳號，請確認信箱是否正確。' },
        { status: 404 }
      );
    }

    // Generate 6-digit random verification code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    // Save to database (valid for 10 minutes)
    await dbSaveResetCode(targetUser.email, verificationCode, 600);

    // Send real email via SMTP
    const emailResult = await sendPasswordResetEmail(
      targetUser.email,
      targetUser.name,
      verificationCode
    );

    const deliveredTo = emailResult.recipientEmail || targetUser.email;

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        email: deliveredTo,
        targetEmail: deliveredTo,
        name: targetUser.name,
        targetName: targetUser.name,
        message: `📧 驗證碼已成功寄送至 ${deliveredTo}！請查看您的信箱收件夾（或垃圾郵件夾）。`,
      });
    }

    if (emailResult.isMock) {
      return NextResponse.json(
        {
          error:
            '系統尚未設定信箱郵件發送服務（SMTP）。請改用「聯繫管理員協助」管道，由管理同工為您提供臨時密碼。',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          '信件寄送失敗，請稍後再試，或使用「聯繫管理員協助」管道由管理同工為您提供臨時密碼。',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in send-reset-code API:', error);
    return NextResponse.json(
      { error: '寄送驗證碼時發生錯誤，請稍後再試。' },
      { status: 500 }
    );
  }
}
