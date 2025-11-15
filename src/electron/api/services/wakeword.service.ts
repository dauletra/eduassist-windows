// src/electron/api/services/wakeword.service.ts
import { Porcupine } from "@picovoice/porcupine-node";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { app } from "electron";
import path from "path";
import fs from "fs";

let porcupine: Porcupine | null = null;
let recorder: PvRecorder | null = null;
let readingActive = false;

// ✅ ИЗМЕНЕНИЕ: callback вместо BrowserWindow
let wakeWordCallback: (() => void) | null = null;

// Логирование в файл для production
const logFilePath = path.join(app.getPath('downloads'), 'eduassist-windows-files', 'wakeword-debug.log');

function writeLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);

  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

function resolveKeywordPath(): string {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "models")
    : path.join(process.cwd(), "resources", "models");
  return path.join(base, "Ai-Maral_en_windows_v3_0_0.ppn");
}

// ✅ ИЗМЕНЕНИЕ: принимаем callback вместо mainWindow
export async function startWakeWord(onWakeWordDetected: () => void) {
  writeLog('=== START WAKEWORD INITIALIZATION ===');
  writeLog(`🎯 startWakeWord ВЫЗВАН`);

  if (porcupine || recorder) {
    writeLog("⚠️ WakeWord already running");
    return;
  }

  // ✅ Сохраняем callback
  wakeWordCallback = onWakeWordDetected;

  const keywordPath = resolveKeywordPath();
  writeLog(`📁 Resolved keyword path: ${keywordPath}`);

  const fileExists = fs.existsSync(keywordPath);
  writeLog(`🔍 File exists check: ${fileExists}`);

  if (!fileExists) {
    const alternatives = [
      path.join(process.resourcesPath, "Ai-Maral_en_windows_v3_0_0.ppn"),
      path.join(path.dirname(app.getPath('exe')), "resources", "models", "Ai-Maral_en_windows_v3_0_0.ppn"),
      path.join(path.dirname(app.getPath('exe')), "models", "Ai-Maral_en_windows_v3_0_0.ppn"),
      path.join(process.resourcesPath, "app.asar.unpacked", "models", "Ai-Maral_en_windows_v3_0_0.ppn"),
    ];

    writeLog('🔍 Checking alternative paths:');
    let foundPath: string | null = null;

    for (const altPath of alternatives) {
      const exists = fs.existsSync(altPath);
      writeLog(`  ${exists ? '✅' : '❌'} ${altPath}`);
      if (exists && !foundPath) {
        foundPath = altPath;
        writeLog(`✅ Found model at: ${altPath}`);
      }
    }

    const baseDir = path.dirname(keywordPath);
    writeLog(`📂 Listing files in: ${baseDir}`);
    try {
      if (fs.existsSync(baseDir)) {
        const files = fs.readdirSync(baseDir);
        writeLog(`📄 Files (${files.length}): ${files.join(', ')}`);
      } else {
        writeLog(`❌ Base directory does not exist: ${baseDir}`);
        const parentDir = path.dirname(baseDir);
        writeLog(`📂 Checking parent directory: ${parentDir}`);
        if (fs.existsSync(parentDir)) {
          const parentFiles = fs.readdirSync(parentDir);
          writeLog(`📄 Parent files: ${parentFiles.join(', ')}`);
        }
      }
    } catch (err) {
      writeLog(`❌ Error listing directory: ${err}`);
    }

    if (!foundPath) {
      const error = `Wake word file not found: ${keywordPath}`;
      writeLog(`❌ ${error}`);
      throw new Error(error);
    }

    writeLog(`📁 Using alternative path: ${foundPath}`);
    return startWakeWordWithPath(foundPath);
  }

  return startWakeWordWithPath(keywordPath);
}

// ✅ ИЗМЕНЕНИЕ: убрали mainWindow параметр
async function startWakeWordWithPath(keywordPath: string) {
  writeLog(`✅ Keyword file exists: ${keywordPath}`);

  try {
    const stats = fs.statSync(keywordPath);
    writeLog(`📊 File size: ${stats.size} bytes`);
    writeLog(`📊 File permissions: ${stats.mode.toString(8)}`);
  } catch (err) {
    writeLog(`❌ Error reading file stats: ${err}`);
  }

  const apiKey = process.env.PICOVOICE_ACCESS_KEY || "POZ3tE0eQkgUjDsoG/DVqsuoW5j6JfuJjIQPbjM5o1VuKMI/vuYNBg==";
  writeLog(`🔑 API key length: ${apiKey.length}`);

  try {
    writeLog('🔧 Initializing Porcupine...');
    porcupine = new Porcupine(apiKey, [keywordPath], [0.5]);
    writeLog('✅ Porcupine initialized successfully');
  } catch (err) {
    writeLog(`❌ CRITICAL: Porcupine initialization failed: ${err}`);
    throw err;
  }

  try {
    writeLog('🔧 Creating PvRecorder...');
    recorder = new PvRecorder(512, 0);
    writeLog('✅ PvRecorder created');
  } catch (err) {
    writeLog(`❌ PvRecorder creation failed: ${err}`);
    if (porcupine) {
      porcupine.release();
      porcupine = null;
    }
    throw err;
  }

  try {
    writeLog('🔧 Starting PvRecorder...');
    await recorder.start();
    readingActive = true;
    writeLog("🎙️ WakeWord listening started");

    const readLoop = async () => {
      if (!readingActive || !recorder || !porcupine) return;

      try {
        const pcm: Int16Array = await recorder.read();
        const keywordIndex = porcupine.process(pcm);

        if (keywordIndex >= 0) {
          writeLog("🎯 Wake word detected!");
          // ✅ ИЗМЕНЕНИЕ: вызываем callback вместо IPC
          wakeWordCallback?.();
        }
      } catch (err) {
        if (readingActive) {
          writeLog(`❌ PvRecorder read error: ${err}`);
        }
      }

      setImmediate(readLoop);
    };

    setImmediate(readLoop);
  } catch (err) {
    writeLog(`❌ Failed to start PvRecorder: ${err}`);

    if (recorder) {
      await recorder.stop();
      recorder.release();
      recorder = null;
    }

    if (porcupine) {
      porcupine.release();
      porcupine = null;
    }

    readingActive = false;
    throw err;
  }
}

export async function stopWakeWord() {
  writeLog('🛑 stopWakeWord called');
  readingActive = false;
  wakeWordCallback = null; // ✅ Очищаем callback

  if (recorder) {
    try {
      await recorder.stop();
    } catch (err) {
      writeLog(`⚠️ PvRecorder stop warning: ${err}`);
    }
    try {
      recorder.release();
    } catch (err) {
      writeLog(`⚠️ PvRecorder release warning: ${err}`);
    }
    recorder = null;
  }

  if (porcupine) {
    try {
      porcupine.release();
    } catch (err) {
      writeLog(`⚠️ Porcupine release warning: ${err}`);
    }
    porcupine = null;
  }

  writeLog("✅ WakeWord stopped");
}