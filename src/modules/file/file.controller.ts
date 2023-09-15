import {
  Controller,
  Get,
  HttpException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('file')
export class FileController {
  @Get(':filename')
  async serveImage(
    @Param('filename')
    filename: string,
    @Res()
    res: Response,
    @Query('folder')
    folder: string,
  ) {
    const imagePath = path.join(
      __dirname,
      '../../..',
      'upload_files',
      folder,
      filename,
    );
    if (!fs.existsSync(imagePath)) {
      throw new HttpException('FILE_NOT_FOUND', 404);
    }
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);
  }
}
