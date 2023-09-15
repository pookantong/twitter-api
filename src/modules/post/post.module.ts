import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { PostSchema } from "./schema/post.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { CommentModule } from "../comment/comment.module";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { User, UserSchema } from "../user/schemas/user.schema";
import { Post } from './schema/post.schema';


@Module({
  imports: [
    MulterModule.register({
      dest: './upload_files',
    }),
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CommentModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
