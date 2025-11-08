import { useCallback, useMemo } from 'react';
import { commandExecutor } from '../services/commands/CommandExecutor';
import { useCommandContext } from '../contexts/CommandContext';

/**
 * Хук для удобного использования команд из UI компонентов
 *
 * Автоматически получает context и currentLesson из React Context
 * Все команды выполняются с source: 'ui'
 *
 * @example
 * const commands = useCommands();
 * commands.setGrade('s001', 8);
 * commands.randomStudent(true);
 */
export function useCommands() {
  // Получаем context автоматически из React Context
  const { classId, groupId, lessonId, currentLesson } = useCommandContext();

  const context = useMemo(() => ({
    classId,
    groupId,
    lessonId
  }), [classId, groupId, lessonId]);

  /**
   * Поставить оценку ученику
   */
  const setGrade = useCallback(
    async (studentId: string, grade: number) => {
      return commandExecutor.execute(
        'SetGrade',
        { studentName: studentId, numberValue: grade },
        'ui',
        context,
        currentLesson
      );
    },
    [context, currentLesson]
  );

  /**
   * Открыть журнал класса
   */
  const openJournal = useCallback(
    async (classNumber: string, classLetter: string, groupNumber: string) => {
      return commandExecutor.execute(
        'OpenJournal',
        { classNumber, classLetter, groupNumber },
        'ui',
        context,
        currentLesson
      );
    },
    [context, currentLesson]
  );

  /**
   * Выбрать случайного ученика
   */
  const randomStudent = useCallback(
    async (onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'RandomStudent',
        { onlyPresent },
        'ui',
        context,
        currentLesson
      );
    },
    [context, currentLesson]
  );

  /**
   * Разделить учеников на N групп
   */
  const divideByGroupCount = useCallback(
    async (groupCount: number, onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'DivideByGroupCount',
        { numberValue: groupCount, onlyPresent },
        'ui',
        context,
        currentLesson
      );
    },
    [context, currentLesson]
  );

  /**
   * Разделить учеников по N человек в группе
   */
  const divideByGroupSize = useCallback(
    async (groupSize: number, onlyPresent: boolean = true) => {
      return commandExecutor.execute(
        'DivideByGroupSize',
        { numberValue: groupSize, onlyPresent },
        'ui',
        context,
        currentLesson
      );
    },
    [context, currentLesson]
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