import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schema/post.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './upload_files',
    }),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    UserModule
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
