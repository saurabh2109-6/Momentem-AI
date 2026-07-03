import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RegisterKeysDto, CreateRoomDto, SendMessageDto } from './dto/keys.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('chat')
@UseGuards(FirebaseAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('keys')
  async registerKeys(
    @GetUser('id') userId: string,
    @Body() dto: RegisterKeysDto,
  ) {
    return this.chatService.registerKeys(userId, dto);
  }

  @Get('keys/:recipientId')
  async getKeyBundle(@Param('recipientId') recipientId: string) {
    return this.chatService.getKeyBundle(recipientId);
  }

  @Post('rooms')
  async createRoom(
    @GetUser('id') userId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.chatService.createRoom(userId, dto);
  }

  @Get('rooms')
  async getRooms(@GetUser('id') userId: string) {
    return this.chatService.listRooms(userId);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @GetUser('id') userId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.chatService.listMessages(userId, roomId);
  }

  @Post('rooms/:roomId/messages')
  async sendMessage(
    @GetUser('id') userId: string,
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, roomId, dto);
  }
}
