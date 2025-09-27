// src/electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

// В preload.cjs добавить:
contextBridge.exposeInMainWorld('electronAPI', {
    loadStudentsList: () => ipcRenderer.invoke('load-students-list'),

    // Методы для работы с уроками
    getTodayLesson: (classId, groupId) => ipcRenderer.invoke('get-today-lesson', classId, groupId),
    createLesson: (classId, groupId, topic) => ipcRenderer.invoke('create-lesson', classId, groupId, topic),
    updateAttendance: (lessonId, studentId, attendance) => ipcRenderer.invoke('update-attendance', lessonId, studentId, attendance),
    updateGrade: (lessonId, studentId, grade) => ipcRenderer.invoke('update-grade', lessonId, studentId, grade),

    // Команды учителя
    divideStudents: (classId, groupId, groupCount) => ipcRenderer.invoke('divide-students', classId, groupId, groupCount),
    selectRandomStudent: (classId, groupId) => ipcRenderer.invoke('select-random-student', classId, groupId),
    openPresentation: (name) => ipcRenderer.invoke('open-presentation', name),
    printTasks: () => ipcRenderer.invoke('print-tasks'),
});

// API для голосового ассистента учителя
contextBridge.exposeInMainWorld('voiceAssistant', {
    // Управление голосовым распознаванием
    startListening: () => ipcRenderer.invoke('start-voice-listening'),
    stopListening: () => ipcRenderer.invoke('stop-voice-listening'),

    // Команды для работы с учениками
    divideStudentsIntoGroups: (count) =>
        ipcRenderer.invoke('divide-students', count),
    selectRandomStudent: () =>
        ipcRenderer.invoke('select-random-student'),

    // Оценки и баллы
    setGrade: (studentName, grade) =>
        ipcRenderer.invoke('set-grade', studentName, grade),

    // Презентации и файлы
    openPresentation: (name) =>
        ipcRenderer.invoke('open-presentation', name),
    printTasks: () =>
        ipcRenderer.invoke('print-tasks'),

    // События от main процесса
    onVoiceCommand: (callback) => {
        ipcRenderer.on('voice-command', (event, command) => {
            callback(command);
        });
    },

    onListeningStateChanged: (callback) => {
        ipcRenderer.on('listening-state-changed', (event, isListening) => {
            callback(isListening);
        });
    },

    onStudentSelected: (callback) => {
        ipcRenderer.on('student-selected', (event, student) => {
            callback(student);
        });
    },

    onGroupsDivided: (callback) => {
        ipcRenderer.on('groups-divided', (event, groups) => {
            callback(groups);
        });
    },

    // Удаление слушателей
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
});

// API для анимации и состояния
contextBridge.exposeInMainWorld('appState', {
    // Получение текущего состояния
    getState: () => ipcRenderer.invoke('get-app-state'),

    // Уведомления для UI
    onStateUpdate: (callback) => {
        ipcRenderer.on('state-update', (event, state) => {
            callback(state);
        });
    },

    // Анимации
    onAnimationChange: (callback) => {
        ipcRenderer.on('animation-change', (event, animationType) => {
            callback(animationType);
        });
    },
});

// API для настроек
contextBridge.exposeInMainWorld('settings', {
    // Новые каналы для настроек
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // Управление классами
    loadStudentsList: () => ipcRenderer.invoke('load-students-list'),

    addClassWithGroups: (className, groupNames) => ipcRenderer.invoke('add-class-with-groups', className, groupNames),
    updateClass: (classId, updates) => ipcRenderer.invoke('update-class', classId, updates),
    deleteClass: (classId) => ipcRenderer.invoke('delete-class', classId),

    // Управление группами
    addGroupToClass: (classId, groupName) => ipcRenderer.invoke('add-group-to-class', classId, groupName),

    // Управление учениками
    addStudentToGroup: (classId, groupId, studentName) => ipcRenderer.invoke('add-student-to-group', classId, groupId, studentName),
});

console.log('Voice Assistant Preload Script Loaded');