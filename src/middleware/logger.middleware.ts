import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const ip = request.headers['x-real-ip'] || request.ip;
    const userAgent = request.get('user-agent') || '';

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      this.logger.log(
        `${method} ${originalUrl} STATUS: ${statusCode} CONTENT LENGTH:${contentLength} - ${userAgent} ${ip}`
      );
    });
    next();
  }
}
