import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Patch,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreatePostDto } from './dto/create_post.dto';
import { PostService } from './post.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { IPost, IPosts } from 'src/common/interfaces/post.interface';
import { EditPostDto } from './dto/edit_post.dto';

@UseGuards(JwtAuthGuard)
@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './upload_files/post',
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
    return await this.postService.createPost(createPostDto, files, user);
  }

  @Put(':postId')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './upload_files/post',
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
  async editPost(
    @Body()
    editPostDto: EditPostDto,
    @UploadedFiles()
    files: Express.Multer.File[],
    @GetUser()
    user: User,
    @Param('postId')
    postId: string,
  ) {
    return await this.postService.editPost(postId, editPostDto, files, user);
  }

  @Delete(':postId')
  async deletePosts(
    @Param('postId')
    postId: string,
    @GetUser()
    user: User,
  ) {
    return await this.postService.deletePost(postId, user);
  }

  @Get()
  async getPosts(
    @Query('page', ParseIntPipe)
    page: number,
    @Query('limit', ParseIntPipe)
    limit: number,
    @GetUser()
    user: User,
  ): Promise<IPosts> {
    return await this.postService.getPosts(page, limit, user);
  }

  @Get(':postId')
  async getPost(
    @Param('postId')
    postId: string,
    @GetUser()
    user: User,
  ): Promise<IPost> {
    return await this.postService.getPost(postId, user);
  }

  @Patch(':postId')
  async likedPost(
    @Query('liked')
    liked: boolean,
    @GetUser()
    user: User,
    @Param('postId')
    postId: string,
  ) {
    return await this.postService.likedPost(postId, liked, user);
  }
}
