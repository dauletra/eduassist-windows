/**
 * Центральный файл экспорта всех определений команд
 */

import { setGradeCommand } from './setGrade.command';

import { randomStudentCommand } from './randomStudent.command';
import { divideByGroupCountCommand, divideByGroupSizeCommand } from './divideStudents.command';
import { openJournalCommand } from './openJournal.command';

/**
 * Все доступные команды
 */
export const allCommands = [
  setGradeCommand,
  randomStudentCommand,
  divideByGroupCountCommand,
  divideByGroupSizeCommand,
  openJournalCommand,
];

// Re-export для удобства
export { setGradeCommand,randomStudentCommand, divideByGroupSizeCommand, divideByGroupCountCommand, openJournalCommand };