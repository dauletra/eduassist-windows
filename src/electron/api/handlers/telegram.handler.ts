// src/electron/api/handlers/telegram.handler.ts

import { ipcMain } from 'electron';
import { readFile } from 'fs/promises';

const TELEGRAM_SERVICE_URL = 'http://localhost:8081';

export function registerTelegramHandlers(): void {

  // Получить токен для QR-кода
  ipcMain.handle('telegram:get-qr-token', async (_event, studentId: string) => {
    try {
      const response = await fetch(`${TELEGRAM_SERVICE_URL}/api/qr_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения токена:', error);
      throw error;
    }
  });

  // Получить статусы регистрации группы
  ipcMain.handle('telegram:get-registration-status', async (_event, classId: string, groupId: string) => {
    try {
      const response = await fetch(
        `${TELEGRAM_SERVICE_URL}/api/registration_status?class_id=${classId}&group_id=${groupId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения статусов:', error);
      return { students: [] }; // Возвращаем пустой массив при ошибке
    }
  });

  // Отправить материалы ученикам
  ipcMain.handle('telegram:send-material', async (_event, payload: {
    lesson_id: string;
    file_path?: string;
    url?: string;
    caption: string;
  }) => {
    try {
      const response = await fetch(`${TELEGRAM_SERVICE_URL}/api/send_material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка отправки материалов:', error);
      throw error;
    }
  });

  ipcMain.handle('read-url-file-content', async (_event, filePath: string): Promise<string> => {
    try {
      const content: string = await readFile(filePath, 'utf-8');

      // Парсинг .url файла (формат Windows Internet Shortcut)
      // Ищем строку URL=...
      const urlMatch = content.match(/URL=(.+)/i);

      if (urlMatch && urlMatch[1]) {
        return urlMatch[1].trim();
      }

      throw new Error('URL не найден в файле');
    } catch (error) {
      console.error('❌ Ошибка чтения .url файла:', error);
      throw error;
    }
  });

  console.log('📱 Telegram handlers зарегистрированы');
}