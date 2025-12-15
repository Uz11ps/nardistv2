import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Санитизация входных данных - удаление HTML тегов и опасных символов
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // Рекурсивная санитизация объекта
    return this.sanitizeObject(value);
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeValue(obj[key]);
        }
      }
      return sanitized;
    }

    return this.sanitizeValue(obj);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Удаляем HTML теги
      return value
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '')
        .trim();
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }
}

