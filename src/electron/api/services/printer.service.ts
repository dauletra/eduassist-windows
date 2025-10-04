import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PrinterService {
  /**
   * Получить статус принтеров через WMI
   */
  async getPrintersStatus(includeVirtual: boolean = true): Promise<Map<string, boolean>> {
    const printersStatus = new Map<string, boolean>();

    try {
      const command = `Get-WmiObject -Class Win32_Printer | Select-Object Name, PortName, WorkOffline, PrinterState | ConvertTo-Json`;

      const { stdout, stderr } = await execAsync(
        `powershell -NoProfile -NonInteractive -Command "${command}"`,
        {
          encoding: 'utf8',
          timeout: 10000,
          windowsHide: true
        }
      );

      if (stderr) {
        console.warn('⚠️ PowerShell stderr:', stderr);
      }

      if (!stdout || stdout.trim().length === 0) {
        console.warn('⚠️ WMI вернул пустой результат');
        return printersStatus;
      }

      let printers;
      try {
        printers = JSON.parse(stdout);
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON:', parseError);
        return printersStatus;
      }

      const printerArray = Array.isArray(printers) ? printers : [printers];

      printerArray.forEach((printer: any) => {
        if (!printer.Name) return;

        const portName = printer.PortName || '';
        const isVirtual = portName.includes('PORTPROMPT:') ||
          portName.includes('nul:') ||
          portName.includes('SHRFAX:') ||
          portName.includes('Microsoft.Office') ||
          portName.includes('FILE:');

        // Пропускаем виртуальные принтеры если includeVirtual = false
        if (!includeVirtual && isVirtual) {
          return;
        }

        let isAvailable = false;

        if (isVirtual) {
          // Виртуальные принтеры всегда доступны
          isAvailable = true;
        } else {
          // Физические принтеры
          // Главный критерий: WorkOffline
          // WorkOffline === false означает что принтер подключен
          // PrinterState может быть 0 (idle/ready) когда принтер просто ждет
          isAvailable = !printer.WorkOffline;
        }

        printersStatus.set(printer.Name, isAvailable);

  //       console.log(`📟 ${printer.Name}
  // Порт: ${portName}
  // Виртуальный: ${isVirtual}
  // WorkOffline: ${printer.WorkOffline}
  // PrinterState: ${printer.PrinterState}
  // ✅ Доступен: ${isAvailable}`);
      });

    } catch (error: any) {
      console.error('❌ Ошибка WMI:', error.message);
    }

    return printersStatus;
  }
}

export const printerService = new PrinterService();