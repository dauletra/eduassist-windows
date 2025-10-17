/**
 * CommandExecutor - выполнение команд на основе intent и entities из CLU
 */

import { type CLUResponse } from './CLUService';

export interface CommandContext {
  currentGroup?: string; // Например: "9 МР класс 1 группа"
  students?: string[];
  files?: string[];
}

export interface CommandResult {
  success: boolean;
  message: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

export class CommandExecutor {
  private context: CommandContext = {};

  setContext(context: Partial<CommandContext>): void {
    this.context = { ...this.context, ...context };
    console.log('📋 Context updated:', this.context);
  }

  getContext(): CommandContext {
    return { ...this.context };
  }

  hasContext(): boolean {
    return !!this.context.currentGroup;
  }

  async execute(cluResponse: CLUResponse): Promise<CommandResult> {
    const intent = cluResponse.topIntent;

    console.group('⚙️ Command Executor');
    console.log('Intent:', intent);
    console.log('Has Context:', this.hasContext());
    console.log('Current Context:', this.context);
    console.log('Entities:', cluResponse.entities.map(e => `${e.category}="${e.text}"`).join(', '));
    console.groupEnd();

    // Если нет контекста (журнал не открыт), запросить его
    if (!this.hasContext()) {
      console.log('⚠️ No context available, requesting journal selection');
      return this.requestContext();
    }

    // Роутинг команд по intent
    switch (intent) {
      case 'OpenJournal':
        return this.handleOpenJournal(cluResponse);

      case 'SetGrade':
        return this.handleSetGrade(cluResponse);

      case 'RandomStudent':
        return this.handleRandomStudent(cluResponse);

      case 'DivideByGroupCount':
      case 'DivideByGroupSize':
        return this.handleDivideIntoGroups(cluResponse);

      case 'OpenFile':
        return this.handleOpenFile(cluResponse);

      case 'PrintDocument':
        return this.handlePrintDocument(cluResponse);

      case 'StartTimer':
        return this.handleStartTimer(cluResponse);

      case 'None':
        console.log('❓ Intent: None - command not recognized');
        return {
          success: false,
          message: 'Команда не распознана. Попробуйте переформулировать.'
        };

      default:
        console.log(`❓ Unknown intent: ${intent}`);
        return {
          success: false,
          message: `Команда "${intent}" не поддерживается`
        };
    }
  }

  private requestContext(): CommandResult {
    return {
      success: false,
      needsClarification: true,
      clarificationQuestion: 'Журнал какого класса и группы нужно открыть?',
      message: 'Необходимо открыть журнал'
    };
  }

  private handleOpenJournal(response: CLUResponse): CommandResult {
    // Извлечь класс и группу из entities
    const classEntity = response.entities.find(e => e.category === 'Class');
    const groupEntity = response.entities.find(e => e.category === 'Group');

    if (!classEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Какой класс открыть?',
        message: 'Не указан класс'
      };
    }

    const className = classEntity.text;
    const groupName = groupEntity?.text || '1 группа';

    const journalId = `${className} ${groupName}`;

    // TODO: Реальное открытие журнала через IPC
    // window.electron.openJournal(journalId)

    this.setContext({
      currentGroup: journalId,
      students: [], // TODO: загрузить из journal.json
      files: [] // TODO: загрузить файлы из папки урока
    });

    return {
      success: true,
      message: `Открыт журнал: ${journalId}`
    };
  }

  private handleSetGrade(response: CLUResponse): CommandResult {
    const studentEntity = response.entities.find(e => e.category === 'Student');
    const gradeEntity = response.entities.find(e => e.category === 'Grade');

    if (!studentEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Какому ученику поставить оценку?',
        message: 'Не указан ученик'
      };
    }

    if (!gradeEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: `Какую оценку поставить ученику ${studentEntity.text}?`,
        message: 'Не указана оценка'
      };
    }

    const studentName = studentEntity.text;
    const grade = gradeEntity.text;

    // TODO: Реальная запись оценки через IPC
    // window.electron.setGrade(this.context.currentGroup, studentName, grade)

    return {
      success: true,
      message: `Оценка ${grade} поставлена ученику ${studentName}`
    };
  }

  private handleRandomStudent(response: CLUResponse): CommandResult {
    if (!this.context.students || this.context.students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст'
      };
    }

    const randomIndex = Math.floor(Math.random() * this.context.students.length);
    const selectedStudent = this.context.students[randomIndex];

    // TODO: Отобразить выбранного ученика в UI
    // window.electron.showRandomStudent(selectedStudent)

    return {
      success: true,
      message: `Выбран ученик: ${selectedStudent}`
    };
  }

  private handleDivideIntoGroups(response: CLUResponse): CommandResult {
    const groupCountEntity = response.entities.find(e => e.category === 'Number');

    if (!groupCountEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'На сколько групп разделить учеников?',
        message: 'Не указано количество групп'
      };
    }

    const groupCount = parseInt(groupCountEntity.text);

    if (!this.context.students || this.context.students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст'
      };
    }

    // TODO: Реальное деление на группы
    // window.electron.divideIntoGroups(this.context.students, groupCount)

    return {
      success: true,
      message: `Ученики разделены на ${groupCount} групп(ы)`
    };
  }

  private handleOpenFile(response: CLUResponse): CommandResult {
    const fileEntity = response.entities.find(e => e.category === 'FileName');

    if (!fileEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Какой файл открыть?',
        message: 'Не указано имя файла'
      };
    }

    const fileName = fileEntity.text;

    // TODO: Найти файл в контексте и открыть
    // const file = this.context.files?.find(f => f.includes(fileName));
    // window.electron.openFile(file)

    return {
      success: true,
      message: `Открыт файл: ${fileName}`
    };
  }

  private handlePrintDocument(response: CLUResponse): CommandResult {
    const fileEntity = response.entities.find(e => e.category === 'FileName');

    if (!fileEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Какой документ распечатать?',
        message: 'Не указано имя документа'
      };
    }

    const fileName = fileEntity.text;

    // TODO: Печать документа
    // window.electron.printDocument(fileName)

    return {
      success: true,
      message: `Отправлен на печать: ${fileName}`
    };
  }

  private handleStartTimer(response: CLUResponse): CommandResult {
    const durationEntity = response.entities.find(e =>
      e.category === 'Duration' || e.category === 'Number'
    );

    if (!durationEntity) {
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'На сколько минут установить таймер?',
        message: 'Не указана длительность'
      };
    }

    const duration = durationEntity.text;

    // TODO: Запуск таймера
    // window.electron.startTimer(duration)

    return {
      success: true,
      message: `Таймер запущен на ${duration}`
    };
  }

  reset(): void {
    this.context = {};
    console.log('🔄 Context reset');
  }
}

export const commandExecutor = new CommandExecutor();