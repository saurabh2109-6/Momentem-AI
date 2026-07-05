import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserAnalytics(userId: string): Promise<{
        productivityScore: number;
        goalStats: {
            total: number;
            completed: number;
            missed: number;
            todo: number;
            successRate: number;
            missRate: number;
        };
        habitStats: {
            longestStreak: number;
            consistency: number;
        };
        heatmap: Record<string, number>;
        burnoutRisk: "Low" | "Medium" | "High";
        prediction: {
            score: number;
            message: string;
        };
    }>;
}
