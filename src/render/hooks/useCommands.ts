// src/render/hooks/useCommands.ts

import { useCallback, useMemo } from 'react';
import { useCommandDispatcher } from '../contexts/StoreContext'; // ИЗМЕНЕНО

/**
 * Хук для удобного использования команд из UI компонентов
 *
 * Использует CommandDispatcher из React Context
 * Все команды выполняются через executeFromUI
 */
export function useCommands() {
  const commandDispatcher = useCommandDispatcher(); // ИЗМЕНЕНО

  /**
   * Поставить оценку ученику
   */
  const setGrade = useCallback(
    async (studentId: string, grade: number) => {
      return commandDispatcher.executeFromUI( // ИЗМЕНЕНО
        'SetGrade',
        { studentName: studentId, numberValue: grade }
      );
    },
    [commandDispatcher]
  );

  /**
   * Открыть журнал класса
   */
  const openJournal = useCallback(
    async (classNumber: string, classLetter: string, groupNumber: string) => {
      return commandDispatcher.executeFromUI( // ИЗМЕНЕНО
        'OpenJournal',
        { classNumber, classLetter, groupNumber }
      );
    },
    [commandDispatcher]
  );

  /**
   * Выбрать случайного ученика
   */
  const randomStudent = useCallback(
    async (onlyPresent: boolean = true) => {
      return commandDispatcher.executeFromUI( // ИЗМЕНЕНО
        'RandomStudent',
        { onlyPresent }
      );
    },
    [commandDispatcher]
  );

  /**
   * Разделить учеников на N групп
   */
  const divideByGroupCount = useCallback(
    async (groupCount: number, onlyPresent: boolean = true) => {
      return commandDispatcher.executeFromUI( // ИЗМЕНЕНО
        'DivideByGroupCount',
        { numberValue: groupCount, onlyPresent }
      );
    },
    [commandDispatcher]
  );

  /**
   * Разделить учеников по N человек в группе
   */
  const divideByGroupSize = useCallback(
    async (groupSize: number, onlyPresent: boolean = true) => {
      return commandDispatcher.executeFromUI( // ИЗМЕНЕНО
        'DivideByGroupSize',
        { numberValue: groupSize, onlyPresent }
      );
    },
    [commandDispatcher]
  );

  return useMemo(
    () => ({
      setGrade,
      openJournal,
      randomStudent,
      divideByGroupCount,
      divideByGroupSize
    }),
    [setGrade, openJournal, randomStudent, divideByGroupCount, divideByGroupSize]
  );
}