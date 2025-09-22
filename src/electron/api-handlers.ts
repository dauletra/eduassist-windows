import { ipcMain, shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { PresentationConfig, Class, Lesson } from './shared-types.js';
import {
  loadStudentsList,
  loadAppConfig,
  initializeDataStructure,
  createBackup,
  cleanupOldBackups,
  getTodayLesson,
  createLesson,
  updateAttendance,
  updateGrade,
  getStudentsByGroup,

} from './data-utils.js';

let mainWindow: Electron.BrowserWindow;
let isRecording = false;

const config = loadAppConfig();
let presentations: Record<string, PresentationConfig> = {};

/**
 * Инициализация всех IPC обработчиков
 */
export function setupElectronAPI(window: Electron.BrowserWindow) {
  mainWindow = window;

  initializeDataStructure();
  loadInitialData();

  setupVoiceHandlers();
  setupLessonHandlers();
  setupTeacherCommands();
  setupWindowControls();

  cleanupOldBackups();

  console.log('✅ Electron API инициализирован');
}

/**
 * Загрузка начальных данных
 */
function loadInitialData(): void {
  presentations = {
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
 * Обработчики голосовых команд
 */
function setupVoiceHandlers() {
  ipcMain.handle('start-recording', async () => {
    isRecording = true;
    mainWindow.webContents.send('recording-state-changed', true);
    return Promise.resolve();
  });

  ipcMain.handle('stop-recording', async () => {
    isRecording = false;
    mainWindow.webContents.send('recording-state-changed', false);
    return Promise.resolve();
  });
}

/**
 * Обработчики работы с уроками
 */
function setupLessonHandlers() {
  // Получить урок на сегодня или создать новый
  ipcMain.handle('get-today-lesson', async (event, classId: string, groupId: string): Promise<Lesson | null> => {
    return getTodayLesson(classId, groupId);
  });

  // Создать новый урок
  ipcMain.handle('create-lesson', async (event, classId: string, groupId: string, topic: string): Promise<Lesson> => {
    return createLesson(classId, groupId, topic);
  });

  // Обновить посещаемость
  ipcMain.handle('update-attendance', async (event, lessonId: string, studentId: string, attendance: boolean): Promise<boolean> => {
    return updateAttendance(lessonId, studentId, attendance);
  });

  // Обновить оценку
  ipcMain.handle('update-grade', async (event, lessonId: string, studentId: string, grade: number | null): Promise<boolean> => {
    return updateGrade(lessonId, studentId, grade);
  });
}

/**
 * Команды учителя для работы с классом
 */
function setupTeacherCommands() {
  // Загрузка списка учеников
  ipcMain.handle('load-students-list', async (): Promise<Class[]> => {
    return loadStudentsList();
  });

  // Разделение учеников на группы
  ipcMain.handle('divide-students', async (event, classId: string, groupId: string, groupCount: number) => {
    const students = getStudentsByGroup(classId, groupId);
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const groups: typeof students[] = [];
    const studentsPerGroup = Math.ceil(shuffled.length / groupCount);

    for (let i = 0; i < groupCount; i++) {
      const start = i * studentsPerGroup;
      const end = start + studentsPerGroup;
      groups.push(shuffled.slice(start, end));
    }

    return groups;
  });

  // Выбор случайного ученика
  ipcMain.handle('select-random-student', async (event, classId: string, groupId: string) => {
    const students = getStudentsByGroup(classId, groupId);
    return students[Math.floor(Math.random() * students.length)];
  });

  // Открытие презентаций
  ipcMain.handle('open-presentation', async (event, presentationName: string) => {
    const normalizedName = presentationName.toLowerCase();
    const presentation = presentations[normalizedName];

    if (presentation) {
      try {
        await openPresentationFile(presentation);
      } catch (error) {
        console.error('❌ Ошибка открытия презентации:', error);
      }
    }

    return Promise.resolve();
  });

  // Печать задач
  ipcMain.handle('print-tasks', async () => {
    try {
      await generateAndPrintTasks();
    } catch (error) {
      console.error('❌ Ошибка печати задач:', error);
    }

    return Promise.resolve();
  });
}

/**
 * Управление окном приложения
 */
function setupWindowControls() {
  ipcMain.handle('minimize-window', async () => {
    mainWindow.minimize();
    return Promise.resolve();
  });

  ipcMain.handle('close-window', async () => {
    const backupPath = createBackup();
    if (backupPath) {
      console.log('💾 Резервная копия создана');
    }

    mainWindow.close();
    return Promise.resolve();
  });
}

/**
 * Вспомогательные функции
 */
async function openPresentationFile(presentation: PresentationConfig): Promise<void> {
  const userDataPath = app.getPath('userData');

  const possiblePaths = [
    path.join(userDataPath, 'presentations', path.basename(presentation.path)),
    path.join(userDataPath, presentation.path),
    path.join(process.cwd(), presentation.path)
  ];

  for (const fullPath of possiblePaths) {
    if (fs.existsSync(fullPath)) {
      await shell.openPath(fullPath);
      return;
    }
  }

  // Создаем информационную страницу если файл не найден
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
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${presentation.name}</h1>
    <p><strong>Описание:</strong> ${presentation.description}</p>
    <p>⚠️ Презентация не найдена</p>
    <p>Поместите файл "${path.basename(presentation.path)}" в папку presentations</p>
  </div>
</body>
</html>`;

  const tempPath = path.join(app.getPath('temp'), `presentation-info-${Date.now()}.html`);
  fs.writeFileSync(tempPath, fallbackHtml, 'utf8');
  await shell.openPath(tempPath);
}

async function generateAndPrintTasks(): Promise<void> {
  const currentDate = new Date().toLocaleDateString('ru-RU');

  const tasksHtml = `<!DOCTYPE html>
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
    }
    .task-number {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 15px;
    }
    .answer-space {
      border-top: 1px dashed #999;
      padding-top: 15px;
      min-height: 60px;
    }
    @media print {
      body { margin: 15mm; }
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

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 1000);
    });
  </script>
</body>
</html>`;

  const tempPath = path.join(app.getPath('temp'), `tasks-${Date.now()}.html`);
  fs.writeFileSync(tempPath, tasksHtml, 'utf8');
  await shell.openPath(tempPath);
}

export function getRecordingState(): boolean {
  return isRecording;
}