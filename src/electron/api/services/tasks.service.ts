// src/electron/api/services/tasks.service.ts

import { shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Сервис для генерации и печати задач
 */
export class TasksService {

  /**
   * Сгенерировать и распечатать задачи
   */
  async generateAndPrint(): Promise<void> {
    try {
      const html = this.createTasksHTML();
      const tempPath = path.join(app.getPath('temp'), `tasks-${Date.now()}.html`);

      fs.writeFileSync(tempPath, html, 'utf8');
      await shell.openPath(tempPath);

      console.log('✅ Задачи отправлены на печать');
    } catch (error) {
      console.error('❌ Ошибка печати задач:', error);
      throw error;
    }
  }

  /**
   * Создать HTML с задачами
   */
  private createTasksHTML(): string {
    const currentDate = new Date().toLocaleDateString('ru-RU');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Задачи по физике</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .task {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      padding: 20px;
      background: #f9f9f9;
      page-break-inside: avoid;
    }
    .task-number {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 15px;
      color: #2c3e50;
    }
    .answer-space {
      border-top: 1px dashed #999;
      padding-top: 15px;
      min-height: 60px;
      margin-top: 10px;
    }
    @media print {
      body { margin: 15mm; }
      .task { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Задачи по физике</h1>
    <p><strong>Дата:</strong> ${currentDate}</p>
  </div>
  
  <div class="task">
    <div class="task-number">Задача № 1</div>
    <p>Тело массой 2 кг движется со скоростью 5 м/с. Найдите кинетическую энергию тела.</p>
    <div class="answer-space">
      <strong>Решение:</strong><br><br>
      <strong>Ответ:</strong> _______________
    </div>
  </div>

  <div class="task">
    <div class="task-number">Задача № 2</div>
    <p>Автомобиль разгоняется с ускорением 2 м/с² в течение 10 секунд. Какую скорость наберет автомобиль?</p>
    <div class="answer-space">
      <strong>Решение:</strong><br><br>
      <strong>Ответ:</strong> _______________
    </div>
  </div>

  <div class="task">
    <div class="task-number">Задача № 3</div>
    <p>На тело действует сила 20 Н. Тело переместилось на 5 м в направлении действия силы. Какую работу совершила сила?</p>
    <div class="answer-space">
      <strong>Решение:</strong><br><br>
      <strong>Ответ:</strong> _______________
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 1000);
    });
  </script>
</body>
</html>`;
  }

  /**
   * Создать HTML с пользовательскими задачами
   */
  createCustomTasksHTML(tasks: Array<{ number: number; question: string }>): string {
    const currentDate = new Date().toLocaleDateString('ru-RU');

    const tasksHTML = tasks.map(task => `
  <div class="task">
    <div class="task-number">Задача № ${task.number}</div>
    <p>${task.question}</p>
    <div class="answer-space">
      <strong>Решение:</strong><br><br>
      <strong>Ответ:</strong> _______________
    </div>
  </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Задачи по физике</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .task {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      padding: 20px;
      background: #f9f9f9;
      page-break-inside: avoid;
    }
    .task-number {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 15px;
      color: #2c3e50;
    }
    .answer-space {
      border-top: 1px dashed #999;
      padding-top: 15px;
      min-height: 60px;
      margin-top: 10px;
    }
    @media print {
      body { margin: 15mm; }
      .task { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Задачи по физике</h1>
    <p><strong>Дата:</strong> ${currentDate}</p>
  </div>
  ${tasksHTML}
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 1000);
    });
  </script>
</body>
</html>`;
  }
}

// Экспорт единственного экземпляра (singleton)
export const tasksService = new TasksService();