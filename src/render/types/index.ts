// src/render/types/index.ts
// Импорт общих типов
export type { Class, Group, Student, EnrichedLessonStudent, Lesson, EnrichedLesson, LessonStudent, StudentConflict,
  LessonFolder, ClassFolder, FileItem, Device, DeviceSettings, TaskStatus,
  AppContext, DialogContext } from '../../electron/shared-types.js';

// UI-специфичные типы
export interface SelectedGroup {
  classId: string;
  className: string;
  groupId: string;
  groupName: string;
}
