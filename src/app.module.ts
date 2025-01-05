import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PackerModule } from './packer/packer.module';
import { ArchiveService } from './archive/archive.service';
import { ArchiveModule } from './archive/archive.module';
import {ConfigModule} from "@nestjs/config";
import Joi from "joi";
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ExceptionsFilter } from './filters/exceptions.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        TEMP_PATH: Joi.string().required(),
      })
    }),
    PackerModule,
    ArchiveModule
  ],
  controllers: [],
  providers: [
    ArchiveService,
    {provide: APP_FILTER, useClass: ExceptionsFilter}
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
