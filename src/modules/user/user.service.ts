import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { SignUpDto } from '../auth/dto/signUp.dto';
import * as bcrypt from 'bcrypt';
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

  async createUser(createUserDto: SignUpDto) {
    const { username, email, password } = createUserDto;

    if (username === (await this.userModel.findOne({ username }))?.username) {
      throw new HttpException(
        'USERNAME_IS_ALREADY_IN_USE',
        HttpStatus.CONFLICT,
      );
    } else if (email === (await this.userModel.findOne({ email }))?.email) {
      throw new HttpException('EMAIL_IS_ALREADY_IN_USE', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userModel.create({
      profileName: username,
      username,
      email,
      password: hashedPassword,
    });
  }

  async editUser(
    editUserDto: EditUserDto,
    profileImage: Express.Multer.File,
    user: User,
  ) {
    if (profileImage) {
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
      editUserDto.profileImageName = profileImage.filename;
    }
    editUserDto.password = await bcrypt.hash(editUserDto.password, 10);
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
    const isFollow = getUser.follower.includes(user._id)
    const iUser: IUser = {
      username: getUser.username,
      bio: getUser.bio,
      isFollow: user.id != getUser.id ? isFollow : null,
      totalfollower: getUser.follower.length,
      totalfollowing: getUser.following.length,
      joinAt: getUser.createdAt,
      profilePictureName: getUser.profileImageName
        ? getUser.profileImageName
        : null,
    };
    return iUser;
  }

  async follow(username: string, followStatus: boolean, user: User) {
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
      throw new HttpException('USER_NOT_FOUND', 404);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', 404);
    }
    return user;
  }

  async findById(userId: Types.ObjectId): Promise<User | null> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', 404);
    }
    return user;
  }

  async update(
    userId: Types.ObjectId | string,
    updateData: EditUserDto | User,
  ) {
    await this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
  }
}
