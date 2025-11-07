// Импорт общих типов
export type { Class, Group, Student, Lesson, LessonStudent, StudentConflict,
  LessonFolder, ClassFolder, FileItem, Device, DeviceSettings, TaskStatus } from '../../electron/shared-types';

// UI-специфичные типы
export interface SelectedGroup {
  classId: string;
  className: string;
  groupId: string;
  groupName: string;
}

import type { Lesson, LessonStudent } from '../../electron/shared-types';

export interface EnrichedLessonStudent extends LessonStudent {
  name: string
}

export interface EnrichedLesson extends Omit<Lesson, 'students'> {
  students: EnrichedLessonStudent[]
}