import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService();
  private readonly context = HttpExceptionFilter.name;

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error: string = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      
      // Логируем необработанные ошибки
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        this.context,
        {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.get('user-agent'),
        },
      );
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      error,
    };

    // В production не показываем stack trace
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      (errorResponse as any).stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

