// Импорт общих типов
export type { Class, Group, Student, Lesson, LessonStudent, StudentConflict,
  LessonFolder, ClassFolder, FileItem, Device, DeviceSettings } from '../../electron/shared-types';

// UI-специфичные типы
export interface SelectedGroup {
  classId: string;
  className: string;
  groupId: string;
  groupName: string;
}
