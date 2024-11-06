import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/user/schemas/user.schema';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT.ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userModel
      .findOne({ _id: payload.id })
      .select('-password');
    return user;
  }
}