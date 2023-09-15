import { IsArray, IsOptional, IsString } from 'class-validator';

export class EditPostDto {
  @IsOptional()
  @IsString()
  body: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deleteFiles: string[]
}
