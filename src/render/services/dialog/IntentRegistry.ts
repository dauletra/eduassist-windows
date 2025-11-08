import { allCommands } from '../commands';

export class IntentRegistry {
  private intents: Map<string, any> = new Map();

  constructor() {
    // Регистрируем команды как intents для DialogManager
    allCommands.forEach(command => {
      this.register({
        name: command.type,
        displayName: command.displayName,
        requiresContext: command.requiresContext,
        slots: this.convertParamsToSlots(command.params),
        action: async (_slots: any, _context: any, _currentLesson: any) => {
          // Этот action больше не вызывается напрямую
          // DialogManager теперь использует VoiceAdapter
          throw new Error('Action should not be called directly. Use VoiceAdapter instead.');
        }
      });
    });
  }

  private convertParamsToSlots(params: any[]): any[] {
    // Конвертируем CommandParamDefinition в SlotDefinition
    return params.map(param => ({
      name: param.name,
      required: param.required,
      type: param.type,
      entityCategory: param.name === 'studentName' ? 'StudentName' :
        param.name === 'numberValue' ? 'NumberValue' :
          param.name === 'classNumber' ? 'ClassNumber' :
            param.name === 'classLetter' ? 'ClassLetter' :
              param.name === 'groupNumber' ? 'GroupNumber' : undefined,
      prompt: param.description || `Укажите ${param.name}`,
      validate: param.validate,
      transform: param.transform,
      autoFill: param.default ? () => param.default : undefined
    }));
  }

  register(intent: any): void {
    this.intents.set(intent.name, intent);
    console.log(`✅ Intent registered: ${intent.name}`);
  }

  get(name: string): any | undefined {
    return this.intents.get(name);
  }

  getAll(): any[] {
    return Array.from(this.intents.values());
  }

  has(name: string): boolean {
    return this.intents.has(name);
  }
}