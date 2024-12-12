import { Module } from '@nestjs/common';
import { PackerService } from './packer.service';
import { PackerController } from './packer.controller';
import {ArchiveModule} from "../archive/archive.module";

@Module({
  providers: [PackerService],
  controllers: [PackerController],
  imports:[ArchiveModule],
})
export class PackerModule {}
