import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/create-goal.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('goals')
@UseGuards(FirebaseAuthGuard)
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  async createGoal(
    @GetUser('id') userId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalsService.createGoal(userId, dto);
  }

  @Get()
  async getGoals(
    @GetUser('id') userId: string,
    @Query('startAt') startAt?: string,
    @Query('endAt') endAt?: string,
  ) {
    return this.goalsService.listGoals(userId, startAt, endAt);
  }

  @Get('social/feed')
  async getSocialFeed(@GetUser('id') userId: string) {
    return this.goalsService.getSocialFeed(userId);
  }

  @Get(':id')
  async getGoal(
    @GetUser('id') userId: string,
    @Param('id') goalId: string,
  ) {
    return this.goalsService.getGoal(userId, goalId);
  }

  @Patch(':id')
  async updateGoal(
    @GetUser('id') userId: string,
    @Param('id') goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(userId, goalId, dto);
  }

  @Delete(':id')
  async deleteGoal(
    @GetUser('id') userId: string,
    @Param('id') goalId: string,
  ) {
    return this.goalsService.deleteGoal(userId, goalId);
  }

  @Post(':id/comment')
  async addComment(
    @GetUser('id') userId: string,
    @Param('id') goalId: string,
    @Body('content') content: string,
  ) {
    return this.goalsService.addComment(userId, goalId, content);
  }

  @Post(':id/react')
  async addReaction(
    @GetUser('id') userId: string,
    @Param('id') goalId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.goalsService.addReaction(userId, goalId, emoji);
  }

  @Get(':id/social')
  async getGoalSocial(@Param('id') goalId: string) {
    return this.goalsService.getGoalSocialDetails(goalId);
  }
}
