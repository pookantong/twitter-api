import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Patch,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { AccessTokenGuard } from 'src/modules/auth/guards/access-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EditUserDto } from './dto/edit_user.dto';
import { FollowUserDto } from './dto/follow_user.dto';

@Controller('user')
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Put()
  @UseInterceptors(
    FilesInterceptor('image', 2, {
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
              'Only image files are allowed for coverImage!',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for coverImage
      },
    }),
  )
  async editUser(
    @GetUser()
    user: User,
    @Query('profileImage')
    profileImage: boolean,
    @Query('coverImage')
    coverImage: boolean,
    @UploadedFiles()
    image: Express.Multer.File[],
    @Body()
    editPostDto: EditUserDto,
  ) {
    return this.userService.editUser(
      editPostDto,
      image,
      profileImage,
      coverImage,
      user,
    );
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
    @Query('followStatus', ParseBoolPipe)
    followStatus: boolean,
    @Param('username')
    username: string,
  ) {
    return await this.userService.follow(username, followStatus, user);
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

  @Get()
  async getProfile(
    @GetUser()
    user: User,
  ) {
    return this.userService.getProfile(user);
  }
}
