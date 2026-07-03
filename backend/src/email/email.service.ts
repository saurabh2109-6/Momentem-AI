import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService as IEmailService } from './interfaces/email-service.interface';
import { EmailTemplateService } from './email.templates';
import { MAILER_TRANSPORTER } from './email.provider';

@Injectable()
export class EmailServiceImpl implements IEmailService {
  private readonly logger = new Logger(EmailServiceImpl.name);

  constructor(
    @Inject(MAILER_TRANSPORTER) private readonly transporter: nodemailer.Transporter,
    private readonly templates: EmailTemplateService,
    private readonly config: ConfigService,
  ) {
    this.verifySmtpConnection();
  }

  /**
   * Verifies the connection credentials with the Gmail SMTP server.
   */
  private async verifySmtpConnection() {
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('EMAIL_USER or EMAIL_PASS environment variables are missing. Console fallback will be active in development.');
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection established and verified successfully.');
    } catch (err: any) {
      this.logger.error(`SMTP Connection failed: ${err.message}. Please check EMAIL_USER/EMAIL_PASS credentials.`);
    }
  }

  /**
   * Dispatches the verification email containing the OTP code using Gmail SMTP.
   * Implements a single automatic retry in case of transient delivery errors.
   */
  async sendOtpMail(to: string, code: string): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM') || 'Momentum AI <noreply@momentum.app>';
    const htmlContent = this.templates.getOtpTemplate(code);

    const mailOptions = {
      from,
      to,
      subject: 'Momentum AI Verification Code',
      html: htmlContent,
      text: `Your Momentum AI Verification Code is: ${code}. Valid for 5 minutes.`,
    };

    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const emailUser = this.config.get<string>('EMAIL_USER');
    const emailPass = this.config.get<string>('EMAIL_PASS');
    const maxAttempts = 2; // initial attempt + 1 retry

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(`SMTP Delivery Attempt ${attempt}/${maxAttempts} for ${to}`);
        
        // In development, log the OTP code for testing convenience
        if (!isProduction) {
          this.logger.log(`[DEV ONLY] OTP code is: ${code}`);
        }

        // If credentials are not present, do not try sending, jump directly to fallback in dev
        if (!emailUser || !emailPass) {
          throw new Error('SMTP credentials are not configured');
        }

        await this.transporter.sendMail(mailOptions);
        
        this.logger.log(`Email Sent successfully to ${to}`);
        return; // Success, exit
      } catch (err: any) {
        this.logger.error(
          `Email Failed (Attempt ${attempt}/${maxAttempts}) to ${to}. Error: ${err.message}`
        );

        // In local development or when credentials are empty, bypass error crash to allow testing flows
        if (!isProduction || !emailUser || !emailPass) {
          this.logger.warn(`[LOCAL FALLBACK ACTIVE] Printed verification code above. Bypassing SMTP exception for development.`);
          return;
        }

        if (attempt === maxAttempts) {
          throw new InternalServerErrorException(
            `Failed to send verification OTP email: ${err.message}`
          );
        }

        // Brief delay before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
