import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Structured error response format.
 * Consistent across all error types.
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Global exception filter that catches all exceptions.
 * Provides consistent error response format and logging.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.extractErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request.headers['x-request-id'] as string) || undefined,
    };

    // Log the error with appropriate level
    this.logError(exception, errorResponse, request);

    response.status(statusCode).json(errorResponse);
  }

  private extractErrorDetails(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    if (this.isHttpException(exception)) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        return {
          statusCode: status,
          error: (responseObj['error'] as string) || HttpStatus[status] || 'Error',
          message: (responseObj['message'] as string | string[]) || exception.message,
        };
      }

      return {
        statusCode: status,
        error: HttpStatus[status] || 'Error',
        message: exception.message,
      };
    }

    // Unknown errors - return 500 without exposing internals
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }

  private isHttpException(exception: unknown): exception is HttpException {
    return exception instanceof HttpException;
  }

  private logError(exception: unknown, errorResponse: ErrorResponse, request: Request): void {
    const logContext = {
      statusCode: errorResponse.statusCode,
      path: errorResponse.path,
      method: request.method,
      requestId: errorResponse.requestId,
      userId: (request as Request & { user?: { id?: string } }).user?.id,
    };

    if (errorResponse.statusCode >= 500) {
      // Log full stack trace for server errors
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(logContext),
      );
    } else if (errorResponse.statusCode >= 400) {
      // Log warning for client errors
      this.logger.warn(
        `${request.method} ${request.url} - ${errorResponse.statusCode}: ${JSON.stringify(errorResponse.message)}`,
        JSON.stringify(logContext),
      );
    }
  }
}
