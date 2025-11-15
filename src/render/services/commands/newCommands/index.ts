// src/render/services/commands/newCommands/index.ts

import { setGradeCommand } from './setGrade.command';
import { randomStudentCommand } from './randomStudent.command';
import { openJournalCommand } from './openJournal.command';
import { closeJournalCommand } from './closeJournal.command'; // ДОБАВИТЬ
import { updateAttendanceCommand } from './updateAttendance.command'; // ДОБАВИТЬ
import { divideByGroupCountCommand, divideByGroupSizeCommand } from './divideStudents.command'; // ДОБАВИТЬ
import { loadDataCommand } from './loadData.command'; // ДОБАВИТЬ
import { selectLessonCommand } from './selectLesson.command';
import { openSettingsCommand } from './openSettings.command';

/**
 * Все новые команды для регистрации
 */
export const allNewCommands = [
  loadDataCommand, // ДОБАВИТЬ ПЕРВОЙ
  setGradeCommand,
  randomStudentCommand,
  openJournalCommand,
  closeJournalCommand, // ДОБАВИТЬ
  updateAttendanceCommand, // ДОБАВИТЬ
  divideByGroupCountCommand, // ДОБАВИТЬ
  divideByGroupSizeCommand, // ДОБАВИТЬ
  selectLessonCommand,
  openSettingsCommand,
];

// Re-export для удобства
export { loadDataCommand, setGradeCommand, randomStudentCommand, openJournalCommand, closeJournalCommand,
  divideByGroupCountCommand, divideByGroupSizeCommand, openSettingsCommand };