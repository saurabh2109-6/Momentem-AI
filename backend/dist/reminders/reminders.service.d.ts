import { PrismaService } from '../prisma/prisma.service';
export declare class RemindersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleGoalReminders(): Promise<void>;
    private sendEmailReminder;
    private sendPushReminder;
}
