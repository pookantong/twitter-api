import { Controller, Get, Post, Body, Req, UseGuards, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';


@Controller('user')
export class UserController {
    constructor(private userService: UserService){}

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAllUser(): Promise<User[]>{
        return this.userService.findAll()
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(
        @GetUser()
        user: User,
    ){
        return user
    }
}
