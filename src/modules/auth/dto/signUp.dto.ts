import { IsEmail, IsNotEmpty, IsString, isNotEmpty, isString } from "class-validator";

export class SignUpDto{

    @IsNotEmpty()
    @IsString()
    username: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsString()
    password: string

}