import { Module } from '@nestjs/common';
import { EmailTemplateService } from './email.templates';
import { EmailService } from './interfaces/email-service.interface';
import { EmailServiceImpl } from './email.service';
import { mailerProvider } from './email.provider';

@Module({
  providers: [
    EmailTemplateService,
    mailerProvider,
    {
      provide: EmailService,
      useClass: EmailServiceImpl,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
