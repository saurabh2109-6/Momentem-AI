import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService as IEmailService } from './interfaces/email-service.interface';
import { EmailTemplateService } from './email.templates';
export declare class EmailServiceImpl implements IEmailService {
    private readonly transporter;
    private readonly templates;
    private readonly config;
    private readonly logger;
    constructor(transporter: nodemailer.Transporter, templates: EmailTemplateService, config: ConfigService);
    private verifySmtpConnection;
    sendOtpMail(to: string, code: string): Promise<void>;
}
