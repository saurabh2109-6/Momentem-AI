export declare class CreateHabitDto {
    name: string;
    description?: string;
    frequency: string;
    daysOfWeek?: number[];
}
export declare class UpdateHabitDto {
    name?: string;
    description?: string;
    frequency?: string;
    daysOfWeek?: number[];
}
export declare class LogHabitDto {
    date: string;
    completed: boolean;
}
