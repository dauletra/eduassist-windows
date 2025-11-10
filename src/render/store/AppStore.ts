// src/render/store/AppStore.ts

import type { Class, EnrichedLesson, SelectedGroup, Group } from '../types';
import type { DialogContext } from '../services/commands';

/**
 * Состояние всего приложения
 */
export interface AppState {
  // Основные данные
  classes: Class[];
  lessons: EnrichedLesson[];
  loading: boolean;
  error: string | null;

  // Текущий контекст
  currentClassId: string | null;
  currentGroupId: string | null;
  currentLessonId: string | null;

  // Вычисляемые данные (кешируются)
  currentClass: Class | null;
  currentGroup: Group | null; // ИЗМЕНЕНО: убрали undefined
  currentLesson: EnrichedLesson | null;
  groupLessons: EnrichedLesson[];

  // UI состояние
  selectedGroup: SelectedGroup | null;
  voiceState: {
    isActive: boolean;
    lastCommand: string | null;
    isProcessing: boolean;
  };
}

/**
 * Централизованный Store приложения
 * Заменяет AppContext + CommandContext
 */
export class AppStore {
  private state: AppState;
  private subscribers: Set<(state: AppState) => void> = new Set();
  private computedCache: WeakMap<AppState, Partial<AppState>> = new WeakMap();

  constructor(initialState?: Partial<AppState>) {
    this.state = this.createInitialState(initialState);
  }

  /**
   * Создать начальное состояние
   */
  private createInitialState(initial?: Partial<AppState>): AppState {
    const baseState: AppState = {
      classes: [],
      lessons: [],
      loading: false,
      error: null,

      currentClassId: null,
      currentGroupId: null,
      currentLessonId: null,

      currentClass: null,
      currentGroup: null, // ИЗМЕНЕНО: только null
      currentLesson: null,
      groupLessons: [],

      selectedGroup: null,
      voiceState: {
        isActive: false,
        lastCommand: null,
        isProcessing: false
      }
    };

    return { ...baseState, ...initial };
  }

  /**
   * Получить текущее состояние
   */
  getState(): AppState {
    return this.computeDerivedState(this.state);
  }

  /**
   * Вычислить производные данные
   */
  private computeDerivedState(state: AppState): AppState {
    // Проверить кеш
    if (this.computedCache.has(state)) {
      const cached = this.computedCache.get(state);
      return { ...state, ...cached };
    }

    const computed: Partial<AppState> = {};

    // Вычислить currentClass
    computed.currentClass = state.classes.find(c => c.id === state.currentClassId) || null;

    // Вычислить currentGroup - явно указываем тип
    computed.currentGroup = computed.currentClass
      ? computed.currentClass.groups.find(g => g.id === state.currentGroupId) || null
      : null;

    // Вычислить currentLesson
    computed.currentLesson = state.lessons.find(l => l.id === state.currentLessonId) || null;

    // Вычислить groupLessons - безопасный подход
    if (state.currentGroupId && computed.currentGroup) {
      computed.groupLessons = state.lessons
        .filter(l => l.groupId === state.currentGroupId)
        .map(lesson => this.enrichLesson(lesson, computed.currentGroup!)); // Используем ! так как проверили выше
    } else {
      computed.groupLessons = [];
    }

    // Вычислить selectedGroup
    if (computed.currentClass && computed.currentGroup) {
      computed.selectedGroup = {
        classId: computed.currentClass.id,
        className: computed.currentClass.name,
        groupId: computed.currentGroup.id,
        groupName: computed.currentGroup.name,
      };
    } else {
      computed.selectedGroup = null;
    }

    // Сохранить в кеш
    this.computedCache.set(state, computed);

    return { ...state, ...computed };
  }

  /**
   * Обогатить урок данными учеников
   */
  private enrichLesson(lesson: EnrichedLesson, group: Group | null): EnrichedLesson {
    if (!group) return lesson;

    return {
      ...lesson,
      students: lesson.students.map(lessonStudent => {
        const student = group.students.find(s => s.id === lessonStudent.id);
        return {
          ...lessonStudent,
          name: student?.name || `Ученик ${lessonStudent.id}`
        };
      })
    };
  }

  /**
   * Обновить состояние
   */
  setState(updater: (prevState: AppState) => AppState): void {
    const newState = updater(this.state);

    // Проверить, изменилось ли состояние
    if (newState !== this.state) {
      this.state = newState;
      this.computedCache = new WeakMap(); // Очистить кеш при изменении состояния
      this.notifySubscribers();
    }
  }

  /**
   * Подписаться на изменения состояния
   */
  subscribe(listener: (state: AppState) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  /**
   * Уведомить подписчиков
   */
  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in store subscriber:', error);
      }
    });
  }

  /**
   * Получить DialogContext для команд
   */
  getDialogContext(): DialogContext {
    const state = this.getState();
    return {
      classId: state.currentClassId || undefined,
      groupId: state.currentGroupId || undefined,
      lessonId: state.currentLessonId || undefined,
      currentLesson: state.currentLesson,
      hasConflict: state.currentGroup?.conflicts
        ? (id1: string, id2: string) =>
          state.currentGroup!.conflicts!.some(conflict =>
            conflict.students.includes(id1) && conflict.students.includes(id2)
          )
        : undefined
    };
  }

  /**
   * Восстановить из JSON (для дебага)
   */
  static fromJSON(json: string): AppStore {
    const state = JSON.parse(json);
    return new AppStore(state);
  }

  /**
   * Экспорт в JSON (для дебага)
   */
  toJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }
}