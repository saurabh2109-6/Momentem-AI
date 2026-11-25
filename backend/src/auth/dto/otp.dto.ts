import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CheckEmailDto {
  @Transform(normalizeEmail)
  @IsString()
  @IsNotEmpty({ message: 'Email ID is required' })
  email!: string;
}

export class RequestOtpDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email ID is required' })
  email!: string;

  @IsOptional()
  @IsIn(['login', 'register'])
  purpose?: 'login' | 'register';
}

export class VerifyOtpDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email ID is required' })
  email!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only 6 digits' })
  code!: string;

  @IsOptional()
  @IsIn(['login', 'register'])
  purpose?: 'login' | 'register';
}
