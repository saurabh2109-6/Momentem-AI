import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getMyAnalytics(userId: string): Promise<{
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
