import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './schema/comment.schema';
import mongoose, { Types } from 'mongoose';
import { CreateCommentDto } from './dto/create_comment.dto';
import { User } from '../user/schemas/user.schema';
import path from 'path';
import * as fs from 'fs';
import { IComment } from 'src/common/interfaces/comment.interface';
import { Post } from '../post/schema/post.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: mongoose.Model<Comment>,
    @InjectModel(Post.name)
    private postModel: mongoose.Model<Post>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async createComment(
    createPostDto: CreateCommentDto,
    files: Express.Multer.File[],
    user: User,
    postId: string,
  ) {
    const post = await this.postModel.findById(postId);
    const comment = await this.commentModel.create({
      body: createPostDto.body,
      userId: user._id,
      postId: post._id,
      imageNames: files.map((file) => file.filename),
    });
    await this.postModel.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });
    throw new HttpException('CREATE_SUCCESS', HttpStatus.CREATED);
  }

  async likedComment(commentId: string, liked: boolean, user: User) {
    const updatedComment = await this.findById(commentId);
    if (liked && !updatedComment.likedIds.includes(await user.id)) {
      updatedComment.likedIds.push(user._id);
    } else if (!liked) {
      const index = updatedComment.likedIds.indexOf(user._id);
      if (index !== -1) {
        updatedComment.likedIds.splice(index, 1);
      } else {
        throw new HttpException('USERID_NOT_FOUND_IN_LIKEIDS', 404);
      }
    }
    await this.commentModel.findByIdAndUpdate(commentId, updatedComment, {
      new: true,
    });
    throw new HttpException('PATCH_LIKED_SUCCESS', HttpStatus.OK);
  }

  async deleteComment(commentId: string | Types.ObjectId, user: User) {
    const comment = await this.findById(commentId);
    if (user.id != comment.userId) {
      throw new HttpException('FORBIDDEN', 403);
    }
    //delete file
    for (const deleteFileName of comment.imageNames) {
      if (comment.imageNames) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'post',
          deleteFileName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }
    await this.commentModel.findByIdAndDelete(commentId);
    throw new HttpException('DELETE_SUCCESS', HttpStatus.OK);
  }

  async getPostComments(
    postId: string,
    page: number,
    limit: number,
    user: User,
  ): Promise<IComment[]> {
    const post = await this.postModel.findById(postId);
    const totalComment = await this.commentModel.countDocuments({
      postId: post._id,
    });
    const pageSize = Math.ceil(totalComment / limit);
    if (page > pageSize) {
      if (pageSize == 1) {
        page = 1;
      } else {
        page = page % pageSize;
      }
    }
    const skip = (page - 1) * limit;
    const comments = await this.commentModel.aggregate([
      { $match: { postId: post._id } },
      {
        $project: {
          body: 1,
          userId: 1,
          postId: 1,
          likedIds: 1,
          comments: 1,
          imageNames: 1,
          createdAt: 1,
          updatedAt: 1,
          totalLiked: { $size: '$likedIds' },
          liked: { $in: [user._id, '$likedIds'] },
        },
      },
      { $sort: { totalLiked: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const iComments = await Promise.all(
      comments.map(async (comment) => {
        const timePassed = await this.timePassed(comment.createdAt);
        return {
          postId: comment.postId,
          commentId: comment._id,
          body: comment.body,
          username: (await this.userModel.findById(comment.userId)).username,
          totalLiked: comment.totalLiked,
          liked: comment.liked,
          imageUrl: comment.imageNames,
          timePassed: timePassed,
        };
      }),
    );

    return iComments;
  }

  async findById(commentId: string | Types.ObjectId): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new HttpException('COMMENT_NOT_FOUND', 404);
    }
    return comment;
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
