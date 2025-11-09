import { useCallback, useMemo } from 'react';
import { useCommandExecutor } from '../contexts/CommandContext';

/**
 * Хук для удобного использования команд из UI компонентов
 *
 * Использует CommandExecutor из React Context
 * Все команды выполняются с source: 'ui'
 *
 * @example
 * const commands = useCommands();
 * commands.setGrade('s001', 8);
 * commands.randomStudent(true);
 */
export function useCommands() {
  const commandExecutor = useCommandExecutor();

  /**
   * Поставить оценку ученику
   */
  const setGrade = useCallback(
    async (studentId: string, grade: number) => {
      return commandExecutor.execute(
        'SetGrade',
        { studentName: studentId, numberValue: grade },
        'ui'
      );
    },
    [commandExecutor]
  );

  /**
   * Открыть журнал класса
   */
  const openJournal = useCallback(
    async (classNumber: string, classLetter: string, groupNumber: string) => {
      return commandExecutor.execute(
        'OpenJournal',
        { classNumber, classLetter, groupNumber },
        'ui'
      );
    },
    [commandExecutor]
  );

  /**
   * Выбрать случайного ученика
   */
  const randomStudent = useCallback(
    async (onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'RandomStudent',
        { onlyPresent },
        'ui'
      );
    },
    [commandExecutor]
  );

  /**
   * Разделить учеников на N групп
   */
  const divideByGroupCount = useCallback(
    async (groupCount: number, onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'DivideByGroupCount',
        { numberValue: groupCount, onlyPresent },
        'ui'
      );
    },
    [commandExecutor]
  );

  /**
   * Разделить учеников по N человек в группе
   */
  const divideByGroupSize = useCallback(
    async (groupSize: number, onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'DivideByGroupSize',
        { numberValue: groupSize, onlyPresent },
        'ui'
      );
    },
    [commandExecutor]
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