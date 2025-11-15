// src/render/services/domain/FileService.ts
import { ElectronAdapter } from "./ElectronAdapter";

export class FileService {
  private api: ElectronAdapter;
  constructor(api = new ElectronAdapter()) {
    this.api = api;
  }

  async openFile(filePath: string) {
    try { await this.api.openFile(filePath); return { success: true, message: "Файл открыт" }; }
    catch (e) { return { success: false, message: "Ошибка открытия файла" }; }
  }

  async printFile(filePath: string) {
    try { await this.api.printFile(filePath); return { success: true, message: "Файл отправлен на печать" }; }
    catch (e) { return { success: false, message: "Ошибка печати файла" }; }
  }
}
