// src/render/services/domain/JournalService.ts
import { AppStore } from "../../store";
import { ElectronAdapter } from "./ElectronAdapter";

export class JournalService {
  private store: AppStore;
  private api: ElectronAdapter;
  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.store = store;
    this.api = api;
  }

  async openJournal(classNumber: string, classLetter: string, groupNumber: string) {
    const classId = `${classNumber}${(classLetter || '').toLowerCase()}`;
    const groupId = `${classId}-${groupNumber}`;

    const allClasses = await this.api.loadStudentsList();
    console.log("-- All classes", allClasses)

    const targetClass = allClasses.find((c: { id: string; }) => c.id === classId);
    if (!targetClass) {
      return { success: false, message: `Класс ${classId} не найден` };
    }
    const targetGroup = targetClass.groups.find((g: { id: string; }) => g.id === groupId);
    if (!targetGroup) {
      return { success: false, message: `Группа ${groupId} не найдена` };
    }

    let lessons = await this.api.getLessonsByGroup(classId, groupId);
    let todayLesson = await this.api.getTodayLesson(classId, groupId);
    if (!todayLesson) {
      todayLesson = await this.api.createLesson(classId, groupId, "Урок физики. Тема");
      lessons = await this.api.getLessonsByGroup(classId, groupId);
    }

    this.store.setState(prev => ({
      ...prev,
      currentClassId: classId,
      currentGroupId: groupId,
      currentLessonId: todayLesson.id,
      lessons,
      loading: false
    }));

    const displayName = classLetter
      ? `${classNumber}${classLetter} ${groupNumber} группа`
      : `${classNumber} класс ${groupNumber} группа`;

    return { success: true, message: `Журнал ${displayName} открыт` };
  }

  closeJournal() {
    this.store.setState(prev => ({
      ...prev,
      currentClassId: null,
      currentGroupId: null,
      currentLessonId: null,
      lessons: [],
      selectedGroup: null
    }));
    return { success: true, message: "Журнал закрыт" };
  }
}
