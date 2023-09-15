import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
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
}
