import { type IntentDefinition } from './intents/types';
import { openJournalIntent } from './intents/openJournal';
import { setGradeIntent } from './intents/setGrade';
import { randomStudentIntent } from './intents/randomStudent';
import { divideByGroupSizeIntent, divideByGroupCountIntent } from './intents/divideStudents';

export class IntentRegistry {
  private intents: Map<string, IntentDefinition> = new Map();

  constructor() {
    this.register(openJournalIntent);
    this.register(setGradeIntent);
    this.register(randomStudentIntent);
    this.register(divideByGroupSizeIntent);
    this.register(divideByGroupCountIntent);
  }

  register(intent: IntentDefinition): void {
    this.intents.set(intent.name, intent);
    console.log(`✅ Intent registered: ${intent.name}`);
  }

  get(name: string): IntentDefinition | undefined {
    return this.intents.get(name);
  }

  getAll(): IntentDefinition[] {
    return Array.from(this.intents.values());
  }

  has(name: string): boolean {
    return this.intents.has(name);
  }
}