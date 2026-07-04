import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto, UpdateHabitDto, LogHabitDto } from './dto/create-habit.dto';
export declare class HabitsService {
    private prisma;
    constructor(prisma: PrismaService);
    createHabit(userId: string, dto: CreateHabitDto): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        userId: string;
        name: string;
        description: string | null;
        frequency: string;
        daysOfWeek: number[];
        logs: {};
        currentStreak: number;
        longestStreak: number;
        createdAt: string;
        updatedAt: string;
    } | {
        id: string;
        currentStreak: number;
        longestStreak: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        description: string | null;
        frequency: string;
        daysOfWeek: number[];
        logs: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getHabit(userId: string, habitId: string): Promise<any>;
    updateHabit(userId: string, habitId: string, dto: UpdateHabitDto): Promise<any>;
    deleteHabit(userId: string, habitId: string): Promise<{
        message: string;
    }>;
    listHabits(userId: string): Promise<any[]>;
    logHabit(userId: string, habitId: string, dto: LogHabitDto): Promise<{
        habitId: string;
        date: string;
        completed: boolean;
        currentStreak: number;
        longestStreak: number;
    }>;
    private calculateStreaks;
}
