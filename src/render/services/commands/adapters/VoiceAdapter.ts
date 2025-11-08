import { commandExecutor } from '../CommandExecutor';
import type { CommandContext } from '../../dialog/DialogState';
import type { EnrichedLesson } from '../../../types';
import type { CommandResult } from '../types';

export class VoiceAdapter {
  async executeVoiceCommand(
    intentName: string,
    slots: Record<string, any>,
    context: CommandContext,
    currentLesson: EnrichedLesson | null
  ): Promise<CommandResult> {
    console.log('🎙️ VoiceAdapter: executing', intentName);

    // Просто делегируем в CommandExecutor с source: 'voice'
    return commandExecutor.execute(
      intentName,
      slots,
      'voice',
      context,
      currentLesson
    );
  }
}

export const voiceAdapter = new VoiceAdapter();