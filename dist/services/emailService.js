"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("../utils/logger");
class EmailService {
    constructor() {
        // Check if SendGrid API key is available
        this.useSendGrid = !!process.env.SENDGRID_API_KEY;
        if (this.useSendGrid) {
            this.initializeSendGrid();
        }
        else {
            // Fallback to nodemailer for development
            this.initializeTransporter();
        }
    }
    initializeSendGrid() {
        try {
            const apiKey = process.env.SENDGRID_API_KEY;
            if (!apiKey) {
                throw new Error('SENDGRID_API_KEY is not defined in environment variables');
            }
            mail_1.default.setApiKey(apiKey);
            logger_1.logger.info('SendGrid email service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize SendGrid:', error);
            throw error;
        }
    }
    async initializeTransporter() {
        try {
            // Create a test account for development
            if (process.env.NODE_ENV !== 'production') {
                const testAccount = await nodemailer_1.default.createTestAccount();
                this.transporter = nodemailer_1.default.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                logger_1.logger.info('Email service initialized with test account:', {
                    user: testAccount.user,
                    pass: testAccount.pass,
                });
            }
            else {
                // Production email configuration
                const config = {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER || '',
                        pass: process.env.SMTP_PASS || '',
                    },
                };
                this.transporter = nodemailer_1.default.createTransport(config);
            }
            // Verify the connection
            await this.transporter.verify();
            logger_1.logger.info('Email service connection verified');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email service:', error);
            throw error;
        }
    }
    async sendMagicLink(email, magicLink, userName) {
        try {
            const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const loginUrl = `${appUrl}/auth/verify?token=${magicLink}`;
            if (this.useSendGrid) {
                await this.sendMagicLinkWithSendGrid(email, loginUrl, userName);
            }
            else {
                await this.sendMagicLinkWithNodemailer(email, loginUrl, userName);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send magic link email:', error);
            throw error;
        }
    }
    async sendMagicLinkWithSendGrid(email, loginUrl, userName) {
        const msg = {
            to: email,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'noreply@kanban.com',
                name: process.env.SENDGRID_FROM_NAME || 'Kanban'
            },
            subject: '🔗 Your Magic Link to Kanban',
            html: this.getMagicLinkHtmlTemplate(loginUrl, userName),
            text: this.getMagicLinkTextTemplate(loginUrl, userName),
        };
        const response = await mail_1.default.send(msg);
        logger_1.logger.info('Magic link sent via SendGrid:', {
            email,
            messageId: response[0].headers['x-message-id'],
        });
    }
    async sendMagicLinkWithNodemailer(email, loginUrl, userName) {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@kanban.com',
            to: email,
            subject: '🔗 Your Magic Link to Kanban',
            html: this.getMagicLinkHtmlTemplate(loginUrl, userName),
            text: this.getMagicLinkTextTemplate(loginUrl, userName),
        };
        const info = await this.transporter.sendMail(mailOptions);
        logger_1.logger.info('Magic link email sent:', {
            messageId: info.messageId,
            email: email,
            previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer_1.default.getTestMessageUrl(info) : undefined,
        });
        // Log the preview URL for development
        if (process.env.NODE_ENV !== 'production') {
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                logger_1.logger.info(`📧 Preview email: ${previewUrl}`);
            }
        }
    }
    async sendWelcomeEmail(email, userName) {
        try {
            if (this.useSendGrid) {
                await this.sendWelcomeEmailWithSendGrid(email, userName);
            }
            else {
                await this.sendWelcomeEmailWithNodemailer(email, userName);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send welcome email:', error);
            throw error;
        }
    }
    async sendWelcomeEmailWithSendGrid(email, userName) {
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const msg = {
            to: email,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'noreply@kanban.com',
                name: process.env.SENDGRID_FROM_NAME || 'Kanban'
            },
            subject: '🎉 Welcome to Kanban!',
            html: this.getWelcomeHtmlTemplate(userName, appUrl),
            text: this.getWelcomeTextTemplate(userName, appUrl),
        };
        const response = await mail_1.default.send(msg);
        logger_1.logger.info('Welcome email sent via SendGrid:', {
            email,
            messageId: response[0].headers['x-message-id'],
        });
    }
    async sendWelcomeEmailWithNodemailer(email, userName) {
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@kanban.com',
            to: email,
            subject: '🎉 Welcome to Kanban!',
            html: this.getWelcomeHtmlTemplate(userName, appUrl),
            text: this.getWelcomeTextTemplate(userName, appUrl),
        };
        const info = await this.transporter.sendMail(mailOptions);
        logger_1.logger.info('Welcome email sent:', { messageId: info.messageId, email });
    }
    getMagicLinkHtmlTemplate(loginUrl, userName) {
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
    getMagicLinkTextTemplate(loginUrl, userName) {
        return `
Welcome ${userName ? `back, ${userName}` : 'to Kanban'}!

Click this link to sign in to your account: ${loginUrl}

This link will expire in 15 minutes for your security.

If you didn't request this login link, please ignore this email.

---
Kanban Team
    `.trim();
    }
    getWelcomeHtmlTemplate(userName, appUrl) {
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
    getWelcomeTextTemplate(userName, appUrl) {
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
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map