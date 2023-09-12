import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { SignUpDto } from '../auth/dto/signUp.dto';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async createUser(createUserDto: SignUpDto) {
    const { username, email, password } = createUserDto;

    if (username === (await this.findByUsername(username))?.username) {
      throw new HttpException(
        'USERNAME_IS_ALREADY_IN_USE',
        HttpStatus.CONFLICT,
      );
    } else if (email === (await this.findByEmail(email))?.email) {
      throw new HttpException('EMAIL_IS_ALREADY_IN_USE', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userModel.create({
      username,
      email,
      password: hashedPassword,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findById(userId: Types.ObjectId): Promise<User | null> {
    return await this.userModel.findOne({ userId }).exec();
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find();
  }
}
