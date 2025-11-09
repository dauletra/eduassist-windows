// VoiceAdapter.ts
import type { CommandExecutor } from '../CommandExecutor';
import type { CommandResult } from '../types';

export class VoiceAdapter {
  // @ts-ignore
  constructor(private commandExecutor: CommandExecutor) {}

  async executeVoiceCommand(
    intentName: string,
    slots: Record<string, any>
  ): Promise<CommandResult> {
    console.log('🎙️ VoiceAdapter: executing', intentName);

    // CommandExecutor сам получит контекст через callback
    return this.commandExecutor.execute(
      intentName,
      slots,
      'voice'
    );
  }
}
