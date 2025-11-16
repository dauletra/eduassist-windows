// src/render/services/dialog/SlotFiller.ts

import type { CLUResponse } from '../CLUService';

/**
 * SlotFiller отвечает за нормализацию CLU entities в параметры команд
 */
export class SlotFiller {
  /**
   * Заполнить параметры команды из CLU entities
   */
  fillSlotsFromCLU(cluResponse: CLUResponse): Record<string, any> {
    return this.normalizeByIntent(cluResponse.topIntent, cluResponse.entities);
  }

  /**
   * Нормализация по типу интента
   */
  private normalizeByIntent(intent: string, entities: any[]): any {
    switch (intent) {
      case 'OpenJournal':
        console.log('  → normalizeOpenJournal');
        return this.normalizeOpenJournal(entities);

      case 'SetGrade':
      case ' SetGrade':
        console.log('  → normalizeSetGrade');
        return this.normalizeSetGrade(entities);

      case 'DivideByCount':
      case ' DivideByCount':
      case 'DivideBySize':
        console.log('  → normalizeDivide');
        return this.normalizeDivide(entities);

      case 'RandomStudent':
        console.log('  → empty object');
        return {};

      case 'MarkAbsent':
        console.log('  → markAbsent');
        return this.normalizeMarkAbsent(entities);

      default:
        console.log('  → normalizeGeneric (FALLBACK)');
        return this.normalizeGeneric(entities);
    }
  }

  /**
   * Нормализация для OpenJournal
   */
  private normalizeOpenJournal(entities: any[]): any {
    const params: any = {};

    // ClassNumber: только NumberValue > 6
    const numberValues = entities.filter(e => e.category === 'NumberValue');
    const classNumber = numberValues.find(e => {
      const key = e.extraInformation?.[0]?.key;
      return key && parseInt(key) > 6;
    });

    if (classNumber) {
      params.classNumber = classNumber.extraInformation[0].key;
    }

    // ClassLetter - преобразуем в заглавную
    const classLetter = entities.find(e => e.category === 'ClassLetter');
    if (classLetter) {
      const letter = classLetter.extraInformation?.[0]?.key || classLetter.text;
      params.classLetter = letter.toUpperCase();
    }

    // GroupNumber - берем только цифру из key
    const groupNumber = entities.find(e => e.category === 'GroupNumber');
    if (groupNumber) {
      const key = groupNumber.extraInformation?.[0]?.key || groupNumber.text;
      // Извлекаем только цифру из "2 топ" или "екінші топ"
      const match = key.match(/\d+/);
      params.groupNumber = match ? match[0] : key;
    }

    return params;
  }

  /**
   * Нормализация для SetGrade
   */
  private normalizeSetGrade(entities: any[]): any {
    const params: any = {};

    // StudentName
    const studentNames = entities.filter(e => e.category === 'StudentName');
    let validStudent = studentNames.find(e => e.extraInformation?.[0]?.key);

    // Если нет - берем первого по тексту
    if (!validStudent && studentNames.length > 0) {
      validStudent = studentNames[0];
    }

    if (validStudent) {
      // Приоритет: extraInformation.key -> text
      params.studentName = validStudent.extraInformation?.[0]?.key || validStudent.text;
    }

    // NumberValue (оценка)
    const numberValue = entities.find(e => e.category === 'NumberValue');
    if (numberValue) {
      const value = numberValue.extraInformation?.[0]?.key || numberValue.text;
      params.numberValue = this.normalizeNumber(value);
    }

    return params;
  }

  /**
   * Нормализация для MarkAbsent
   */
  private normalizeMarkAbsent(entities: any[]): any {
    const params: any = {};

    // StudentName
    const studentNames = entities.filter(e => e.category === 'StudentName');

    // Сначала ищем с extraInformation (предпочтительно)
    let validStudent = studentNames.find(e => e.extraInformation?.[0]?.key);

    // Если нет - берем первого по тексту
    if (!validStudent && studentNames.length > 0) {
      validStudent = studentNames[0];
    }

    if (validStudent) {
      // Приоритет: extraInformation.key -> text
      params.studentName = validStudent.extraInformation?.[0]?.key || validStudent.text;
    }

    // Отсутствие всегда false (отсутствует)
    params.attendance = false;

    return params;
  }

  /**
   * Нормализация для DivideByGroupCount и DivideByGroupSize
   */
  private normalizeDivide(entities: any[]): any {
    const params: any = {};

    // NumberValue (количество групп или размер группы)
    const numberValue = entities.find(e => e.category === 'NumberValue');
    if (numberValue) {
      const value = numberValue.extraInformation?.[0]?.key || numberValue.text;
      params.numberValue = this.normalizeNumber(value);
    }

    return params;
  }

  /**
   * Общая нормализация (fallback)
   */
  private normalizeGeneric(entities: any[]): any {
    const params: Record<string, any> = {};

    entities.forEach(entity => {
      const extraInfo = Array.isArray(entity.extraInformation)
        ? entity.extraInformation[0]
        : entity.extraInformation;
      const value = extraInfo?.key ?? entity.text;

      params[entity.category] = value;
    });

    return params;
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
}