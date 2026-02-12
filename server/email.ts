import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ============================================================================
// EMAIL PROVIDER INTERFACE
// ============================================================================

export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// RESEND INTEGRATION ADAPTER (VIA REPLIT CONNECTOR)
// ============================================================================

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings || !connectionSettings.settings?.api_key) {
      return null;
    }

    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email
    };
  } catch (error) {
    console.error('[Resend Integration] Failed to fetch credentials:', error);
    return null;
  }
}

export class ResendIntegrationAdapter implements EmailProvider {
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const credentials = await getResendCredentials();
      
      if (!credentials) {
        return {
          success: false,
          error: 'Resend integration not configured',
        };
      }

      const resend = new Resend(credentials.apiKey);
      
      const data = await resend.emails.send({
        from: credentials.fromEmail || params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (data.error) {
        console.error('[Resend Integration] Failed to send email:', data.error);
        return {
          success: false,
          error: data.error.message,
        };
      }

      return {
        success: true,
        messageId: data.data?.id,
      };
    } catch (error: any) {
      console.error('[Resend Integration] Exception:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getFromEmail(): Promise<string | null> {
    const credentials = await getResendCredentials();
    return credentials?.fromEmail || null;
  }
}

// ============================================================================
// RESEND ADAPTER (MANUAL API KEY)
// ============================================================================

export class ResendAdapter implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const resend = new Resend(this.apiKey);
      
      const data = await resend.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (data.error) {
        console.error('[Resend] Failed to send email:', data.error);
        return {
          success: false,
          error: data.error.message,
        };
      }

      return {
        success: true,
        messageId: data.data?.id,
      };
    } catch (error: any) {
      console.error('[Resend] Exception:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================================================
// SMTP ADAPTER (FALLBACK)
// ============================================================================

export class SMTPAdapter implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('[SMTP] Failed to send email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

export async function createEmailProvider(): Promise<EmailProvider | null> {
  // First, try to use Resend integration if available
  const credentials = await getResendCredentials();
  if (credentials) {
    console.log('[Email] Using Resend integration provider');
    return new ResendIntegrationAdapter();
  }

  // Fall back to manual configuration
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY not configured and no Resend integration found');
      return null;
    }
    console.log('[Email] Using Resend provider with manual API key');
    return new ResendAdapter(apiKey);
  }

  if (provider === 'smtp') {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      console.warn('[Email] SMTP configuration incomplete');
      return null;
    }

    console.log('[Email] Using SMTP provider');
    return new SMTPAdapter({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  console.warn(`[Email] Unknown provider: ${provider}`);
  return null;
}

// ============================================================================
// BILINGUAL EMAIL TEMPLATES
// ============================================================================

export interface PasswordResetTemplateData {
  userEmail: string;
  resetLink: string;
  expiryHours: number;
}

export function generatePasswordResetEmail(data: PasswordResetTemplateData): { html: string; text: string } {
  const { resetLink, expiryHours } = data;

  const html = `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset / إعادة تعيين كلمة المرور</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .content {
      margin: 30px 0;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .arabic {
      direction: rtl;
      text-align: right;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning.arabic {
      border-left: none;
      border-right: 4px solid #ffc107;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .link {
      color: #667eea;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">BlindSpot System (BSS)</div>
      <div class="subtitle">Business Management System</div>
    </div>

    <!-- English Section -->
    <div class="content">
      <div class="section">
        <div class="section-title">Password Reset Request</div>
        <p>We received a request to reset your password for your BSS account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">${resetLink}</p>
      </div>

      <div class="warning">
        <strong>⚠️ Important Security Information:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will not change until you click the link above</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>
    </div>

    <!-- Arabic Section -->
    <div class="content arabic">
      <div class="section">
        <div class="section-title">طلب إعادة تعيين كلمة المرور</div>
        <p>تلقينا طلبًا لإعادة تعيين كلمة المرور لحساب BSS الخاص بك.</p>
        <p>انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
        </div>
        <p>أو انسخ والصق هذا الرابط في متصفحك:</p>
        <p class="link">${resetLink}</p>
      </div>

      <div class="warning arabic">
        <strong>⚠️ معلومات أمنية مهمة:</strong>
        <ul style="margin: 10px 0; padding-right: 20px; padding-left: 0;">
          <li>ستنتهي صلاحية هذا الرابط خلال ${expiryHours === 1 ? 'ساعة واحدة' : `${expiryHours} ساعات`}</li>
          <li>إذا لم تطلب إعادة التعيين هذه، يرجى تجاهل هذا البريد الإلكتروني</li>
          <li>لن تتغير كلمة المرور حتى تنقر على الرابط أعلاه</li>
          <li>لا تشارك هذا الرابط مع أي شخص</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>BlindSpot System (BSS) - Business Management Platform</p>
      <p>IT@kinbss.org</p>
      <!-- TODO: Update sender email domain when new domain is available -->
      <p>This is an automated email, please do not reply / هذا بريد إلكتروني تلقائي، يرجى عدم الرد</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Password Reset Request / طلب إعادة تعيين كلمة المرور

BlindSpot System (BSS) - Business Management System

ENGLISH:
We received a request to reset your password for your BSS account.

Reset your password by visiting this link:
${resetLink}

IMPORTANT SECURITY INFORMATION:
- This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}
- If you didn't request this reset, please ignore this email
- Your password will not change until you click the link above
- Never share this link with anyone

---

العربية:
تلقينا طلبًا لإعادة تعيين كلمة المرور لحساب BSS الخاص بك.

أعد تعيين كلمة المرور بزيارة هذا الرابط:
${resetLink}

معلومات أمنية مهمة:
- ستنتهي صلاحية هذا الرابط خلال ${expiryHours === 1 ? 'ساعة واحدة' : `${expiryHours} ساعات`}
- إذا لم تطلب إعادة التعيين هذه، يرجى تجاهل هذا البريد الإلكتروني
- لن تتغير كلمة المرور حتى تنقر على الرابط أعلاه
- لا تشارك هذا الرابط مع أي شخص

---

BlindSpot System (BSS) - Business Management Platform
IT@kinbss.org

This is an automated email, please do not reply.
هذا بريد إلكتروني تلقائي، يرجى عدم الرد.
  `;

  return { html, text };
}

// ============================================================================
// PASSWORD RESET MAILER
// ============================================================================

export class PasswordResetMailer {
  private async getProvider(): Promise<EmailProvider | null> {
    return await createEmailProvider();
  }

  private async getFromEmail(): Promise<string> {
    // Try to get from email from Resend integration first
    const credentials = await getResendCredentials();
    if (credentials?.fromEmail) {
      return credentials.fromEmail;
    }
    // Fall back to environment variables
    return process.env.EMAIL_FROM || process.env.IT_EMAIL || 'IT@kinbss.org';
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    baseUrl: string
  ): Promise<EmailResult> {
    const provider = await this.getProvider();
    
    if (!provider) {
      console.error('[PasswordResetMailer] No email provider configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const fromEmail = await this.getFromEmail();
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const { html, text } = generatePasswordResetEmail({
      userEmail: toEmail,
      resetLink,
      expiryHours: 1,
    });

    const result = await provider.sendEmail({
      to: toEmail,
      from: fromEmail,
      subject: 'Password Reset Request / طلب إعادة تعيين كلمة المرور - BSS',
      html,
      text,
    });

    if (result.success) {
      console.log(`[PasswordResetMailer] Password reset email sent to ${toEmail} (ID: ${result.messageId})`);
    } else {
      console.error(`[PasswordResetMailer] Failed to send email to ${toEmail}: ${result.error}`);
    }

    return result;
  }
}
