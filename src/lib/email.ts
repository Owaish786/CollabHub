import nodemailer from "nodemailer";

interface SendLoginEmailParams {
  to: string;
  name: string;
  ip?: string;
  userAgent?: string;
}

export async function sendLoginNotificationEmail({ to, name, ip, userAgent }: SendLoginEmailParams) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP configuration is missing. Skipping email notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #6366f1; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CollabHub</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="color: #111827; margin-top: 0;">New Login Detected</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          We noticed a new login to your CollabHub account. If this was you, no further action is needed.
        </p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>Time:</strong> ${timestamp}</p>
          ${ip ? `<p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>IP Address:</strong> ${ip}</p>` : ""}
          ${userAgent ? `<p style="margin: 0; color: #374151; font-size: 14px;"><strong>Device:</strong> ${userAgent}</p>` : ""}
        </div>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 0;">
          If you didn't authorize this login, please secure your account immediately or contact support.
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} CollabHub. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || `"CollabHub" <${SMTP_USER}>`,
      to,
      subject: "Security Alert: New login to CollabHub",
      html,
    });
    console.log(`Login notification email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send login notification email:", error);
  }
}

interface SendWorkspaceInviteParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
}

export async function sendWorkspaceInviteEmail({ to, inviterName, workspaceName, inviteLink }: SendWorkspaceInviteParams) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP configuration is missing. Skipping invite email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #6366f1; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CollabHub</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; text-align: center;">
        <h2 style="color: #111827; margin-top: 0;">You've been invited!</h2>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on CollabHub.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${inviteLink}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inviteLink}" style="color: #6366f1; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} CollabHub. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || `"CollabHub" <${SMTP_USER}>`,
      to,
      subject: `Invitation to join ${workspaceName} on CollabHub`,
      html,
    });
    console.log(`Workspace invite email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send workspace invite email:", error);
  }
}
