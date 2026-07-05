import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
export declare const MAILER_TRANSPORTER = "MAILER_TRANSPORTER";
export declare const mailerProvider: {
    provide: string;
    useFactory: (config: ConfigService) => nodemailer.Transporter;
    inject: (typeof ConfigService)[];
};
