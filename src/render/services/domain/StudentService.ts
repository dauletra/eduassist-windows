// src/render/services/domain/StudentService.ts
import { AppStore } from "../../store";

export class StudentService {
  private store: AppStore;
  constructor(store: AppStore) {
    this.store = store;
  }

  findInCurrentLessonByIdOrName(idOrName: string) {
    const state = this.store.getState();
    if (!state.currentLesson) return null;

    const target = idOrName.trim().toLowerCase();
    let student = state.currentLesson.students.find(s => s.id.toLowerCase() === target);
    if (!student) {
      student = state.currentLesson.students.find(s =>
        s.name.toLowerCase().includes(target)
      );
    }
    return student || null;
  }

  listCurrentLessonStudents() {
    return this.store.getState().currentLesson?.students ?? [];
  }
}
