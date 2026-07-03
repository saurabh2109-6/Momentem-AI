import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export const MAILER_TRANSPORTER = 'MAILER_TRANSPORTER';

export const mailerProvider = {
  provide: MAILER_TRANSPORTER,
  useFactory: (config: ConfigService): nodemailer.Transporter => {
    const host = config.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
    const port = Number(config.get<number>('EMAIL_PORT')) || 587;
    const user = config.get<string>('EMAIL_USER') || '';
    const pass = config.get<string>('EMAIL_PASS') || '';

    // Create Nodemailer SMTP Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    return transporter;
  },
  inject: [ConfigService],
};
