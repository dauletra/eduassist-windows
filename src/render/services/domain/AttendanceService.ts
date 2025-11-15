// src/render/services/domain/AttendanceService.ts
import { AppStore } from "../../store";
import { StudentService } from "./StudentService";
import { ElectronAdapter } from "./ElectronAdapter";

export class AttendanceService {
  private store: AppStore;
  private api: ElectronAdapter;
  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.store = store;
    this.api = api;
  }

  async setAttendance(idOrName: string, attendance: boolean) {
    const state = this.store.getState();
    if (!state.currentLesson) {
      return { success: false, message: "Нет активного урока" };
    }

    const student = new StudentService(this.store).findInCurrentLessonByIdOrName(idOrName);
    if (!student) {
      return { success: false, message: `Ученик "${idOrName}" не найден` };
    }

    const updatedStudents = state.currentLesson.students.map(s =>
      s.id === student.id ? { ...s, attendance } : s
    );
    const updatedLessons = state.lessons.map(lesson =>
      lesson.id === state.currentLessonId ? { ...lesson, students: updatedStudents } : lesson
    );

    this.store.setState(prev => ({
      ...prev,
      lessons: updatedLessons,
      currentLesson: { ...state.currentLesson!, students: updatedStudents }
    }));

    await this.api.updateAttendance(state.currentLessonId!, student.id, attendance);

    const action = attendance ? "присутствует" : "отсутствует";
    return { success: true, message: `Ученик ${student.name} отмечен как ${action}` };
  }
}
