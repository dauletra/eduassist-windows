// src/electron/utils/ipc-wrapper.ts

import { IpcMainInvokeEvent } from 'electron';

type HandlerFunction<T extends any[], R> = (
  event: IpcMainInvokeEvent,
  ...args: T
) => Promise<R> | R;

/**
 * Обертка для IPC handlers с автоматической обработкой ошибок
 */
export function createHandler<T extends any[], R>(
  handlerName: string,
  handler: HandlerFunction<T, R>
): HandlerFunction<T, R> {
  return async (event: IpcMainInvokeEvent, ...args: T): Promise<R> => {
    try {
      const result = await handler(event, ...args);
      return result;
    } catch (error) {
      // Логирование
      console.error(`❌ [${handlerName}] Ошибка:`, error);

      // Дополнительная обработка (можно добавить Sentry, логфайлы и т.д.)
      if (error instanceof Error) {
        console.error(`   Сообщение: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
      }

      // Пробрасываем ошибку дальше
      throw error;
    }
  };
}

/**
 * Тип для успешного ответа
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Тип для ошибки
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Создать успешный ответ
 */
export function successResponse<T>(data?: T, message?: string): SuccessResponse<T> {
  return { success: true, data, message };
}

/**
 * Создать ответ с ошибкой
 */
export function errorResponse(error: string, code?: string): ErrorResponse {
  return { success: false, error, code };
}