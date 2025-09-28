// src/electron/api/handlers/settings.handler.ts

import { ipcMain } from 'electron';
import type { Class, Group, Student } from '../../shared-types.js';
import { configService } from '../services/config.service.js';
import { studentService } from '../services/student.service.js';

/**
 * Регистрация обработчиков настроек
 */
export function registerSettingsHandlers(): void {

  // Загрузка настроек
  ipcMain.handle('load-settings', async () => {
    try {
      return configService.loadConfig();
    } catch (error) {
      console.error('❌ Ошибка загрузки настроек:', error);
      throw error;
    }
  });

  // Сохранение настроек
  ipcMain.handle('save-settings', async (_event, settings) => {
    try {
      console.log('📥 Получены настройки для сохранения');

      if (!settings) {
        throw new Error('Настройки не могут быть undefined');
      }

      const success = configService.updateConfig(settings);

      if (success) {
        console.log('✅ Настройки успешно сохранены');
        return { success: true };
      } else {
        throw new Error('Не удалось сохранить настройки');
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения настроек:', error);
      throw error;
    }
  });

  // Добавление класса с группами
  ipcMain.handle('add-class-with-groups', async (_event, className: string, groupNames: string[]) => {
    try {
      const classes = studentService.loadStudentsList();

      // Проверка на дубликаты
      if (classes.some(c => c.name.toLowerCase() === className.trim().toLowerCase())) {
        throw new Error('Класс с таким именем уже существует');
      }

      const newClass: Class = {
        id: `class-${Date.now()}`,
        name: className.trim(),
        groups: groupNames.map((groupName, index) => ({
          id: `group-${Date.now()}-${index}`,
          name: groupName.trim(),
          students: [],
          conflicts: []
        }))
      };

      const success = studentService.addClass(newClass);

      if (success) {
        console.log(`✅ Класс "${className}" добавлен`);
        return { success: true, class: newClass };
      } else {
        throw new Error('Не удалось добавить класс');
      }
    } catch (error) {
      console.error('❌ Ошибка добавления класса:', error);
      throw error;
    }
  });

  // Обновление класса
  ipcMain.handle('update-class', async (_event, classId: string, updates: Partial<Class>) => {
    try {
      const success = studentService.updateClass(classId, updates);

      if (success) {
        console.log(`✅ Класс обновлен: ${classId}`);
        return { success: true };
      } else {
        throw new Error('Класс не найден');
      }
    } catch (error) {
      console.error('❌ Ошибка обновления класса:', error);
      throw error;
    }
  });

  // Удаление класса
  ipcMain.handle('delete-class', async (_event, classId: string) => {
    try {
      const success = studentService.deleteClass(classId);

      if (success) {
        console.log(`✅ Класс удален: ${classId}`);
        return { success: true };
      } else {
        throw new Error('Не удалось удалить класс');
      }
    } catch (error) {
      console.error('❌ Ошибка удаления класса:', error);
      throw error;
    }
  });

  // Добавление группы в класс
  ipcMain.handle('add-group-to-class', async (_event, classId: string, groupName: string) => {
    try {
      const classes = studentService.loadStudentsList();
      const cls = classes.find(c => c.id === classId);

      if (!cls) {
        throw new Error('Класс не найден');
      }

      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: groupName.trim(),
        students: [],
        conflicts: []
      };

      cls.groups.push(newGroup);
      const success = studentService.saveStudentsList(classes);

      if (success) {
        console.log(`✅ Группа "${groupName}" добавлена в класс`);
        return { success: true, group: newGroup };
      } else {
        throw new Error('Не удалось добавить группу');
      }
    } catch (error) {
      console.error('❌ Ошибка добавления группы:', error);
      throw error;
    }
  });

  // Добавление ученика в группу
  ipcMain.handle('add-student-to-group', async (_event, classId: string, groupId: string, studentName: string) => {
    try {
      const classes = studentService.loadStudentsList();
      const cls = classes.find(c => c.id === classId);
      const group = cls?.groups.find(g => g.id === groupId);

      if (!group) {
        throw new Error('Группа не найдена');
      }

      // Проверка на дубликаты
      if (group.students.some(s => s.name.toLowerCase() === studentName.trim().toLowerCase())) {
        throw new Error('Ученик с таким именем уже существует в группе');
      }

      const newStudent: Student = {
        id: `student-${Date.now()}`,
        name: studentName.trim()
      };

      group.students.push(newStudent);
      const success = studentService.saveStudentsList(classes);

      if (success) {
        console.log(`✅ Ученик "${studentName}" добавлен в группу`);
        return { success: true, student: newStudent };
      } else {
        throw new Error('Не удалось добавить ученика');
      }
    } catch (error) {
      console.error('❌ Ошибка добавления ученика:', error);
      throw error;
    }
  });

  console.log('📋 Settings handlers зарегистрированы');
}