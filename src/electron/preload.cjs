// src/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

// Главный API для приложения
contextBridge.exposeInMainWorld('electronAPI', {
    // Методы для работы с уроками
    loadStudentsList: () => ipcRenderer.invoke('load-students-list'),
    getTodayLesson: (classId, groupId) => ipcRenderer.invoke('get-today-lesson', classId, groupId),
    getAllLessons: (classId, groupId) => ipcRenderer.invoke('get-all-lessons', classId, groupId),
    createLesson: (classId, groupId, topic) => ipcRenderer.invoke('create-lesson', classId, groupId, topic),
    updateAttendance: (lessonId, studentId, attendance) => ipcRenderer.invoke('update-attendance', lessonId, studentId, attendance),
    updateGrade: (lessonId, studentId, grade) => ipcRenderer.invoke('update-grade', lessonId, studentId, grade),

    // Команды учителя
    divideStudents: (classId, groupId, groupCount) => ipcRenderer.invoke('divide-students', classId, groupId, groupCount),
    selectRandomStudent: (classId, groupId) => ipcRenderer.invoke('select-random-student', classId, groupId),
    openPresentation: (name) => ipcRenderer.invoke('open-presentation', name),
    printTasks: () => ipcRenderer.invoke('print-tasks'),

    // Настройки - ИСПРАВЛЕНО!
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),  // ✅ Добавлен параметр settings

    // Управление классами
    addClassWithGroups: (className, groupNames) => ipcRenderer.invoke('add-class-with-groups', className, groupNames),
    updateClass: (classId, updates) => ipcRenderer.invoke('update-class', classId, updates),
    deleteClass: (classId) => ipcRenderer.invoke('delete-class', classId),

    // Поурочные планы
    selectLessonPlansFolder: () => ipcRenderer.invoke('select-lesson-plans-folder'),
    saveLessonPlansPath: (path) => ipcRenderer.invoke('save-lesson-plans-path', path),
    getLessonPlansPath: () => ipcRenderer.invoke('get-lesson-plans-path'),
    scanLessonPlans: (basePath) => ipcRenderer.invoke('scan-lesson-plans', basePath),
    getCurrentClass: () => ipcRenderer.invoke('get-current-class'),
    getLessonFiles: (lessonPath) => ipcRenderer.invoke('get-lesson-files', lessonPath),

    // Управление группами
    addGroupToClass: (classId, groupName) => ipcRenderer.invoke('add-group-to-class', classId, groupName),

    // Управление учениками
    addStudentToGroup: (classId, groupId, studentName) => ipcRenderer.invoke('add-student-to-group', classId, groupId, studentName),

    // Управление окнами
    openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),

    // Коммуникация между окнами
    notifyMainWindow: (channel) => ipcRenderer.send('notify-main-window', channel),
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', callback),
    removeSettingsUpdatedListener: () => ipcRenderer.removeAllListeners('settings-updated'),

    // Голосовой ассистент
    startVoiceListening: () => ipcRenderer.invoke('start-voice-listening'),
    stopVoiceListening: () => ipcRenderer.invoke('stop-voice-listening'),
    onVoiceCommand: (callback) => ipcRenderer.on('voice-command', (_event, cmd) => callback(cmd)),
    onListeningStateChanged: (callback) => ipcRenderer.on('listening-state-changed', (_event, state) => callback(state)),
});

console.log('✅ Preload Script Loaded');