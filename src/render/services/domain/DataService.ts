// src/render/services/domain/DataService.ts
import { AppStore } from "../../store";
import { ElectronAdapter } from "./ElectronAdapter";

/**
 * Интерфейс структуры students.json
 */
// interface StudentsFileStructure {
//   classes: any[];
//   students: any[];
// }

/**
 * Сервис для работы с данными приложения (классы и журналы)
 */
export class DataService {
  private store: AppStore;
  private api: ElectronAdapter;

  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.store = store;
    this.api = api;
  }

  /**
   * Загрузить все классы и группы (при старте приложения)
   */
  async loadClasses() {
    try {
      this.store.setState(prev => ({ ...prev, loading: true, error: null }));

      // Загружаем students.json
      const studentsData = await this.api.loadStudentsList();

      // ✅ Извлекаем массив классов из структуры файла
      let classesArray: any[] = [];
      let studentsArray: any[] = [];

      if (studentsData && typeof studentsData === 'object') {
        // Если это объект с полем classes
        if ('classes' in studentsData && Array.isArray(studentsData.classes)) {
          classesArray = studentsData.classes;
          studentsArray = studentsData.students || [];
        }
        // Если это напрямую массив (старый формат)
        else if (Array.isArray(studentsData)) {
          classesArray = studentsData;
        }
      }

      // ✅ Обогащаем классы информацией об учениках
      const enrichedClasses = this.enrichClassesWithStudents(
        classesArray,
        studentsArray
      );

      this.store.setState(prev => ({
        ...prev,
        classes: enrichedClasses,
        loading: false
      }));

      console.log('✅ DataService: Classes loaded:', enrichedClasses.length);

      return {
        success: true,
        message: `Загружено ${enrichedClasses.length} классов`,
        data: { classCount: enrichedClasses.length }
      };

    } catch (error) {
      console.error('DataService: Failed to load classes:', error);

      this.store.setState(prev => ({
        ...prev,
        error: 'Не удалось загрузить данные классов',
        classes: [],
        loading: false
      }));

      return {
        success: false,
        message: 'Не удалось загрузить данные классов'
      };
    }
  }

  /**
   * Загрузить уроки для конкретного класса и группы (при выборе группы)
   */
  async loadLessonsForGroup(classId: string, groupId: string) {
    try {
      const groupLessons = await this.api.getLessonsByGroup(classId, groupId);

      // ✅ Обогащаем уроки данными учеников из текущей группы
      const state = this.store.getState();
      const enrichedLessons = this.enrichLessonsWithStudentNames(
        groupLessons,
        state.currentGroup
      );

      // Сохраняем в Store
      this.store.setState(prev => ({
        ...prev,
        lessons: enrichedLessons
      }));

      console.log(`✅ DataService: Loaded ${enrichedLessons.length} lessons for ${groupId}`);

      return {
        success: true,
        message: `Загружено ${enrichedLessons.length} уроков`,
        data: { lessonCount: enrichedLessons.length }
      };

    } catch (error) {
      console.error('DataService: Failed to load lessons:', error);

      this.store.setState(prev => ({
        ...prev,
        lessons: []
      }));

      return {
        success: false,
        message: 'Не удалось загрузить журнал уроков'
      };
    }
  }

  /**
   * Создать урок на сегодня если его нет
   */
  async ensureTodayLesson(classId: string, groupId: string, defaultTopic: string = "Урок физики. Тема") {
    try {
      // Проверяем есть ли урок на сегодня
      let todayLesson = await this.api.getTodayLesson(classId, groupId);

      if (!todayLesson) {
        // Создаем новый урок
        todayLesson = await this.api.createLesson(classId, groupId, defaultTopic);

        // Перезагружаем уроки
        await this.loadLessonsForGroup(classId, groupId);
      }

      return {
        success: true,
        message: 'Урок на сегодня готов',
        data: { lesson: todayLesson }
      };

    } catch (error) {
      console.error('DataService: Failed to ensure today lesson:', error);
      return {
        success: false,
        message: 'Не удалось создать урок'
      };
    }
  }

  // ========================================
  // Private методы
  // ========================================

  /**
   * Обогащает классы полной информацией об учениках
   */
  private enrichClassesWithStudents(classes: any[], students: any[]) {
    if (!Array.isArray(classes) || !Array.isArray(students) || students.length === 0) {
      return classes;
    }

    // Создаем Map для быстрого поиска учеников
    const studentMap = new Map(
      students.map(student => [student.id, student])
    );

    return classes.map(classData => ({
      ...classData,
      groups: classData.groups?.map((group: any) => ({
        ...group,
        students: group.students?.map((studentId: string) => {
          const studentInfo = studentMap.get(studentId);
          return studentInfo || { id: studentId, name: `Ученик ${studentId}` };
        }) || []
      })) || []
    }));
  }

  /**
   * Обогащает уроки информацией об учениках
   * Преобразует attendance и grades из объектов в массивы students
   */
  private enrichLessonsWithStudentNames(lessons: any[], currentGroup: any) {
    if (!currentGroup?.students) {
      return lessons.map(lesson => ({
        ...lesson,
        students: []
      }));
    }

    return lessons.map(lesson => {
      const students = currentGroup.students.map((student: any) => ({
        id: student.id,
        name: student.name,
        attendance: lesson.attendance?.[student.id] ?? true,
        grade: lesson.grades?.[student.id] ?? null
      }));

      return {
        ...lesson,
        students
      };
    });
  }
}