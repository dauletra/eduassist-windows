// src/electron/api/services/presentation.service.ts

import { shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { PresentationConfig } from '../../shared-types.js';

/**
 * Сервис для работы с презентациями
 */
export class PresentationService {
  private presentations: Record<string, PresentationConfig> = {};

  constructor() {
    this.loadPresentations();
  }

  /**
   * Загрузка списка презентаций
   */
  private loadPresentations(): void {
    this.presentations = {
      'первый закон ньютона': {
        name: 'Первый закон Ньютона',
        path: 'presentations/newton-first-law.pptx',
        description: 'Закон инерции'
      },
      'второй закон ньютона': {
        name: 'Второй закон Ньютона',
        path: 'presentations/newton-second-law.pptx',
        description: 'F = ma'
      },
      'кинетическая энергия': {
        name: 'Кинетическая энергия',
        path: 'presentations/kinetic-energy.pptx',
        description: 'Энергия движения'
      }
    };
  }

  /**
   * Открыть презентацию по имени
   */
  async openPresentation(filePath: string): Promise<void> {
    try {
      const result = await shell.openPath(filePath);

      if (result) {
        console.error(`❌ Ошибка открытия файла: ${result}`);
        throw new Error(result);
      }

      console.log(`✅ Файл открыт: ${filePath}`);
    } catch (error) {
      console.error('❌ Ошибка открытия файла:', error);
      throw error;
    }
  }

  /**
   * Открыть файл презентации
   */
  private async openPresentationFile(presentation: PresentationConfig): Promise<void> {
    const userDataPath = app.getPath('userData');

    // Возможные пути к файлу
    const possiblePaths = [
      path.join(userDataPath, 'presentations', path.basename(presentation.path)),
      path.join(userDataPath, presentation.path),
      path.join(process.cwd(), presentation.path)
    ];

    // Пытаемся найти и открыть файл
    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        await shell.openPath(fullPath);
        return;
      }
    }

    // Если файл не найден, создаем информационную страницу
    await this.createFallbackPage(presentation);
  }

  /**
   * Создать информационную страницу если презентация не найдена
   */
  private async createFallbackPage(presentation: PresentationConfig): Promise<void> {
    const fallbackHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${presentation.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f0f0f0;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
    }
    h1 { color: #333; }
    p { color: #666; line-height: 1.6; }
    .warning { color: #e67e22; font-size: 1.2em; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${presentation.name}</h1>
    <p><strong>Описание:</strong> ${presentation.description || 'Нет описания'}</p>
    <p class="warning">⚠️ Презентация не найдена</p>
    <p>Поместите файл "${path.basename(presentation.path)}" в папку presentations</p>
  </div>
</body>
</html>`;

    const tempPath = path.join(app.getPath('temp'), `presentation-info-${Date.now()}.html`);
    fs.writeFileSync(tempPath, fallbackHtml, 'utf8');
    await shell.openPath(tempPath);
  }

  /**
   * Получить список всех презентаций
   */
  getAllPresentations(): PresentationConfig[] {
    return Object.values(this.presentations);
  }

  /**
   * Добавить презентацию
   */
  addPresentation(key: string, presentation: PresentationConfig): void {
    this.presentations[key.toLowerCase()] = presentation;
  }
}

// Экспорт единственного экземпляра (singleton)
export const presentationService = new PresentationService();