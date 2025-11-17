// src/render/services/domain/ElectronAdapter.ts

export class ElectronAdapter {
  async loadStudentsList() { return window.electronAPI.loadStudentsList(); }
  async getAllLessons() { return window.electronAPI.getAllLessons(); }
  async getLessonsByGroup(classId: string, groupId: string) {return window.electronAPI.getLessonsByGroup(classId, groupId); }
  async getTodayLesson(classId: string, groupId: string) { return window.electronAPI.getTodayLesson(classId, groupId); }
  async createLesson(classId: string, groupId: string, topic: string) { return window.electronAPI.createLesson(classId, groupId, topic); }

  async updateGrade(lessonId: string, studentId: string, grade: number | null) {
    return window.electronAPI.updateGrade(lessonId, studentId, grade);
  }
  async updateAttendance(lessonId: string, studentId: string, attendance: boolean) {
    return window.electronAPI.updateAttendance(lessonId, studentId, attendance);
  }

  async divideStudents(classId: string, groupId: string, groupCount: number) {
    return window.electronAPI.divideStudents(classId, groupId, groupCount);
  }
  async selectRandomStudent(classId: string, groupId: string) {
    return window.electronAPI.selectRandomStudent(classId, groupId);
  }

  async getPresentationsPath() { return window.electronAPI.getPresentationsPath(); }
  async getLessonFiles(basePath: string) { return window.electronAPI.getLessonFiles(basePath); }

  async openFile(filePath: string) { return window.electronAPI.openFile(filePath); }
  async openUrlFile(filePath: string) { return window.electronAPI.openUrlFile(filePath); }
  async printFile(filePath: string) { return window.electronAPI.printFile(filePath); }
  async closePresentation() { return window.electronAPI.closePresentation(); }
  async closeVideo() { return window.electronAPI.closeVideo(); }
  async startPresentation(filePath: string) {
    return window.electronAPI.startPresentation(filePath);
  }

  async loadSettings() { return window.electronAPI.loadSettings(); }
  async saveSettings(settings: any) { return window.electronAPI.saveSettings(settings); }
  async openSettingsWindow() { return window.electronAPI.openSettingsWindow(); }
}