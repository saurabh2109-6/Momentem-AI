export declare enum GoalStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    MISSED = "MISSED",
    ARCHIVED = "ARCHIVED"
}
export declare enum GoalPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class CreateGoalDto {
    title: string;
    description?: string;
    status?: GoalStatus;
    priority?: GoalPriority;
    category?: string;
    colorLabel?: string;
    estimatedTime?: number;
    actualTime?: number;
    startAt: string;
    endAt: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    parentId?: string;
}
export declare class UpdateGoalDto {
    title?: string;
    description?: string;
    status?: GoalStatus;
    priority?: GoalPriority;
    category?: string;
    colorLabel?: string;
    estimatedTime?: number;
    actualTime?: number;
    startAt?: string;
    endAt?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    parentId?: string;
}
