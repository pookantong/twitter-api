import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const newUser = await this.usersService.createUser(signUpDto);
    const tokens = await this.generateTokens(newUser._id, newUser._id);
    await this.storeRefreshToken(newUser._id, tokens.refreshToken);
    return tokens;
  }

  async login(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { username, password } = signInDto;
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new HttpException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }

    const tokens = await this.generateTokens(user._id, user.username);
    await this.storeRefreshToken(user._id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: Types.ObjectId) {
    this.usersService.update(userId, { refreshToken: null });
  }

  async storeRefreshToken(userId: Types.ObjectId, refreshToken: string) {
    const hashedToken = await this.hashData(refreshToken);
    await this.usersService.update(userId, { refreshToken: hashedToken });
  }

  async generateTokens(userId: Types.ObjectId, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, username },
        {
          secret: this.configService.get<string>('JWT.ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT.ACCESS_EXPIRES'),
        },
      ),
      this.jwtService.signAsync(
        { id: userId, username },
        {
          secret: this.configService.get<string>('JWT.REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT.REFRESH_EXPIRES'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: Types.ObjectId, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    const refreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches)
      throw new HttpException('ACCESS_DENIED', HttpStatus.FORBIDDEN);
    const tokens = await this.generateTokens(user._id, user.username);
    await this.storeRefreshToken(user._id, tokens.refreshToken);
    return tokens;
  }

  private hashData(data: string) {
    return argon2.hash(data);
  }
}
