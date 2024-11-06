import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';
import { IUser } from 'src/common/interfaces/user.interface';
import { EditUserDto } from './dto/edit_user.dto';
import { PostService } from '../post/post.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    private postService: PostService,
  ) {}

  async createUser(signUpDto: SignUpDto): Promise<User> {
    const { username, email, password } = signUpDto;

    // return error if existing
    await this.findExisting(signUpDto.username);
    await this.findExisting(signUpDto.email);

    const hashedPassword = await argon2.hash(password);

    return await this.userModel.create({
      profileName: username,
      username,
      email,
      password: hashedPassword,
    });
  }

  async editUser(
    editUserDto: EditUserDto,
    image: Express.Multer.File[],
    profileImage: boolean,
    coverImage: boolean,
    user: User,
  ) {
    if (profileImage && coverImage) {
      // delete old profile image
      if (user.profileImageName) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'profile',
          user.profileImageName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      editUserDto.profileImageName = image[0].filename;

      if (user.coverImageName) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'profile',
          user.coverImageName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      editUserDto.coverImageName = image[1].filename;
    } else if (profileImage && !coverImage) {
      if (user.profileImageName) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'profile',
          user.profileImageName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      editUserDto.profileImageName = image[0].filename;
    } else if (!profileImage && coverImage) {
      if (user.coverImageName) {
        const imagePath = path.join(
          __dirname,
          '../../..',
          'upload_files',
          'profile',
          user.coverImageName,
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      editUserDto.coverImageName = image[0].filename;
    }
    if (editUserDto.password) {
      editUserDto.password = await argon2.hash(editUserDto.password);
    }
    const updatedUser = await this.update(user._id, editUserDto);
    throw new HttpException('EDIT_SUCCESS', 200);
  }

  async deleteUser(user: User) {
    // delete profile image
    if (user.profileImageName) {
      const imagePath = path.join(
        __dirname,
        '../../..',
        'upload_files',
        'profile',
        user.profileImageName,
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    for (const postId of user.posts) {
      await this.postService.deletePost(postId, user);
    }
    await this.userModel.findByIdAndDelete(user._id);
    throw new HttpException('DELETE_SUCCESS', 200);
  }

  async getUserProfile(username: string, user: User): Promise<IUser> {
    const getUser = await this.findByUsername(username);
    const isFollow = getUser.follower.includes(user._id);
    const iUser: IUser = {
      username: getUser.username,
      profileName: getUser.profileName,
      bio: getUser.bio,
      isFollow: user.id != getUser.id ? isFollow : null,
      totalFollower: getUser.follower.length,
      totalFollowing: getUser.following.length,
      joinAt: getUser.createdAt,
      profilePictureName: getUser.profileImageName
        ? getUser.profileImageName
        : null,
      coverImageName: getUser.coverImageName ? getUser.coverImageName : null,
    };
    return iUser;
  }

  async getProfile(user: User): Promise<IUser> {
    const iUser: IUser = {
      username: user.username,
      profileName: user.profileName,
      bio: user.bio,
      isFollow: null,
      totalFollower: user.follower.length,
      totalFollowing: user.following.length,
      joinAt: user.createdAt,
      profilePictureName: user.profileImageName ? user.profileImageName : null,
      coverImageName: user.coverImageName ? user.coverImageName : null,
    };
    return iUser;
  }

  async follow(username: string, followStatus: boolean, user: User) {
    if (username == user.username) {
      throw new HttpException("CAN'T_FOLLOW_YOUR_SELF", 400);
    }
    const followUser = await this.findByUsername(username);
    if (followStatus && !followUser.follower.includes(user._id)) {
      user.following.push(followUser._id);
      followUser.follower.push(user._id);
      await this.userModel.findByIdAndUpdate(user.id, user);
      await this.userModel.findByIdAndUpdate(followUser.id, followUser);
    } else if (!followStatus) {
      const followingIndex = user.following.indexOf(followUser._id);
      if (followingIndex > -1) {
        user.following.splice(followingIndex, 1);
      }
      const followerIndex = followUser.follower.indexOf(user._id);
      if (followerIndex > -1) {
        followUser.follower.splice(followerIndex, 1);
      }
      await this.userModel.findByIdAndUpdate(user.id, user);
      await this.userModel.findByIdAndUpdate(followUser.id, followUser);
    }
    throw new HttpException(`PATCH_FOLLOW_SUCCESS`, 200);
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async findById(userId: Types.ObjectId | string): Promise<User | null> {
    const user = await this.userModel.findOne({ _id: userId }).exec();
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(
    userId: Types.ObjectId | string,
    updateData: EditUserDto | User | { refreshToken: string },
  ) {
    await this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async findExisting(data: any) {
    if (await this.userModel.findOne({ email: data }).exec()) {
      throw new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT);
    } else if (await this.userModel.findOne({ username: data })) {
      throw new HttpException('USER_ALREADY_EXISTS', HttpStatus.CONFLICT);
    }
  }
}
