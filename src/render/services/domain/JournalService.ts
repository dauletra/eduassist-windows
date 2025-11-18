// src/render/services/domain/JournalService.ts
import { AppStore } from "../../store";
import { ElectronAdapter } from "./ElectronAdapter";
import type { FileItem } from '../../types'

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
      return { success: false, message: `${classId} сынып табылмады, қайтадан көріңіз` };
    }
    const targetGroup = targetClass.groups.find((g: { id: string; }) => g.id === groupId);
    if (!targetGroup) {
      return { success: false, message: `${groupId} топ табылмады` };
    }

    let lessons = await this.api.getLessonsByGroup(classId, groupId);
    let todayLesson = await this.api.getTodayLesson(classId, groupId);
    if (!todayLesson) {
      todayLesson = await this.api.createLesson(classId, groupId, "Физика сабағы. Тақырып: Ньютонның екінші заңы");
      lessons = await this.api.getLessonsByGroup(classId, groupId);
    }

    // 🔹 Новый блок: загрузка файлов презентаций
    let lessonFiles: FileItem[] = [];
    try {
      const basePath = await this.api.getPresentationsPath();
      if (basePath) {
        lessonFiles = await this.api.getLessonFiles(basePath);
      }
    } catch (err) {
      console.error("Ошибка загрузки файлов презентаций:", err);
    }

    this.store.setState(prev => ({
      ...prev,
      currentClassId: classId,
      currentGroupId: groupId,
      currentLessonId: todayLesson.id,
      lessons,
      lessonFiles,
      loading: false
    }));

    const displayName = classLetter
      ? `${classNumber}${classLetter} ${groupNumber} топ`
      : `${classNumber} сынып ${groupNumber} топ`;

    return { success: true, message: `${displayName} журналы ашылды` };
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
    return { success: true, message: "Журнал жабылды" };
  }
}
