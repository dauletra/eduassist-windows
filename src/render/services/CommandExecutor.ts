/**
 * CommandExecutor - диалоговый менеджер для выполнения команд
 * Основан на логике Python dialog_manager.py
 */

import { type CLUResponse } from './CLUService';

export interface CommandContext {
  classNumber?: string;
  classLetter?: string;
  groupNumber?: string;
  students?: Student[];
  files?: string[];
}

interface Student {
  firstName: string;
  lastName: string;
  grade?: number;
  attendance?: boolean;
}

export interface CommandResult {
  success: boolean;
  message: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

interface IntentSlots {
  [key: string]: string | number | null;
}

abstract class BaseIntent {
  protected slots: IntentSlots = {};
  protected slotOrder: string[] = [];
  protected slotPrompts: { [key: string]: string } = {};

  constructor(
    protected context: CommandContext,
    slotNames: string[],
    slotPrompts: { [key: string]: string },
    entities?: { [key: string]: string | number }
  ) {
    this.slotOrder = slotNames;
    this.slotPrompts = slotPrompts;

    // Инициализировать все слоты как null
    slotNames.forEach(slot => {
      this.slots[slot] = null;
    });

    // Заполнить слоты из entities
    if (entities) {
      this.handleEntities(entities);
    }
  }

  handleEntities(entities: { [key: string]: string | number }): void {
    Object.entries(entities).forEach(([key, value]) => {
      if (key in this.slots && this.validateSlot(key, value)) {
        this.slots[key] = value;
        console.log(`✅ Slot '${key}' filled with value: ${value}`);
      }
    });
  }

  protected validateSlot(slotName: string, slotValue: string | number): boolean {
    return true; // Переопределяется в дочерних классах
  }

  isComplete(): boolean {
    const complete = this.slotOrder.every(slot => this.slots[slot] !== null);
    console.log('🔍 Intent completion check:', {
      slots: this.slots,
      complete
    });
    return complete;
  }

  nextPrompt(): string | null {
    for (const slot of this.slotOrder) {
      if (this.slots[slot] === null) {
        console.log(`❓ Missing slot: ${slot}`);
        return this.slotPrompts[slot];
      }
    }
    return null;
  }

  abstract finishAction(): CommandResult;
}

class OpenJournalIntent extends BaseIntent {
  constructor(context: CommandContext, entities?: { [key: string]: string | number }) {
    const slotNames = ['classNumber', 'classLetter', 'groupNumber'];
    const slotPrompts = {
      classNumber: 'Какой класс открыть? Например: 9',
      classLetter: 'Какую букву класса? Например: МР или А',
      groupNumber: 'Какую группу открыть? Первую или вторую?'
    };

    super(context, slotNames, slotPrompts, entities);
  }

  finishAction(): CommandResult {
    const classId = `${this.slots.classNumber}${this.slots.classLetter}`;
    const groupId = `${classId} ${this.slots.groupNumber} группа`;

    // TODO: Загрузить реальных учеников из journal.json
    const mockStudents: Student[] = [
      { firstName: 'Асылбек', lastName: 'Нұрболов', attendance: true },
      { firstName: 'Айдана', lastName: 'Сериковна', attendance: true },
      { firstName: 'Нурбол', lastName: 'Алматов', attendance: true }
    ];

    // Обновить контекст
    this.context.classNumber = String(this.slots.classNumber);
    this.context.classLetter = String(this.slots.classLetter);
    this.context.groupNumber = String(this.slots.groupNumber);
    this.context.students = mockStudents;

    console.log('✅ Journal opened:', groupId);
    console.log('📋 Context updated:', this.context);

    return {
      success: true,
      message: `Открыт журнал ${groupId}. Доступно ${mockStudents.length} учеников`
    };
  }
}

class SetGradeIntent extends BaseIntent {
  constructor(context: CommandContext, entities?: { [key: string]: string | number }) {
    const slotNames = ['studentName', 'numberValue'];
    const slotPrompts = {
      studentName: 'Кому поставить оценку?',
      numberValue: 'Какую оценку поставить? От 1 до 10'
    };

    super(context, slotNames, slotPrompts, entities);
  }

  protected validateSlot(slotName: string, slotValue: string | number): boolean {
    if (slotName === 'numberValue') {
      const grade = Number(slotValue);
      return Number.isInteger(grade) && grade >= 1 && grade <= 10;
    }
    if (slotName === 'studentName') {
      return typeof slotValue === 'string' && slotValue.trim().length >= 2;
    }
    return true;
  }

  finishAction(): CommandResult {
    const studentName = this.slots.studentName;
    const grade = this.slots.numberValue;

    // TODO: Записать оценку через IPC
    // window.electron.setGrade(context, studentName, grade)

    console.log(`✅ Grade ${grade} set for ${studentName}`);

    return {
      success: true,
      message: `Оценка ${grade} поставлена ученику ${studentName}`
    };
  }
}

class RandomStudentIntent extends BaseIntent {
  constructor(context: CommandContext, entities?: { [key: string]: string | number }) {
    super(context, [], {}, entities);
  }

  isComplete(): boolean {
    return true; // Нет слотов для заполнения
  }

  finishAction(): CommandResult {
    if (!this.context.students || this.context.students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст. Сначала откройте журнал'
      };
    }

    const randomIndex = Math.floor(Math.random() * this.context.students.length);
    const selected = this.context.students[randomIndex];

    console.log('🎲 Random student selected:', selected.firstName);

    // TODO: Отобразить в UI
    // window.electron.showRandomStudent(selected)

    return {
      success: true,
      message: `Выбран ученик: ${selected.firstName} ${selected.lastName}`
    };
  }
}

class DivideByGroupSizeIntent extends BaseIntent {
  constructor(context: CommandContext, entities?: { [key: string]: string | number }) {
    const slotNames = ['numberValue'];
    const slotPrompts = {
      numberValue: 'По сколько учеников должно быть в каждой группе?'
    };

    super(context, slotNames, slotPrompts, entities);
  }

  protected validateSlot(slotName: string, slotValue: string | number): boolean {
    if (slotName === 'numberValue') {
      const size = Number(slotValue);
      const maxSize = this.context.students?.length || 0;
      return Number.isInteger(size) && size >= 1 && size <= maxSize;
    }
    return true;
  }

  finishAction(): CommandResult {
    const students = [...(this.context.students || [])];
    const groupSize = Number(this.slots.numberValue);

    // Перемешать учеников
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }

    // Разделить на группы
    const groups: Student[][] = [];
    for (let i = 0; i < students.length; i += groupSize) {
      groups.push(students.slice(i, i + groupSize));
    }

    let response = `Ученики разделены по ${groupSize} человек(а):\n`;
    groups.forEach((group, idx) => {
      response += `${idx + 1} группа: ${group.map(s => s.firstName).join(', ')}\n`;
    });

    console.log('👥 Groups formed by size:', groups);

    // TODO: Отобразить группы в UI
    // window.electron.showGroups(groups)

    return {
      success: true,
      message: response.trim()
    };
  }
}

class DivideByGroupCountIntent extends BaseIntent {
  constructor(context: CommandContext, entities?: { [key: string]: string | number }) {
    const slotNames = ['numberValue'];
    const slotPrompts = {
      numberValue: 'На сколько групп разделить учеников?'
    };

    super(context, slotNames, slotPrompts, entities);
  }

  protected validateSlot(slotName: string, slotValue: string | number): boolean {
    if (slotName === 'numberValue') {
      const count = Number(slotValue);
      const maxCount = this.context.students?.length || 0;
      return Number.isInteger(count) && count >= 1 && count <= maxCount;
    }
    return true;
  }

  finishAction(): CommandResult {
    const students = [...(this.context.students || [])];
    const groupCount = Number(this.slots.numberValue);

    // Перемешать учеников
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }

    // Создать пустые группы
    const groups: Student[][] = Array.from({ length: groupCount }, () => []);

    // Распределить учеников по группам равномерно
    students.forEach((student, idx) => {
      groups[idx % groupCount].push(student);
    });

    let response = `Ученики разделены на ${groupCount} групп(ы):\n`;
    groups.forEach((group, idx) => {
      response += `${idx + 1} группа: ${group.map(s => s.firstName).join(', ')}\n`;
    });

    console.log('👥 Groups formed by count:', groups);

    // TODO: Отобразить группы в UI
    // window.electron.showGroups(groups)

    return {
      success: true,
      message: response.trim()
    };
  }
}

export class CommandExecutor {
  private context: CommandContext = {};
  private currentIntent: BaseIntent | null = null;

  setContext(context: Partial<CommandContext>): void {
    this.context = { ...this.context, ...context };
    console.log('📋 Context updated:', this.context);
  }

  getContext(): CommandContext {
    return { ...this.context };
  }

  hasContext(): boolean {
    return !!(this.context.classNumber && this.context.classLetter);
  }

  async execute(cluResponse: CLUResponse): Promise<CommandResult> {
    const intent = cluResponse.topIntent;

    console.group('⚙️ Command Executor');
    console.log('Intent:', intent);
    console.log('Has Context:', this.hasContext());
    console.log('Current Context:', this.context);
    console.log('Entities:', cluResponse.entities.map(e => `${e.category}="${e.text}"`).join(', '));
    console.groupEnd();

    // Преобразовать entities в объект
    const entities: { [key: string]: string | number } = {};
    cluResponse.entities.forEach(entity => {
      const key = this.mapEntityCategory(entity.category);
      entities[key] = entity.text;
    });

    console.log('📦 Mapped entities:', entities);

    // Если нет контекста и это не OpenJournal, запросить контекст
    if (!this.hasContext() && intent !== 'OpenJournal') {
      console.log('⚠️ No context available, requesting journal selection');
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Сначала откройте журнал. Скажите: "Открой журнал 9 МР класс первой группы"',
        message: 'Необходимо открыть журнал'
      };
    }

    // Получить или создать intent
    this.currentIntent = this.getOrCreateIntent(intent, entities);

    // Проверить заполнены ли все слоты
    if (!this.currentIntent.isComplete()) {
      const prompt = this.currentIntent.nextPrompt();
      console.log('❓ Intent incomplete, asking for:', prompt);

      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: prompt || 'Уточните данные',
        message: 'Недостаточно данных'
      };
    }

    // Выполнить действие
    console.log('✅ Intent complete, executing action...');
    const result = this.currentIntent.finishAction();

    // Сбросить текущий intent после выполнения
    this.currentIntent = null;

    return result;
  }

  private getOrCreateIntent(intentName: string, entities: { [key: string]: string | number }): BaseIntent {
    // Если есть текущий intent того же типа, обновить его entities
    if (this.currentIntent) {
      const currentIntentName = this.currentIntent.constructor.name.replace('Intent', '');

      if (currentIntentName === intentName) {
        console.log('♻️ Updating existing intent with new entities');
        this.currentIntent.handleEntities(entities);
        return this.currentIntent;
      } else {
        console.log('🔄 Switching to new intent, resetting...');
        this.currentIntent = null;
      }
    }

    // Создать новый intent
    console.log('🆕 Creating new intent:', intentName);

    const intentClass = this.getIntentClass(intentName);
    if (!intentClass) {
      throw new Error(`Intent "${intentName}" not supported`);
    }

    return new intentClass(this.context, entities);
  }

  private getIntentClass(intentName: string): typeof BaseIntent | null {
    const intentClasses: { [key: string]: typeof BaseIntent } = {
      'OpenJournal': OpenJournalIntent,
      'SetGrade': SetGradeIntent,
      'RandomStudent': RandomStudentIntent,
      'DivideByGroupSize': DivideByGroupSizeIntent,
      'DivideByGroupCount': DivideByGroupCountIntent
    };

    return intentClasses[intentName] || null;
  }

  private mapEntityCategory(category: string): string {
    // Маппинг категорий entities на ключи слотов
    const mapping: { [key: string]: string } = {
      'ClassNumber': 'classNumber',
      'ClassLetter': 'classLetter',
      'GroupNumber': 'groupNumber',
      'StudentName': 'studentName',
      'NumberValue': 'numberValue',
      'FileName': 'fileName',
      'Duration': 'duration'
    };

    return mapping[category] || category.toLowerCase();
  }

  reset(): void {
    this.context = {};
    this.currentIntent = null;
    console.log('🔄 CommandExecutor reset');
  }
}

export const commandExecutor = new CommandExecutor();