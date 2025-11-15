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

  async sendMessage(text: string, chatId?: string) {
    const target = chatId || this.store.getState().currentGroupId;
    if (!target) return { success: false, message: "Нет выбранной группы для отправки" };

    // TODO: implement IPC method and call it here
    // const result = await this.api.sendTelegramMessage(target, text);
    console.log("Sending message:", text, "to:", target, this.api);
    return { success: true, message: "Сообщение отправлено" };
  }

  async sendFile(filePath: string, chatId?: string) {
    const target = chatId || this.store.getState().currentGroupId;
    if (!target) return { success: false, message: "Нет выбранной группы для отправки" };

    // TODO: implement IPC method and call it here
    // const result = await this.api.sendTelegramFile(target, filePath);
    console.log("Sending file:", filePath, "to:", target);
    return { success: true, message: "Файл отправлен" };
  }
}
