import { useRef, useCallback } from 'react';

/**
 * Хук для защиты от множественных кликов
 * @param handler - обработчик клика
 * @param delay - задержка между кликами (мс)
 * @returns защищенный обработчик
 */
export function useClickHandler<T extends (...args: any[]) => any>(
  handler: T,
  delay: number = 300,
): T {
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;

      // Очищаем предыдущий таймаут
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        const result = handler(...args);
        
        // Если handler возвращает Promise, ждем его завершения
        if (result instanceof Promise) {
          result
            .catch((error) => {
              console.error('Click handler error:', error);
            })
            .finally(() => {
              timeoutRef.current = setTimeout(() => {
                isProcessingRef.current = false;
              }, delay);
            });
        } else {
          timeoutRef.current = setTimeout(() => {
            isProcessingRef.current = false;
          }, delay);
        }
      } catch (error) {
        console.error('Click handler error:', error);
        timeoutRef.current = setTimeout(() => {
          isProcessingRef.current = false;
        }, delay);
      }
    }) as T,
    [handler, delay],
  );
}

