import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt'
import { SignUpDto } from './dto/signUp.dto';



@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService
    ) {}

    async signUp(signUpDto: SignUpDto){
      const user = await this.usersService.createUser(signUpDto)
    }
  
    async login(signInDto: SignInDto):Promise<{token: string}>{
      const {username, password} = signInDto

      const user = await this.usersService.findByUsername(username)

      if(!user){
        throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND)
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password)

      if(!isPasswordMatched){
        throw new HttpException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED)
      }

      const token = this.jwtService.sign({username: user.username})

      return {token}
    }

}