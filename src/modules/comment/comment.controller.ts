import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateCommentDto } from './dto/create_comment.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/schemas/user.schema';
import { IComment } from 'src/common/interfaces/comment.interface';

@Controller('comment')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post(':postId')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: './upload_files/comment',
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
  async createComment(
    @Body()
    createCommentDto: CreateCommentDto,
    @UploadedFiles()
    files: Express.Multer.File[],
    @GetUser()
    user: User,
    @Param('postId')
    postId: string,
  ) {
    await this.commentService.createComment(
      createCommentDto,
      files,
      user,
      postId,
    );
  }

  @Patch(':commentId')
  async likedComment(
    @Query('liked')
    liked: boolean,
    @GetUser()
    user: User,
    @Param('commentId')
    commentId: string,
  ) {
    await this.commentService.likedComment(commentId, liked, user);
  }

  @Delete(':commentId')
  async deleteComment(
    @GetUser()
    user: User,
    @Param('commentId')
    commentId: string,
  ) {
    await this.commentService.deleteComment(commentId, user);
  }

  @Get(':postId')
  async getComments(
    @GetUser()
    user: User,
    @Query('page')
    page: number,
    @Query('limit')
    limit: number,
    @Param('postId')
    postId: string,
  ){
    return {comments: await this.commentService.getPostComments(postId, page, limit, user)}
  }
}
