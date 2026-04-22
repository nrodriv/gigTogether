import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string | string[];
      let error: string;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string | string[]) ?? exception.message;
        error = (res.error as string) ?? this.statusText(status);
      } else {
        message = exceptionResponse as string;
        error = this.statusText(status);
      }

      response.status(status).json({
        statusCode: status,
        message,
        error,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('[UnhandledException]', exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private statusText(status: number): string {
    const key = HttpStatus[status];
    if (!key) return 'Error';
    return key
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}
