import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.config.get<string>('SMTP_HOST') || 'localhost';
    const port = Number(this.config.get<number>('SMTP_PORT')) || 1025;
    const user = this.config.get<string>('SMTP_USER') || '';
    const pass = this.config.get<string>('SMTP_PASSWORD') || '';

    const options: any = {
      host,
      port,
      secure: port === 465,
    };

    if (user && pass) {
      options.auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(options);
  }

  /**
   * Dispatches the verification email containing the OTP code.
   * Utilizes Resend API (default) or falls back to SMTP/Nodemailer based on configurations.
   */
  async sendOtpMail(to: string, code: string) {
    const provider = this.config.get<string>('EMAIL_PROVIDER') || 'resend';
    const subject = 'Momentum AI Verification Code';
    const htmlContent = this.getOtpEmailTemplate(code);

    if (provider === 'resend') {
      const apiKey = this.config.get<string>('RESEND_API_KEY');
      const from = this.config.get<string>('RESEND_FROM') || 'onboarding@resend.dev';

      if (apiKey) {
        try {
          await axios.post(
            'https://api.resend.com/emails',
            {
              from,
              to: [to],
              subject,
              html: htmlContent,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
          this.logger.log(`OTP verification email sent via Resend API successfully to ${to}`);
          return;
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message;
          this.logger.error(`Resend API failed: ${errMsg}. Falling back to Nodemailer SMTP...`);
        }
      } else {
        this.logger.warn('RESEND_API_KEY missing. Falling back to Nodemailer SMTP...');
      }
    }

    // Nodemailer SMTP fallback delivery
    const from = this.config.get<string>('SMTP_FROM') || 'noreply@momentumai.app';
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        text: `Your Momentum AI Verification Code is: ${code}. Valid for 5 minutes.`,
      });
      this.logger.log(`OTP verification email sent via SMTP successfully to ${to}`);
    } catch (err: any) {
      this.logger.error(`SMTP delivery failed: ${err.message}. Local debugging console fallback active.`);
      this.logger.log(`\n======================================================`);
      this.logger.log(`[LOCAL DEV FALLBACK] Verification code for ${to} is: ${code}`);
      this.logger.log(`======================================================\n`);
    }
  }

  /**
   * Premium responsive HTML template supporting dark mode styling, professional typography,
   * mobile responsiveness, company branding, and security alerts.
   */
  private getOtpEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Momentum AI Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            padding: 32px;
            border-radius: 24px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.05em;
            background: linear-gradient(to right, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 16px;
            text-align: center;
          }
          .otp-container {
            text-align: center;
            margin: 32px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #6366f1;
            padding: 12px 24px;
            border-radius: 16px;
            background-color: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            display: inline-block;
          }
          .alert {
            font-size: 12px;
            color: #a1a1aa;
            line-height: 1.6;
            margin-top: 24px;
            padding: 16px;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #71717a;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">MOMENTUM AI</span>
            <div class="title">Verify Your Security Session</div>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: #d4d4d8;">
            Please use the following secure one-time password (OTP) to complete your request. This code is valid for exactly <strong>5 minutes</strong>.
          </p>
          <div class="otp-container">
            <span class="otp-code">${code}</span>
          </div>
          <div class="alert">
            <strong>Security Warning:</strong> Never share this verification code with anyone. Momentum AI support agents will never request this PIN. If you did not trigger this login or signup block, change your security credentials immediately.
          </div>
          <div class="footer">
            Sent securely by Momentum AI © 2026. <br>
            For assistance, contact <a href="mailto:support@momentumai.app">support@momentumai.app</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
