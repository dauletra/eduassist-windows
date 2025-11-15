// src/render/services/dialog/SlotFiller.ts

import type { CLUResponse } from '../CLUService';
import type { DialogContext } from '../commands';
import type { AppStore } from '../../store';

/**
 * SlotFiller отвечает за нормализацию CLU entities в параметры команд
 */
export class SlotFiller {
  private store: AppStore;

  constructor(store: AppStore) {
    this.store = store;
  }

  /**
   * Заполнить параметры команды из CLU entities
   */
  fillSlotsFromCLU(cluResponse: CLUResponse, context: DialogContext): Record<string, any> {
    const params: Record<string, any> = {};

    cluResponse.entities.forEach(entity => {
      const extraInfo = Array.isArray(entity.extraInformation)
        ? entity.extraInformation[0]
        : entity.extraInformation;
      const value = extraInfo?.listKey ?? entity.text;

      switch (entity.category) {
        case 'StudentName':
          // Найти studentId по имени
          params.studentName = value;
          params.studentId = this.findStudentIdByName(value, context);
          break;

        case 'NumberValue':
          // Преобразовать в число
          params.numberValue = this.normalizeNumber(value);
          break;

        case 'ClassNumber':
          params.classNumber = value;
          break;

        case 'ClassLetter':
          params.classLetter = value;
          break;

        case 'GroupNumber':
          params.groupNumber = this.normalizeGroupNumber(value);
          break;

        default:
          // Остальные entities оставляем как есть
          params[entity.category] = value;
      }
    });

    // Если есть ClassNumber и ClassLetter, пытаемся найти groupId
    if (params.classNumber && params.classLetter) {
      params.groupId = this.findGroupId(params.classNumber, params.classLetter, params.groupNumber);
    }

    return params;
  }

  /**
   * Найти studentId по имени ученика
   */
  private findStudentIdByName(name: string, context: DialogContext): string | undefined {
    if (!context.currentLesson) return undefined;

    const student = context.currentLesson.students.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );

    return student?.id;
  }

  /**
   * Нормализовать число (убрать текстовые формы)
   */
  private normalizeNumber(value: string): number {
    // Если это уже число
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Текстовые формы чисел
    const textNumbers: Record<string, number> = {
      'один': 1, 'одна': 1, 'одно': 1,
      'два': 2, 'две': 2, 'двое': 2,
      'три': 3, 'трое': 3,
      'четыре': 4,
      'пять': 5,
      'шесть': 6,
      'семь': 7,
      'восемь': 8,
      'девять': 9,
      'десять': 10
    };

    return textNumbers[value.toLowerCase()] ?? 0;
  }

  /**
   * Нормализовать номер группы
   */
  private normalizeGroupNumber(value: string): string {
    if (!value) return '';

    // Убираем слова "группы", "группа" и оставляем только цифру
    const cleaned = value
      .replace(/группы?/gi, '')
      .replace(/\s+/g, '')
      .trim();

    return cleaned || value.trim();
  }

  /**
   * Найти groupId по номеру класса, букве и номеру группы
   */
  private findGroupId(classNumber: string, classLetter: string, groupNumber?: string): string | undefined {
    const state = this.store.getState();
    const className = `${classNumber}${classLetter.toUpperCase()}`;

    const foundClass = state.classes.find(c => c.name === className);
    if (!foundClass) return undefined;

    if (groupNumber) {
      const group = foundClass.groups.find(g => g.name.includes(groupNumber));
      return group?.id;
    }

    // Если группа не указана, вернуть первую
    return foundClass.groups[0]?.id;
  }

  /**
   * Проверить, достаточно ли параметров для команды
   */
  validateParams(
    commandType: string,
    params: Record<string, any>,
    context: DialogContext
  ): {
    isValid: boolean;
    missingParams?: string[];
    message?: string;
  } {
    // Базовая валидация контекста
    if (commandType !== 'OpenJournal' && !context.classId) {
      return {
        isValid: false,
        message: 'Сначала откройте журнал'
      };
    }

    // Валидация для SetGrade
    if (commandType === 'SetGrade') {
      if (!params.studentId && !params.studentName) {
        return {
          isValid: false,
          message: 'Не указан ученик',
          missingParams: ['studentName']
        };
      }

      if (params.numberValue === undefined) {
        return {
          isValid: false,
          message: 'Не указана оценка',
          missingParams: ['numberValue']
        };
      }
    }

    // Валидация для DivideByGroupCount и DivideByGroupSize
    if (commandType === 'DivideByGroupCount' || commandType === 'DivideByGroupSize') {
      if (params.numberValue === undefined) {
        return {
          isValid: false,
          message: 'Не указано количество',
          missingParams: ['numberValue']
        };
      }
    }

    return { isValid: true };
  }
}