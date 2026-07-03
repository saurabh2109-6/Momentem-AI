import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto, LogHabitDto } from './dto/create-habit.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('habits')
@UseGuards(FirebaseAuthGuard)
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Post()
  async createHabit(
    @GetUser('id') userId: string,
    @Body() dto: CreateHabitDto,
  ) {
    return this.habitsService.createHabit(userId, dto);
  }

  @Get()
  async getHabits(@GetUser('id') userId: string) {
    return this.habitsService.listHabits(userId);
  }

  @Get(':id')
  async getHabit(
    @GetUser('id') userId: string,
    @Param('id') habitId: string,
  ) {
    return this.habitsService.getHabit(userId, habitId);
  }

  @Patch(':id')
  async updateHabit(
    @GetUser('id') userId: string,
    @Param('id') habitId: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.updateHabit(userId, habitId, dto);
  }

  @Delete(':id')
  async deleteHabit(
    @GetUser('id') userId: string,
    @Param('id') habitId: string,
  ) {
    return this.habitsService.deleteHabit(userId, habitId);
  }

  @Post(':id/log')
  async logHabit(
    @GetUser('id') userId: string,
    @Param('id') habitId: string,
    @Body() dto: LogHabitDto,
  ) {
    return this.habitsService.logHabit(userId, habitId, dto);
  }
}
