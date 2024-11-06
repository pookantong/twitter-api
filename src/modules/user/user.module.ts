import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MulterModule } from '@nestjs/platform-express';
import { PostModule } from '../post/post.module';
import { AccessTokenStrategy } from '../auth/strategies/access-token.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      dest: './upload_files',
    }),
    PostModule,
  ],
  providers: [UserService, AccessTokenStrategy],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
