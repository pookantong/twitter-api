import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/schemas/user.schema';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AccessTokenGuard } from './guards/access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body()
    signUpDto: SignUpDto,
  ) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  async signIn(
    @Body()
    signInDto: SignInDto,
  ) {
    return this.authService.login(signInDto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@GetUser() user: User) {
    this.authService.logout(user.id);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@GetUser() user: User) {
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }
}
