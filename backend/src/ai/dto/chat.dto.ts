import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  message!: string;

  @IsArray()
  @IsOptional()
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}
