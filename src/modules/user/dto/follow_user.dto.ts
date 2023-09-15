import { IsBoolean, IsNotEmpty } from 'class-validator';

export class FollowUserDto {
  @IsNotEmpty()
  @IsBoolean()
  followStatus: boolean;
}
