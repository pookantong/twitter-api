import { IsEmail, IsEmpty, IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @IsOptional()
  @IsString()
  profileName: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsEmpty()
  profileImageName: string;

  @IsEmpty()
  coverImageName: string;
}
