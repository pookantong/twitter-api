import { HttpException, HttpStatus, PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new HttpException('Invalid date', HttpStatus.BAD_REQUEST);
    }
    return date;
  }
}