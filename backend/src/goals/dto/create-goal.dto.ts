import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';

export enum GoalStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  ARCHIVED = 'ARCHIVED',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty({ message: 'Goal title is required' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsEnum(GoalPriority)
  @IsOptional()
  priority?: GoalPriority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  colorLabel?: string;

  @IsInt()
  @IsOptional()
  estimatedTime?: number;

  @IsInt()
  @IsOptional()
  actualTime?: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Start date is required' })
  startAt!: string;

  @IsDateString()
  @IsNotEmpty({ message: 'End date is required' })
  endAt!: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsEnum(GoalPriority)
  @IsOptional()
  priority?: GoalPriority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  colorLabel?: string;

  @IsInt()
  @IsOptional()
  estimatedTime?: number;

  @IsInt()
  @IsOptional()
  actualTime?: number;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
