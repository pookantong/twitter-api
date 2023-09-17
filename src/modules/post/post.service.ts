import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from './schema/post.schema';
import mongoose, { Types } from 'mongoose';
import { CreatePostDto } from './dto/create_post.dto';
import { User } from '../user/schemas/user.schema';
import { IPost, IPosts } from 'src/common/interfaces/post.interface';
import { EditPostDto } from './dto/edit_post.dto';
import * as path from 'path';
import * as fs from 'fs';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private postModel: mongoose.Model<Post>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    private commentService: CommentService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
    user: User,
  ) {
    const fileNames: string[] = [];
    for (const file of files) {
      fileNames.push(file.filename);
    }
    const post = await this.postModel.create({
      body: createPostDto.body,
      imageNames: fileNames,
      authorId: user._id,
    });
    user.posts.push(post._id);
    await this.userModel.findByIdAndUpdate(user._id, user);
    throw new HttpException('CREATE_SUCCESS', HttpStatus.CREATED);
  }

  async editPost(
    postId: string,
    editPostDto: EditPostDto,
    files: Express.Multer.File[],
    user: User,
  ) {
    const post = await this.findById(postId);
    if (user.id != post.authorId) {
      throw new HttpException('FORBIDDEN_POST', HttpStatus.FORBIDDEN);
    }
    const fileNames: string[] = [];
    for (const file of files) {
      fileNames.push(file.filename);
    }
    //delete file
    for (const deleteFileName of editPostDto.deleteFiles) {
      if (post.imageNames) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'post',
          deleteFileName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          const index = post.imageNames.indexOf(deleteFileName);

          if (index !== -1) {
            post.imageNames.splice(index, 1);
          } else {
            throw new HttpException('IMAGE_TO_DELETE_NOT_FOUND', 404);
          }
        } else {
          throw new HttpException('IMAGE_IN_PATH_NOT_FOUND', 404);
        }
      }
    }
    await this.updatePost(postId, {
      body: editPostDto.body,
      imageNames: { ...post.imageNames, fileNames },
    });
    throw new HttpException('EDIT_SUCCESS', HttpStatus.OK);
  }

  async deletePost(postId: string | Types.ObjectId, user: User) {
    const post = await this.findById(postId);
    if (user.id != post.authorId) {
      throw new HttpException('FORBIDDEN_POST', HttpStatus.FORBIDDEN);
    }
    const index = user.posts.indexOf(post._id);
    if (index !== -1) {
      user.posts.splice(index, 1);
    }
    //delete file
    for (const deleteFileName of post.imageNames) {
      if (post.imageNames) {
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
    //delete comment
    for (const commentId of post.comments) {
      await this.commentService.deleteComment(commentId, user);
    }
    await this.userModel.findByIdAndUpdate(user._id, user);
    await this.postModel.findByIdAndDelete(postId);
    throw new HttpException('DELETE_SUCCESS', HttpStatus.OK);
  }

  async getPosts(page: number, limit: number, user: User): Promise<IPosts> {
    const totalPosts = await this.postModel.countDocuments({});
    const pageSize = Math.ceil(totalPosts / limit);
    if (page > pageSize) {
      if (pageSize == 1) {
        page = 1;
      } else {
        page = page % pageSize;
      }
    }
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate([
      {
        $addFields: {
          isFollowedAuthor: {
            $in: ['$authorId', user.following],
          },
          createdAtWeek: { $week: '$createdAt' },
        },
      },
      {
        $sort: {
          isFollowedAuthor: -1,
          createdAtWeek: -1,
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    const postPromises = posts.map(async (postId) => {
      const post = await this.findById(postId);
      const authorPromise = this.userModel
        .findById(post.authorId)
        .select('username profileName');
      const isLikedPromise = post.likedIds.includes(user._id);

      const [author, isLiked] = await Promise.all([
        authorPromise,
        isLikedPromise,
      ]);

      return {
        postId: post._id,
        body: post.body,
        username: author.username,
        profileName: author.profileName,
        timePassed: await this.timePassed(post.createdAt),
        totalComment: post.comments.length,
        totalLiked: post.likedIds.length,
        liked: isLiked,
        imageUrl: post.imageNames,
      };
    });

    const iPosts = await Promise.all(postPromises);
    return { posts: iPosts, currentPage: page, pageSize };
  }

  async getPostsByUsername(
    page: number,
    limit: number,
    user: User,
    username: string,
  ): Promise<IPosts> {
    const author = await this.userModel.findOne({ username });
    const totalPosts = await this.postModel.countDocuments({
      authorId: author._id,
    });
    const pageSize = Math.ceil(totalPosts / limit);
    if (page > pageSize) {
      if (pageSize == 1) {
        page = 1;
      } else {
        page = page - pageSize;
      }
    }
    const skip = (page - 1) * limit;
    const posts = await this.postModel
      .find({ authorId: author._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const postPromises = posts.map(async (postId) => {
      const post = await this.postModel.findById(postId);
      const authorPromise = this.userModel
        .findById(post.authorId)
        .select('username profileName');
      const isLikedPromise = post.likedIds.includes(user._id);

      const [author, isLiked] = await Promise.all([
        authorPromise,
        isLikedPromise,
      ]);

      return {
        postId: post._id,
        body: post.body,
        username: author.username,
        profileName: author.profileName,
        timePassed: await this.timePassed(post.createdAt),
        totalComment: post.comments.length,
        totalLiked: post.likedIds.length,
        liked: isLiked,
        imageUrl: post.imageNames,
      };
    });

    const iPosts = await Promise.all(postPromises);
    return { posts: iPosts, currentPage: page, pageSize };
  }

  async getPost(postId: string, user: User): Promise<IPost> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new HttpException('NOT_FOUND_POST', HttpStatus.NOT_FOUND);
    }
    const iPost = {
      postId: post._id,
      body: post.body,
      username: user.username,
      profileName: user.profileName,
      timePassed: await this.timePassed(post.createdAt),
      totalComment: post.comments.length,
      totalLiked: post.likedIds.length,
      liked: post.likedIds.includes(await user.id),
      imageUrl: post.imageNames,
    };
    return iPost;
  }

  async likedPost(postId: string, liked: boolean, user: User) {
    const updatedPost = await this.postModel.findById(postId);
    if (!updatedPost) {
      throw new HttpException('POST_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (liked && !updatedPost.likedIds.includes(await user.id)) {
      updatedPost.likedIds.push(user._id);
    } else if (!liked) {
      const index = updatedPost.likedIds.indexOf(user._id);
      if (index !== -1) {
        updatedPost.likedIds.splice(index, 1);
      } else {
        throw new HttpException('USERID_NOT_FOUND_IN_LIKEIDS', 404);
      }
    }
    await this.postModel.findByIdAndUpdate(postId, updatedPost, {
      new: true,
    });
    throw new HttpException('PATCH_LIKED_SUCCESS', HttpStatus.OK);
  }

  async findById(postId: string | Types.ObjectId): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new HttpException('POST_NOT_FOUND', 404);
    }
    return post;
  }

  async updatePost(postId: string, updateData): Promise<Post> {
    const post = await this.postModel.findByIdAndUpdate(postId, updateData, {
      new: true,
    });
    return post;
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
