import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseFilePipeBuilder,
  Post,
  Patch,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreatePostDto } from './dto/create_post.dto';
import { PostService } from './post.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { IPost } from 'src/common/interfaces/post.interface';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './upload_files/',
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
  async createPost(
    @Body()
    createPostDto: CreatePostDto,
    @UploadedFiles()
    files: Express.Multer.File[],
    @GetUser()
    user: User,
  ) {
    return this.postService.createPost(createPostDto, files, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPosts(
    @Query('page')
    page: number,
    @Query('limit')
    limit: number,
    @GetUser()
    user: User,
  ): Promise<IPost[]> {
    return this.postService.getPosts(page, limit, user);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  async likedPost(
    @Query('liked')
    liked: boolean,
    @GetUser()
    user: User,
    @Param('postId')
    postId: string,
  ){
    return await this.postService.likedPost(postId, liked, user)
  }
}
