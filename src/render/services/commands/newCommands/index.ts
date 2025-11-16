// src/render/services/commands/newCommands/index.ts

import { setGradeCommand } from './setGrade.command';
import { randomStudentCommand } from './randomStudent.command';
import { openJournalCommand } from './openJournal.command';
import { closeJournalCommand } from './closeJournal.command';
import { updateAttendanceCommand } from './updateAttendance.command';
import { divideByGroupCountCommand, divideByGroupSizeCommand } from './divideStudents.command';
import { loadDataCommand } from './loadData.command';
import { selectLessonCommand } from './selectLesson.command';
import { openSettingsCommand } from './openSettings.command';
import { openFileCommand } from './openFile.command';
import { closeFileCommand } from './closeFile.command';
import type {Command} from "../CommandDispatcher.ts";

/**
 * Все новые команды для регистрации
 */
export const allNewCommands: Command[] = [
  loadDataCommand,
  setGradeCommand,
  randomStudentCommand,
  openJournalCommand,
  closeJournalCommand,
  updateAttendanceCommand,
  divideByGroupCountCommand,
  divideByGroupSizeCommand,
  selectLessonCommand,
  openSettingsCommand,
  openFileCommand,
  closeFileCommand,
];

// Re-export для удобства
export {
  loadDataCommand,
  setGradeCommand,
  randomStudentCommand,
  openJournalCommand,
  closeJournalCommand,
  divideByGroupCountCommand,
  divideByGroupSizeCommand,
  openSettingsCommand,
  openFileCommand,
  closeFileCommand
};