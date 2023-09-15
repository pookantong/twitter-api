import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EditUserDto } from './dto/edit_user.dto';
import { FollowUserDto } from './dto/follow_user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Put()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload_files/profile',
        filename: (req, file, callback) => {
          const name = file.originalname.split('.')[0];
          const fileExtName = extname(file.originalname);
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${name}-${randomName}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new HttpException(
              'Only image files are allowed!',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async editUser(
    @GetUser()
    user: User,
    @UploadedFile()
    image: Express.Multer.File,
    @Body()
    editPostDto: EditUserDto,
  ) {
    return this.userService.editUser(editPostDto, image, user);
  }

  @Delete()
  async deleteUser(
    @GetUser()
    user: User,
  ) {
    return await this.userService.deleteUser(user);
  }

  @Patch(':username')
  async followUser(
    @GetUser()
    user: User,
    @Body()
    body: FollowUserDto,
    @Param('username')
    username: string,
  ) {
    return await this.userService.follow(username, body.followStatus, user);
  }

  @Get(':username')
  async getUser(
    @GetUser()
    user: User,
    @Param('username')
    username: string,
  ) {
    return this.userService.getUserProfile(username, user);
  }
}
