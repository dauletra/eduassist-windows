// src/render/services/domain/GradeService.ts
import { AppStore } from "../../store";
import { StudentService } from "./StudentService";
import { ElectronAdapter } from "./ElectronAdapter";
// import { validateGrade } from "../../utils/gradeValidation.ts";

export class GradeService {
  private store: AppStore;
  private api: ElectronAdapter;
  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.store = store;
    this.api = api;
  }

  async setGrade(idOrName: string, grade: number | null) {
    const state = this.store.getState();
    if (!state.currentLesson) {
      return { success: false, message: "Нет активного урока" };
    }

    const student = new StudentService(this.store).findInCurrentLessonByIdOrName(idOrName);
    if (!student) {
      return { success: false, message: `Ученик "${idOrName}" не найден` };
    }

    if (grade !== null && (grade < 1 || grade > 10)) {
      return { success: false, message: `Недопустимая оценка: ${grade}. Допустимы оценки от 1 до 10`}
    }

    const updatedStudents = state.currentLesson.students.map(s =>
      s.id === student.id ? { ...s, grade } : s
    );
    const updatedLessons = state.lessons.map(lesson =>
      lesson.id === state.currentLessonId ? { ...lesson, students: updatedStudents } : lesson
    );

    this.store.setState(prev => ({
      ...prev,
      lessons: updatedLessons,
      currentLesson: { ...state.currentLesson!, students: updatedStudents }
    }));

    await this.api.updateGrade(state.currentLessonId!, student.id, grade);

    return { success: true, message: `Оценка ${grade} поставлена ученику ${student.name}` };
  }
}
