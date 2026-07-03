import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMyProfile(@GetUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch('me')
  @UseGuards(FirebaseAuthGuard)
  async updateMyProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Get('code/:code')
  @UseGuards(FirebaseAuthGuard)
  async getProfileByCode(@Param('code') code: string) {
    return this.profileService.getProfileByFriendCode(code);
  }
}
