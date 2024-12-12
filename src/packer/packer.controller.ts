import {
    Body,
    Controller,
    FileTypeValidator,
    ParseFilePipe,
    Post, StreamableFile,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import {FilesInterceptor} from "@nestjs/platform-express";
import {PackerService} from "./packer.service";
import {PackImagesDto} from "./pack.dto";
import {ArchiveService} from "../archive/archive.service";
import {join} from "path";
import {createReadStream} from 'fs';

@Controller('packer')
export class PackerController {
    constructor(
        private readonly packerService: PackerService,
        private readonly archiveService: ArchiveService
    ) {
    }

    @Post('pack')
    @UseInterceptors(FilesInterceptor('files'))
    async packImages(
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({fileType: 'image'})
                ]
            })
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
}
