import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsInt, IsBoolean } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty({ message: 'Habit name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Frequency is required' })
  frequency!: string; // e.g. 'daily', 'weekly', 'custom'

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  daysOfWeek?: number[]; // e.g. [1, 3, 5] for Mon, Wed, Fri
}

export class UpdateHabitDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  daysOfWeek?: number[];
}

export class LogHabitDto {
  @IsString()
  @IsNotEmpty({ message: 'Log date is required (format: YYYY-MM-DD)' })
  date!: string; // YYYY-MM-DD

  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;
}
