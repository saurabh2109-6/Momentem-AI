import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/create-goal.dto';
export declare class GoalsController {
    private goalsService;
    constructor(goalsService: GoalsService);
    createGoal(userId: string, dto: CreateGoalDto): Promise<{
        status: import("@prisma/client").$Enums.GoalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        priority: import("@prisma/client").$Enums.GoalPriority;
        title: string;
        description: string | null;
        category: string;
        estimatedTime: number;
        actualTime: number;
        startAt: Date;
        endAt: Date;
        notified: boolean;
    } | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        userId: string;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        category: string;
        colorLabel: string | null;
        estimatedTime: number;
        actualTime: number;
        startAt: string;
        endAt: string;
        isRecurring: boolean;
        recurrenceRule: string | null;
        parentId: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    getGoals(userId: string, startAt?: string, endAt?: string): Promise<any[]>;
    getSocialFeed(userId: string): Promise<{
        id: any;
        userId: any;
        type: string;
        createdAt: any;
        displayName: any;
        avatarUrl: any;
        content: string;
    }[]>;
    getGoal(userId: string, goalId: string): Promise<any>;
    updateGoal(userId: string, goalId: string, dto: UpdateGoalDto): Promise<any>;
    deleteGoal(userId: string, goalId: string): Promise<{
        message: string;
    }>;
    addComment(userId: string, goalId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        content: string;
        goalId: string;
    } | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        goalId: string;
        userId: string;
        displayName: any;
        avatarUrl: any;
        content: string;
        createdAt: string;
    }>;
    addReaction(userId: string, goalId: string, emoji: string): Promise<{
        message: string;
        emoji: string;
    }>;
    getGoalSocial(goalId: string): Promise<{
        comments: any[];
        reactions: any[];
    }>;
}
