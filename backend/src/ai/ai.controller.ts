import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('ai')
@UseGuards(FirebaseAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chatWithAssistant(
    @GetUser('id') userId: string,
    @Body() dto: ChatMessageDto,
  ) {
    return this.aiService.chatWithAssistant(userId, dto.message, dto.history);
  }

  @Post('optimize')
  async optimizeSchedule(@GetUser('id') userId: string) {
    return this.aiService.optimizeSchedule(userId);
  }
}
