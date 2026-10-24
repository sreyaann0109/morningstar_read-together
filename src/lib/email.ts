import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isMock?: boolean;
  recipientEmail?: string;
}

/**
 * Returns an authenticated nodemailer SMTP Transporter, or null if SMTP env is missing.
 */
export function getSmtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a real password reset verification email via SMTP.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  recipientName: string,
  verificationCode: string
): Promise<SendEmailResult> {
  const transporter = getSmtpTransporter();
  const defaultSender = process.env.SMTP_USER || 'xu.hong9010@gmail.com';
  const defaultFrom = `晨星共行 (morningstar-read-together.vercel.app) <${defaultSender}>`;
  const rawFrom = process.env.SMTP_FROM || defaultFrom;
  const fromAddress = rawFrom.includes('<') ? rawFrom : `"晨星共行 (morningstar-read-together.vercel.app)" <${rawFrom}>`;

  // Support forwarding all emails to a designated Gmail account (e.g. for development or testing)
  const finalRecipient = (process.env.TEST_GMAIL_RECIPIENT || '').trim() || toEmail;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e7e5e4; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 38px;">🌅</span>
        <h2 style="color: #78350f; margin: 8px 0 4px 0; font-size: 22px; font-weight: 700;">晨星共行 · 密碼重設驗證碼</h2>
        <p style="color: #78716c; font-size: 13px; margin: 0; font-style: italic;">「直等到天發亮，晨星在你們心裏出現。」（彼後一19）</p>
      </div>

      <p style="color: #292524; font-size: 14px; line-height: 1.6;">
        親愛的 <strong>${recipientName}</strong> 聖徒，您好：
      </p>
      <p style="color: #57534e; font-size: 13px; line-height: 1.6;">
        我們收到了您在「晨星共行」平台重設密碼的申請。請在驗證碼輸入欄填寫以下 6 位數驗證碼：
      </p>

      <div style="text-align: center; margin: 26px 0; padding: 20px; background-color: #fef3c7; border: 1.5px dashed #d97706; border-radius: 14px;">
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #92400e; font-family: monospace;">${verificationCode}</div>
        <div style="color: #b45309; font-size: 12px; margin-top: 8px; font-weight: 500;">⏱️ 驗證碼有效期限為 10 分鐘，請勿洩漏給他人</div>
      </div>

      <div style="text-align: center; margin: 20px 0 24px 0;">
        <a href="https://morningstar-read-together.vercel.app/" target="_blank" style="display: inline-block; padding: 11px 26px; background-color: #d97706; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);">
          🌟 前往 晨星共行 平台
        </a>
      </div>

      <p style="color: #78716c; font-size: 12px; line-height: 1.6;">
        若非您本人申請重設密碼，請直接忽略此郵件，您的帳號仍然十分安全。
      </p>

      <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 24px 0;" />
      
      <p style="text-align: center; color: #a8a29e; font-size: 11px; margin: 0;">
        晨星共行 (morningstar-read-together.vercel.app) · 與清心呼求主的人一同竭力追求
      </p>
    </div>
  `;

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP_NOT_CONFIGURED',
      isMock: true,
      recipientEmail: finalRecipient,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: finalRecipient,
      subject: `【晨星共行】您的密碼重設驗證碼：${verificationCode}`,
      html: htmlContent,
      text: `親愛的 ${recipientName} 聖徒，您的密碼重設驗證碼為：${verificationCode}（10 分鐘內有效）。`,
    });
    return {
      success: true,
      messageId: info.messageId,
      recipientEmail: finalRecipient,
    };
  } catch (err: any) {
    console.error('[Email] Failed to send email via SMTP:', err);
    return {
      success: false,
      error: err.message || 'SMTP_SEND_FAILED',
      recipientEmail: finalRecipient,
    };
  }
}
