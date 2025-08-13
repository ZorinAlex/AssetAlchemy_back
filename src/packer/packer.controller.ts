import {
  Body,
  Controller,
  FileTypeValidator,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {FilesInterceptor} from '@nestjs/platform-express';
import {PackerService} from './packer.service';
import {PackImagesDto} from './pack.dto';
import {ArchiveService} from '../archive/archive.service';
import {join} from 'path';
import {createReadStream} from 'fs';
import {PackBitmapFontDto} from './bitmap.font.dto';
import {filter} from 'lodash';
import {replace_spaces} from "../utils/font_utils";

@Controller('packer')
export class PackerController {
  constructor(
    private readonly packerService: PackerService,
    private readonly archiveService: ArchiveService,
  ) {
  }

  @Post('pack')
  @UseInterceptors(FilesInterceptor('files'))
  async packImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    ) files: Express.Multer.File[],
    @Body() options: PackImagesDto) {
    const filesNames = await this.packerService.packImages(files, options);
    const zipPath = join(this.packerService.outputPath, `${options.name}.zip`);
    await this.archiveService.createZip(filesNames, zipPath);
    const fileStream = createReadStream(zipPath);
    fileStream.on('close', () => {
      this.archiveService.removeFiles([zipPath]);
    });

    return new StreamableFile(fileStream, {
      type: 'application/zip',
      disposition: `attachment; filename="${options.name}.zip"`,
    });
  }

  @Post('bfont')
  @UseInterceptors(FilesInterceptor('files'))
  async packBitmapFont(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    ) files: Express.Multer.File[],
    @Body() options: PackBitmapFontDto) {
    const fileName = replace_spaces(options.name);
    const packOptions: PackImagesDto = {
      ...options,
      name: fileName,
      allowRotation: false,
      smart: true,
      square: false,
      pot: false,
      tag: false,
      border: 0,
      padding: 0,
    };
    const filesNames = await this.packerService.packImages(files, packOptions);
    const jsonFiles = filter(filesNames, name => name.split('.').at(-1) === 'json');
    const fontFiles = await this.packerService.fontDataFromJSON(jsonFiles, options);
    filesNames.push(...fontFiles);

    const filesToSend = filter(filesNames, name => name.split('.').at(-1) !== 'json');
    const zipPath = join(this.packerService.outputPath, `${fileName}.zip`);
    await this.archiveService.createZip(filesToSend, zipPath);
    await this.archiveService.removeFiles(filesNames);
    const fileStream = createReadStream(zipPath);
    fileStream.on('close', () => {
      this.archiveService.removeFiles([zipPath]);
    });

    return new StreamableFile(fileStream, {
      type: 'application/zip',
      disposition: `attachment; filename="${fileName}.zip"`,
    });
  }
}
