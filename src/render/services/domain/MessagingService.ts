// src/render/services/domain/MessagingService.ts
import { AppStore } from "../../store";
import { ElectronAdapter } from "./ElectronAdapter";

export class MessagingService {
  private store: AppStore;
  private api: ElectronAdapter;

  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.store = store;
    this.api = api;
  }

  /**
   * Отправить файл или ссылку ученикам через Telegram
   * @param filePath - путь к файлу или .url файлу
   */
  async sendFile(filePath: string): Promise<{ success: boolean; message: string }> {
    const state = this.store.getState();
    const { currentLesson } = state;

    // Проверка что урок открыт
    if (!currentLesson) {
      return {
        success: false,
        message: 'Журнал ашылмаған. Алдымен сабақ журналын ашыңыз'
      };
    }

    try {
      // Проверка: это .url файл?
      const isUrlFile = filePath.toLowerCase().endsWith('.url');

      if (isUrlFile) {
        // Читаем содержимое .url файла
        const urlContent = await this.api.readUrlFileContent(filePath);

        // Отправляем как ссылку
        const result = await this.api.sendTelegramMaterial({
          lesson_id: currentLesson.id,
          url: urlContent,
          caption: `Сабақ материалдары: ${currentLesson.topic}`
        });

        if (result.success) {
          return {
            success: true,
            message: `Сілтеме ${result.sent_count} оқушыға жіберілді`
          };
        } else {
          return {
            success: false,
            message: 'Сілтеме жіберілмеді'
          };
        }

      } else {
        // Отправляем как файл
        const result = await this.api.sendTelegramMaterial({
          lesson_id: currentLesson.id,
          file_path: filePath,
          caption: `Сабақ материалдары: ${currentLesson.topic}`
        });

        if (result.success) {
          return {
            success: true,
            message: `Файл ${result.sent_count} оқушыға жіберілді`
          };
        } else {
          return {
            success: false,
            message: 'Файл жіберілмеді'
          };
        }
      }

    } catch (error) {
      console.error('Telegram жіберу қатесі:', error);
      return {
        success: false,
        message: 'Файл жіберілмеді. Telegram қызметі қосылмаған'
      };
    }
  }
}