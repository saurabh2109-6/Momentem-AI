import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto, UpdateFriendshipDto } from './dto/friend-request.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('friends')
@UseGuards(FirebaseAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('request')
  async sendRequest(
    @GetUser('id') userId: string,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendsService.sendFriendRequest(userId, dto.friendCode);
  }

  @Post('accept')
  async acceptRequest(
    @GetUser('id') userId: string,
    @Body() dto: UpdateFriendshipDto,
  ) {
    return this.friendsService.acceptFriendRequest(userId, dto.friendId);
  }

  @Post('reject')
  async rejectRequest(
    @GetUser('id') userId: string,
    @Body() dto: UpdateFriendshipDto,
  ) {
    return this.friendsService.rejectFriendRequest(userId, dto.friendId);
  }

  @Post('block')
  async block(
    @GetUser('id') userId: string,
    @Body() dto: UpdateFriendshipDto,
  ) {
    return this.friendsService.blockUser(userId, dto.friendId);
  }

  @Post('unblock')
  async unblock(
    @GetUser('id') userId: string,
    @Body() dto: UpdateFriendshipDto,
  ) {
    return this.friendsService.unblockUser(userId, dto.friendId);
  }

  @Get()
  async getFriends(@GetUser('id') userId: string) {
    return this.friendsService.listFriends(userId);
  }

  @Get('pending')
  async getPendingRequests(@GetUser('id') userId: string) {
    return this.friendsService.listPendingRequests(userId);
  }
}
