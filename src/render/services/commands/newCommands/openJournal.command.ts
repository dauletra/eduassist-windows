// src/render/services/commands/newCommands/openJournal.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда открытия журнала
 */

export const openJournalCommand: NewCommand = {
  type: 'OpenJournal',

  async execute(_store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const classNumber = String(params.classNumber || '').trim();
    let classLetter = String(params.classLetter || '').trim().toLowerCase();
    const groupNumber = String(params.groupNumber || '').trim();

    console.log(`🎯 Executing OpenJournal: ${classNumber}${classLetter} группа ${groupNumber}`);

    // Валидация обязательных параметров
    if (!classNumber) {
      return {
        success: false,
        message: 'Не указан номер класса'
      };
    }

    if (!groupNumber) {
      return {
        success: false,
        message: 'Не указан номер группы'
      };
    }

    // Конвертируем русские буквы классов в латинские
    const russianToLatin: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
      'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
      'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu',
      'я': 'ya'
    };

    // Конвертируем букву класса
    if (classLetter) {
      classLetter = russianToLatin[classLetter] || classLetter;
    }

    // Формируем идентификаторы
    const classId = `${classNumber}${classLetter}`;
    const groupId = `${classNumber}${classLetter}-${groupNumber}`;

    console.log(`📝 Generated IDs: classId="${classId}", groupId="${groupId}"`);

    try {
      // Сначала проверяем существование группы через loadStudentsList
      console.log('🔍 Checking group existence...');
      const allStudents = await window.electronAPI.loadStudentsList();
      const targetClass = allStudents.find((c: { id: string; }) => c.id === classId);

      if (!targetClass) {
        console.error(`❌ Class not found: ${classId}`);
        return {
          success: false,
          message: `Класс ${classNumber}${classLetter} не найден. Доступные классы: ${allStudents.map((c: { id: any; }) => c.id).join(', ')}`
        };
      }

      const targetGroup = targetClass.groups.find((g: { id: string; }) => g.id === groupId);

      if (!targetGroup) {
        console.error(`❌ Group not found: ${groupId}`);
        console.log('📋 Available groups:', targetClass.groups.map((g: { id: any; }) => g.id));
        return {
          success: false,
          message: `Группа ${classNumber}${classLetter}-${groupNumber} не найдена. Доступные группы: ${targetClass.groups.map((g: { id: string; }) => g.id.split('-')[1]).join(', ')}`
        };
      }

      console.log(`✅ Group found: ${targetGroup.name}`);

      // Загружаем уроки группы
      const groupLessons = await window.electronAPI.getAllLessons(classId, groupId);

      // Пытаемся найти урок на сегодня
      let todayLesson = await window.electronAPI.getTodayLesson(classId, groupId);

      // Если нет - создаем
      if (!todayLesson) {
        console.log('📝 Creating today lesson...');
        todayLesson = await window.electronAPI.createLesson(
          classId,
          groupId,
          'Урок физики. Тема'
        );
      }

      const displayName = classLetter
        ? `${classNumber}${classLetter} ${groupNumber} группа`
        : `${classNumber} класс ${groupNumber} группа`;

      return {
        success: true,
        message: `Журнал ${displayName} открыт`,
        newState: {
          currentClassId: classId,
          currentGroupId: groupId,
          currentLessonId: todayLesson.id,
          lessons: groupLessons,
          loading: false
        }
      };

    } catch (error) {
      console.error('❌ Failed to open journal:', error);

      let errorMessage = 'Не удалось открыть журнал';
      if (error instanceof Error) {
        if (error.message.includes('Группа не найдена')) {
          errorMessage = `Группа ${classNumber}${classLetter}-${groupNumber} не существует. Проверьте правильность введенных данных.`;
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }
};