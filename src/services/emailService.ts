import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    // Priority: Brevo SMTP > Generic SMTP > Test Account
    const hasBrevoConfig = !!(
      process.env.BREVO_API_KEY || 
      (process.env.BREVO_SMTP_KEY && process.env.BREVO_SMTP_USER)
    );
    const hasSMTPConfig = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
    
    logger.info('Email service initialization:', {
      hasBrevoConfig,
      hasSMTPConfig,
      useBrevo: hasBrevoConfig
    });
    
    if (hasBrevoConfig) {
      // Use Brevo SMTP if configured (highest priority)
      this.initializeBrevoSMTP();
    } else if (hasSMTPConfig) {
      // Fallback to generic SMTP if available
      this.initializeTransporter();
    } else {
      // Fallback to nodemailer test account for development
      this.initializeTransporter();
    }
  }

  private async initializeBrevoSMTP() {
    try {
      // Brevo SMTP configuration
      // If BREVO_API_KEY is provided, we can use it as SMTP key
      // Otherwise, use BREVO_SMTP_KEY and BREVO_SMTP_USER
      const smtpKey = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY;
      const smtpUser = process.env.BREVO_SMTP_USER || process.env.BREVO_SMTP_EMAIL;
      
      if (!smtpKey || !smtpUser) {
        throw new Error(
          'Brevo SMTP configuration incomplete. Please set BREVO_SMTP_KEY (or BREVO_API_KEY) and BREVO_SMTP_USER (or BREVO_SMTP_EMAIL)'
        );
      }

      // Brevo SMTP settings - use smtp-relay.brevo.com for SMTP relay
      const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
      const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587');
      const isSecure = process.env.BREVO_SMTP_SECURE === 'true' || process.env.BREVO_SMTP_PORT === '465';

      const config: EmailConfig = {
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        auth: {
          user: smtpUser.trim(),
          pass: smtpKey.trim(),
        },
      };

      logger.info('Initializing Brevo SMTP transporter:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        keyLength: config.auth.pass.length,
      });

      this.transporter = nodemailer.createTransport(config);

      // Verify the connection
      await this.transporter.verify();
      logger.info('Brevo SMTP connection verified successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Brevo SMTP:', {
        error: error.message,
        code: error.code,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      });
      
      // Provide helpful error message
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        logger.error('Authentication failed. Please check:');
        logger.error('1. BREVO_SMTP_KEY is correct (get it from Brevo dashboard: Settings → SMTP & API)');
        logger.error('2. BREVO_SMTP_USER matches your Brevo account email');
        logger.error('3. Your sender email is verified in Brevo (Settings → Senders)');
        logger.error('4. SMTP key has not expired (generate a new one if needed)');
      }
      
      throw error;
    }
  }

  private async initializeTransporter() {
    try {
      // Check if SMTP configuration is provided
      const hasSMTPConfig = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      );

      if (hasSMTPConfig) {
        // Use provided SMTP configuration
        const config: EmailConfig = {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
          },
        };

        logger.info('Initializing SMTP transporter:', {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.auth.user,
        });

        this.transporter = nodemailer.createTransport(config);
      } else if (process.env.NODE_ENV !== 'production') {
        // Create a test account for development (only if SMTP not configured)
        logger.info('Creating test email account for development...');
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        logger.info('Email service initialized with test account:', {
          user: testAccount.user,
          pass: testAccount.pass,
          previewUrl: 'https://ethereal.email',
        });
      } else {
        throw new Error(
          'Email service configuration required for production. Please set either Brevo SMTP (BREVO_SMTP_KEY, BREVO_SMTP_USER) or SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) environment variables.'
        );
      }

      // Verify the connection
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendMagicLink(email: string, magicLink: string, userName?: string): Promise<void> {
    try {
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const loginUrl = `${appUrl}/auth/verify?token=${magicLink}`;
      await this.sendMagicLinkWithNodemailer(email, loginUrl, userName);
    } catch (error) {
      logger.error('Failed to send magic link email:', error);
      throw error;
    }
  }

  private async sendMagicLinkWithNodemailer(email: string, loginUrl: string, userName?: string): Promise<void> {
    const fromEmail = process.env.BREVO_FROM_EMAIL || 
                      process.env.SMTP_FROM_EMAIL || 
                      process.env.FROM_EMAIL || 
                      process.env.BREVO_SMTP_USER ||
                      process.env.SMTP_USER || 
                      'noreply@kanban.com';
    
    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME || 'Kanban'}" <${fromEmail}>`,
      to: email,
      subject: '🔗 Your Magic Link to Kanban',
      html: this.getMagicLinkHtmlTemplate(loginUrl, userName),
      text: this.getMagicLinkTextTemplate(loginUrl, userName),
    };

    const info = await this.transporter.sendMail(mailOptions);
    
    logger.info('Magic link email sent:', {
      messageId: info.messageId,
      email: email,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : undefined,
    });

    // Log the preview URL for development
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`📧 Preview email: ${previewUrl}`);
      }
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    try {
      await this.sendWelcomeEmailWithNodemailer(email, userName);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  private async sendWelcomeEmailWithNodemailer(email: string, userName: string): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 
                      process.env.SMTP_FROM_EMAIL || 
                      process.env.FROM_EMAIL || 
                      process.env.BREVO_SMTP_USER ||
                      process.env.SMTP_USER || 
                      'noreply@kanban.com';

    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME || 'Kanban'}" <${fromEmail}>`,
      to: email,
      subject: '🎉 Welcome to Kanban!',
      html: this.getWelcomeHtmlTemplate(userName, appUrl),
      text: this.getWelcomeTextTemplate(userName, appUrl),
    };

    const info = await this.transporter.sendMail(mailOptions);
    logger.info('Welcome email sent:', { messageId: info.messageId, email });
  }

  private getMagicLinkHtmlTemplate(loginUrl: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Magic Link Login</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f7fd;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #635fc7;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            text-align: center;
          }
          .magic-link-btn {
            display: inline-block;
            background: #635fc7;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 32px;
            font-weight: 700;
            font-size: 16px;
            margin: 30px 0;
            transition: all 0.2s ease;
          }
          .magic-link-btn:hover {
            background: #a8a4ff;
            transform: translateY(-2px);
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e4ebfa;
            font-size: 14px;
            color: #828fa3;
            text-align: center;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>📋 kanban</h1>
          </div>
          
          <div class="content">
            <h2>Welcome ${userName ? `back, ${userName}` : 'to Kanban'}! 👋</h2>
            <p>Click the button below to securely sign in to your account. This link will expire in 15 minutes for your security.</p>
            
            <a href="${loginUrl}" class="magic-link-btn">
              🔗 Sign In to Kanban
            </a>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link is unique to you and should not be shared with anyone. If you didn't request this login link, please ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px;">
              ${loginUrl}
            </p>
          </div>
          
          <div class="footer">
            <p>This link will expire in 15 minutes.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getMagicLinkTextTemplate(loginUrl: string, userName?: string): string {
    return `
Welcome ${userName ? `back, ${userName}` : 'to Kanban'}!

Click this link to sign in to your account: ${loginUrl}

This link will expire in 15 minutes for your security.

If you didn't request this login link, please ignore this email.

---
Kanban Team
    `.trim();
  }

  private getWelcomeHtmlTemplate(userName: string, appUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Kanban</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f7fd;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #635fc7;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            text-align: center;
          }
          .cta-btn {
            display: inline-block;
            background: #635fc7;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 32px;
            font-weight: 700;
            font-size: 16px;
            margin: 30px 0;
          }
          .features {
            text-align: left;
            margin: 30px 0;
          }
          .feature {
            margin: 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>📋 kanban</h1>
          </div>
          
          <div class="content">
            <h2>Welcome to Kanban, ${userName}! 🎉</h2>
            <p>We're excited to have you on board! Kanban helps you organize your projects and boost productivity with beautiful, intuitive boards.</p>
            
            <div class="features">
              <div class="feature">
                <strong>📋 Create Boards:</strong> Organize your projects with custom boards
              </div>
              <div class="feature">
                <strong>📝 Manage Tasks:</strong> Add, edit, and track tasks with drag-and-drop
              </div>
              <div class="feature">
                <strong>🎨 Customize:</strong> Personalize your workspace with themes and colors
              </div>
              <div class="feature">
                <strong>🔗 Share:</strong> Collaborate with your team using shareable board links
              </div>
            </div>
            
            <a href="${appUrl}" class="cta-btn">
              🚀 Start Using Kanban
            </a>
            
            <p>Happy organizing!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTextTemplate(userName: string, appUrl: string): string {
    return `
Welcome to Kanban, ${userName}!

We're excited to have you on board! Kanban helps you organize your projects and boost productivity.

Features:
• Create Boards: Organize your projects with custom boards
• Manage Tasks: Add, edit, and track tasks with drag-and-drop
• Customize: Personalize your workspace with themes and colors
• Share: Collaborate with your team using shareable board links

Get started: ${appUrl}

Happy organizing!
---
Kanban Team
    `.trim();
  }
}

export const emailService = new EmailService();