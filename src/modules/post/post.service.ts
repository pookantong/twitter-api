import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from './schema/post.schema';
import mongoose, { Types } from 'mongoose';
import { CreatePostDto } from './dto/create_post.dto';
import { User } from '../user/schemas/user.schema';
import { IPost } from 'src/common/interfaces/post.interface';
import { UserService } from '../user/user.service';
import * as path from 'path';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private postModel: mongoose.Model<Post>,
    private userService: UserService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
    user: User,
  ) {
    const filePaths: string[] = [];
    for (const file of files) {
      filePaths.push(file.filename);
    }
    await this.postModel.create({
      body: createPostDto.body,
      imagePaths: filePaths,
      userId: user._id,
    });
  }

  async likedPost(postId: string, liked: boolean, user: User) {
    const updatedPost = await this.postModel.findById(postId);
    if (liked && !updatedPost.likedIds.includes(await user.id)) {
      updatedPost.likedIds.push(user._id);
    } else if (!liked) {
      updatedPost.likedIds = updatedPost.likedIds.filter(
        (likedId) => likedId.toString() !== user._id.toString(),
      );
    }
    return await this.postModel.findByIdAndUpdate(postId, updatedPost, {
      new: true,
    });
  }

  async getPosts(page: number, limit: number, user: User): Promise<IPost[]> {
    const skip = (page - 1) * limit;
    const posts = await this.postModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const iPosts: IPost[] = [];
    for (const post of posts) {
      iPosts.push({
        postId: post._id,
        body: post.body,
        username: user.username,
        timePassed: await this.timePassed(post.createdAt),
        totalComment: post.comments.length,
        totalLiked: post.likedIds.length,
        liked: post.likedIds.includes(user._id),
        fileUrl: post.imagePaths,
      });
    }
    return iPosts;
  }

  async timePassed(createdAt: Date): Promise<string> {
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - createdAt.getTime();
    const secondsPassed = Math.floor(timeDiff / 1000);
    const minutesPassed = Math.floor(secondsPassed / 60);
    const hoursPassed = Math.floor(minutesPassed / 60);
    const daysPassed = Math.floor(hoursPassed / 24);

    let timePassed = '';
    if (daysPassed > 0) {
      timePassed = `${daysPassed} days ago`;
    } else if (hoursPassed > 0) {
      timePassed = `${hoursPassed} hours ago`;
    } else if (minutesPassed > 0) {
      timePassed = `${minutesPassed} minutes ago`;
    } else {
      timePassed = `${secondsPassed} seconds ago`;
    }
    return timePassed;
  }
}
