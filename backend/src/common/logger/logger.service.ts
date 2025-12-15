import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  private formatMessage(level: string, message: string, context?: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
  }

  log(message: string, context?: string, meta?: any) {
    const formatted = this.formatMessage('LOG', message, context, meta);
    super.log(formatted, context);
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    const formatted = this.formatMessage('ERROR', message, context, { ...meta, trace });
    super.error(formatted, trace, context);
  }

  warn(message: string, context?: string, meta?: any) {
    const formatted = this.formatMessage('WARN', message, context, meta);
    super.warn(formatted, context);
  }

  debug(message: string, context?: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', message, context, meta);
      super.debug(formatted, context);
    }
  }

  verbose(message: string, context?: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('VERBOSE', message, context, meta);
      super.verbose(formatted, context);
    }
  }
}

