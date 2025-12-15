import { Injectable, ConsoleLogger } from '@nestjs/common';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  meta?: any;
  trace?: string;
}

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor() {
    super();
  }

  private formatMessage(level: string, message: string, context?: string, meta?: any, trace?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}${traceStr}`;
  }

  private formatStructuredLog(entry: LogEntry): string {
    if (process.env.STRUCTURED_LOGGING === 'true') {
      // JSON формат для структурированного логирования
      return JSON.stringify(entry);
    }
    return this.formatMessage(entry.level, entry.message, entry.context, entry.meta, entry.trace);
  }

  log(message: string, context?: string, meta?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'LOG',
      message,
      context,
      meta,
    };
    const formatted = this.formatStructuredLog(entry);
    super.log(formatted, context);
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context,
      meta,
      trace,
    };
    const formatted = this.formatStructuredLog(entry);
    super.error(formatted, trace, context);
  }

  warn(message: string, context?: string, meta?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context,
      meta,
    };
    const formatted = this.formatStructuredLog(entry);
    super.warn(formatted, context);
  }

  debug(message: string, context?: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        context,
        meta,
      };
      const formatted = this.formatStructuredLog(entry);
      super.debug(formatted, context);
    }
  }

  verbose(message: string, context?: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'VERBOSE',
        message,
        context,
        meta,
      };
      const formatted = this.formatStructuredLog(entry);
      super.verbose(formatted, context);
    }
  }
}

