import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @Length(0, 160, { message: 'Bio must be under 160 characters' })
  bio?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  statusEmoji?: string;

  @IsString()
  @IsOptional()
  statusText?: string;
}
