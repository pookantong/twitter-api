import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('file')
export class FileController {
  @Get(':filename')
  async serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(__dirname, '../../..', 'upload_files', filename);

    try {
      const fileStream = fs.createReadStream(imagePath);

      fileStream.pipe(res);
    } catch (error) {
        console.log(imagePath)
      res.status(404).send('Image not found');
    }
  }
}
