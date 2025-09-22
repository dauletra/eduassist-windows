# 🎙️ Голосовой Ассистент Учителя

Десктопное приложение голосового ассистента для учителей, которое помогает управлять учебным процессом с помощью голосовых команд.

## 📁 Архитектура проекта

```
src/
├── electron/                    # Main процесс (Node.js)
│   ├── main.ts                 # 🚀 Запуск приложения и управление окном
│   ├── api-handlers.ts         # 🔌 IPC обработчики и бизнес-логика
│   ├── preload.cjs              # 🌉 Безопасный мостик между процессами
│   ├── config.ts               # ⚙️ Конфигурация приложения
│   ├── data-utils.ts           # 🗄️ Утилиты для работы с файлами и данными
│   ├── shared-types.ts         # 📝 Общие типы для всего проекта
│   └── voice-engine.ts         # 🎤 Модуль голосового распознавания
└── render/                      # Renderer процесс (React)
    ├── components/
    │   └── VoiceAssistant.tsx  # 🎨 Главный компонент интерфейса
    └── types/
        └── global.d.ts         # 🔗 Глобальные типы для renderer
```

## 🏗️ Разделение ответственности

### main.ts - Управление приложением
- ✅ **Создание окна** приложения
- ✅ **Жизненный цикл** Electron приложения
- ✅ **События окна** (закрытие, сворачивание)
- ✅ **Настройки безопасности** webPreferences
- ✅ **Загрузка React** приложения

### api-handlers.ts - Реализация функций
- ✅ **Голосовые команды**: запись и остановка
- ✅ **Команды учителя**: 
  - Разделение учеников на группы
  - Выбор случайного ученика
  - Выставление оценок
  - Открытие презентаций
  - Печать задач
- ✅ **Управление окном**: сворачивание и закрытие
- ✅ **Сохранение данных** и создание резервных копий

### preload.cjs - Безопасный API
- ✅ **Экспорт функций** в глобальную область
- ✅ **Типизированный интерфейс** IElectronAPI
- ✅ **Обработка событий** между процессами

### data-utils.ts - Работа с данными
- ✅ **Загрузка/сохранение** конфигурации
- ✅ **Управление оценками** и статистикой
- ✅ **Работа со списком** учеников
- ✅ **Резервное копирование** данных
- ✅ **Инициализация** структуры файлов

### config.ts - Конфигурация
- ✅ **Настройки приложения** по умолчанию
- ✅ **Команды голосового** ассистента
- ✅ **Шаблоны презентаций** и задач
- ✅ **Предметы** и системы оценок

### voice-engine.ts - Голосовые технологии
- 🔄 **Распознавание речи** (TODO: интеграция)
- 🔄 **Синтез речи** (TODO: интеграция)
- 🔄 **Обработка команд** (TODO: NLP)
- 🔄 **Ключевые слова** (TODO: детекция)

## 🛡️ Безопасность

### Context Isolation
```typescript
webPreferences: {
  nodeIntegration: false,      // ❌ Блокируем прямой доступ к Node.js
  contextIsolation: true,      // ✅ Изолируем контексты
  preload: path.join(__dirname, 'preload.js')  // 🌉 Безопасный мостик
}
```

### Preload Script
```typescript
// Безопасное API через contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  startVoiceRecording: () => ipcRenderer.invoke('start-recording'),
  divideStudentsIntoGroups: (count) => ipcRenderer.invoke('divide-students', count)
  // ... другие функции
});
```

## 📊 Структура данных

### Файлы в userData:
```
~/.config/eduassist-windows/  (или эквивалент на Windows)
├── config.json              # Конфигурация приложения
├── grades.json               # Журнал оценок
├── students.json             # Список учеников
├── presentations/            # Папка с презентациями
├── templates/                # Шаблоны заданий
└── backups/                  # Резервные копии (последние 10)
```

### Типы данных:
```typescript
interface GradeRecord {
  student: string;
  grade: number;
  date: string;
  subject: string;
}

interface AppConfig {
  window: { width, height, minWidth, minHeight, resizable, alwaysOnTop };
  voice: { language, keyWord, confidence, autoStart, responseEnabled };
  education: { defaultSubject, gradeScale, autoSaveGrades, printTasksTemplate };
  paths: { presentationsDir, tasksTemplatesDir, gradesFile, configFile };
  ui: { theme, language, animations, showNotifications };
}
```

## 🎯 Команды голосового ассистента

| Команда | Действие |
|---------|----------|
| "подели учеников на N групп" | Случайное деление на группы |
| "выбери ученика" | Случайный выбор ученика |
| "поставь N баллов [ученику]" | Выставление оценки |
| "открой презентацию [название]" | Запуск презентации |
| "распечатай задачи" | Генерация и печать заданий |

## 🚀 Запуск и разработка

### Режим разработки:
```bash
npm run dev
# Запускает Vite (React) на localhost:5123
# И Electron с DevTools
```

### Сборка:
```bash
npm run build
# Собирает React приложение в dist-react/
# Компилирует TypeScript в dist-electron/
```

## 🔧 Настройка и расширение

### Добавление новой презентации:
1. Поместите файл в `userData/presentations/`
2. Добавьте запись в `config.ts`:
```typescript
presentations = {
  'ваша презентация': {
    name: 'Ваша презентация',
    path: 'presentations/your-presentation.pptx',
    description: 'Описание презентации'
  }
}
```

### Добавление новой команды:
1. В `api-handlers.ts` добавьте IPC handler:
```typescript
ipcMain.handle('your-command', async (event, param) => {
  // Ваша логика
});
```

2. В `preload.cjs` экспортируйте функцию:
```typescript
yourCommand: (param) => ipcRenderer.invoke('your-command', param)
```

3. В `shared-types.ts` добавьте в интерфейс:
```typescript
interface IElectronAPI {
  yourCommand: (param: string) => Promise<void>;
}
```

## 📝 Логирование

Все действия логируются в консоль с эмодзи для удобства:
- 🎤 Голосовые команды
- 👥 Работа с учениками  
- 📝 Оценки
- 📊 Презентации
- 🖨️ Печать
- 💾 Сохранение данных
- ⚙️ Конфигурация

## 🎨 UI компоненты

### VoiceAssistant.tsx - Главный компонент:
- **Индикатор состояния** записи с анимацией
- **Кнопки команд** с иконками Lucide React
- **Результаты** (группы учеников, выбранный ученик)
- **Управление окном** (свернуть/закрыть)

### Стилизация:
- **Tailwind CSS** для быстрой разработки
- **Gradient фоны** и glassmorphism эффекты
- **Responsive дизайн** для разных размеров экрана
- **Темная/светлая** тема (TODO)

## 🔮 Планы развития

- [ ] **Реальное распознавание речи** (Windows Speech API)
- [ ] **Синтез речи** для ответов ассистента
- [ ] **Настройки приложения** через UI
- [ ] **Экспорт данных** (Excel, PDF)
- [ ] **Интеграция с LMS** системами
- [ ] **Многопользовательский режим**
- [ ] **Облачная синхронизация** данных

---

**Создано с ❤️ для учителей физики и не только!**
