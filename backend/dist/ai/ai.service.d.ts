import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private prisma;
    private readonly logger;
    private readonly geminiUrl;
    constructor(prisma: PrismaService);
    chatWithAssistant(userId: string, userMessage: string, history?: any[]): Promise<{
        reply: any;
    }>;
    optimizeSchedule(userId: string): Promise<{
        message: string;
        suggestions: any;
    }>;
    private getMockResponse;
    private getMockScheduleOptimizations;
}
