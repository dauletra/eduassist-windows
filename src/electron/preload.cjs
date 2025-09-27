// src/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

// Главный API для приложения
contextBridge.exposeInMainWorld('electronAPI', {
    // Методы для работы с уроками
    loadStudentsList: () => ipcRenderer.invoke('load-students-list'),
    getTodayLesson: (classId, groupId) => ipcRenderer.invoke('get-today-lesson', classId, groupId),
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
});

// API для голосового ассистента (оставляем для совместимости)
contextBridge.exposeInMainWorld('voiceAssistant', {
    startListening: () => ipcRenderer.invoke('start-voice-listening'),
    stopListening: () => ipcRenderer.invoke('stop-voice-listening'),
    divideStudentsIntoGroups: (count) => ipcRenderer.invoke('divide-students', count),
    selectRandomStudent: () => ipcRenderer.invoke('select-random-student'),
    setGrade: (studentName, grade) => ipcRenderer.invoke('set-grade', studentName, grade),
    openPresentation: (name) => ipcRenderer.invoke('open-presentation', name),
    printTasks: () => ipcRenderer.invoke('print-tasks'),
    onVoiceCommand: (callback) => ipcRenderer.on('voice-command', (_event, command) => callback(command)),
    onListeningStateChanged: (callback) => ipcRenderer.on('listening-state-changed', (_event, isListening) => callback(isListening)),
    onStudentSelected: (callback) => ipcRenderer.on('student-selected', (_event, student) => callback(student)),
    onGroupsDivided: (callback) => ipcRenderer.on('groups-divided', (_event, groups) => callback(groups)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// API для состояния приложения
contextBridge.exposeInMainWorld('appState', {
    getState: () => ipcRenderer.invoke('get-app-state'),
    onStateUpdate: (callback) => ipcRenderer.on('state-update', (_event, state) => callback(state)),
    onAnimationChange: (callback) => ipcRenderer.on('animation-change', (_event, animationType) => callback(animationType)),
});

console.log('✅ Preload Script Loaded');