import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class RegisterKeysDto {
  @IsString()
  @IsNotEmpty()
  identityPublicKey!: string;

  @IsString()
  @IsNotEmpty()
  signedPreKey!: string;

  @IsString()
  @IsNotEmpty()
  preKeySignature!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  oneTimePreKeys!: string[];
}

export class CreateRoomDto {
  @IsString()
  @IsOptional()
  recipientId?: string; // For 1-on-1 DM

  @IsString()
  @IsOptional()
  name?: string; // For group chats

  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantIds?: string[]; // For group chats
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  encryptedBody!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string; // IV for AES-GCM

  @IsBoolean()
  @IsOptional()
  isMedia?: boolean;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}
