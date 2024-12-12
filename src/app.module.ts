import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PackerModule } from './packer/packer.module';
import { ArchiveService } from './archive/archive.service';
import { ArchiveModule } from './archive/archive.module';
import {ConfigModule} from "@nestjs/config";
import Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        PATH: Joi.string().required(),
      })
    }),
    PackerModule,
    ArchiveModule
  ],
  controllers: [AppController],
  providers: [AppService, ArchiveService],
})
export class AppModule {}
