import { IsString, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Friend code is required' })
  friendCode!: string;
}

export class UpdateFriendshipDto {
  @IsString()
  @IsNotEmpty()
  friendId!: string;
}
