import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger
} from "@nestjs/common";
import {Request, Response} from "express";

@Catch()
export class ExceptionsFilter implements ExceptionFilter{
    private logger: Logger = new Logger("Exception");
    catch(exception: unknown, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: Request = ctx.getRequest<Request>();
        const ip = request.headers['x-real-ip'] || request.ip;
        let status: HttpStatus;
        let errorMessage: string;
        let details: string;
        if(exception instanceof HttpException){
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            errorMessage = exception.message;
            if(errorResponse['details']){
                details = JSON.stringify(errorResponse['details'])
            }
        }else{
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = 'Internal error';
        }
        const errorResponse = {
            statusCode: status,
            error: errorMessage,
            path: request.url,
            method: request.method,
            timestamp: new Date(),
            details
        };
        this.logger.error(
          `Response Code: ${errorResponse.statusCode}; Method: ${errorResponse.method}; URL: ${errorResponse.path}; IP: ${ip}`,
          exception['stack']
        )


        response.status(status).json(errorResponse);
    }
}
