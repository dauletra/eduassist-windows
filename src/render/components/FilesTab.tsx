// src/render/components/FilesTab.tsx

import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { Folder, FileText, Presentation, File, Link as LinkIcon, Video, Loader2, Send } from "lucide-react";
import { useAppState, useCommandDispatcher } from '../contexts/StoreContext';
import type { FileItem } from "../types";
import { Toast } from "./Toast.tsx";

const extLower = (f?: FileItem) => (f?.extension || "").toLowerCase();

const getFileIcon = (file: FileItem) => {
  const ext = extLower(file);
  if (ext === ".pptx" || ext === ".ppt") return <Presentation size={20} className="text-orange-600" />;
  if (ext === ".mp4" || ext === ".avi" || ext === ".mov") return <Video size={20} className="text-red-600" />;
  if (ext === ".docx" || ext === ".doc") return <FileText size={20} className="text-blue-600" />;
  if (ext === ".pdf") return <FileText size={20} className="text-indigo-600" />;
  if (ext === ".url") return <LinkIcon size={20} className="text-purple-600" />;
  return <File size={20} className="text-gray-600" />;
};

interface FilesTabProps {}

const FilesTab = (_props: FilesTabProps) => {
  const [presentationsPath, setPresentationsPath] = useState<string>("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [printingFileId, setPrintingFileId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [sendingFile, setSendingFile] = useState<string | null>(null);
  const state = useAppState();

  const handleSendToTelegram = async (filePath: string, fileName: string) => {
    const { currentLesson } = state;

    if (!currentLesson) {
      setToast({ message: 'Алдымен журналды ашыңыз', type: 'error' });
      return;
    }

    try {
      setSendingFile(filePath);

      // Проверка: это .url файл?
      const isUrlFile = filePath.toLowerCase().endsWith('.url');

      if (isUrlFile) {
        // Читаем содержимое .url файла
        const urlContent = await window.electronAPI.readUrlFileContent(filePath);

        // Отправляем как ссылку
        const result = await window.electronAPI.sendTelegramMaterial({
          lesson_id: currentLesson.id,
          url: urlContent,
          caption: `Материалы урока: ${currentLesson.topic}`
        });

        if (result.success) {
          setToast({
            message: `✅ Сілтеме ${result.sent_count} оқушыға жіберілді`,
            type: 'success'
          });
        }
      } else {
        // Отправляем как файл
        const result = await window.electronAPI.sendTelegramMaterial({
          lesson_id: currentLesson.id,
          file_path: filePath,
          caption: `${currentLesson.topic} сабағы бойынша материал`
        });

        if (result.success) {
          setToast({
            message: `✅ Файл ${result.sent_count} оқушыға жіберілді`,
            type: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Telegram файл жіберу қатесі:', error);
      setToast({
        message: 'Файл жіберілмеді. Телеграм қызметіне қосылмаған секілді.',
        type: 'error'
      });
    } finally {
      setSendingFile(null);
    }
  };

  // Инициализация: получить путь (из настроек или fallback) и загрузить файлы
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // 1) Попытка получить путь через новый IPC getPresentationsPath (реализовать в main)
        // Ожидаем, что метод вернёт строку пути (настройки.paths.presentationsDir || дефолт)
        let basePath: string | null = null;
        try {
          basePath = await window.electronAPI.getPresentationsPath();
        } catch (err) {
          console.warn("getPresentationsPath failed, trying settings/getResourcesPath fallback", err);
        }

        // 2) Если не вернулся путь, попробуем получить из settings (loadSettings), и если там нет - fallback через getResourcesPath
        if (!basePath) {
          try {
            const settings = await window.electronAPI.loadSettings();
            basePath = settings?.paths?.presentationsDir || null;
          } catch {
            // ignore
          }
        }

        if (!basePath) {
          try {
            // предполагаем, что getResourcesPath возвращает корневой resources; main должен вернуть корректный путь
            basePath = await window.electronAPI.getResourcesPath();
          } catch {
            basePath = "";
          }
        }

        setPresentationsPath(basePath || "");

        // 3) Получаем список файлов (getLessonFiles универсален)
        if (basePath) {
          try {
            const list = await window.electronAPI.getLessonFiles(basePath);
            // ensure array, filter out directories if we only need files
            const onlyFiles = Array.isArray(list) ? list : [];
            setFiles(onlyFiles);
          } catch (err) {
            console.error("Ошибка получения списка файлов презентаций:", err);
            setFiles([]);
          }
        } else {
          setFiles([]);
        }
      } catch (err) {
        console.error("Init error:", err);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Позволяет пользователю выбрать другую папку презентаций
  const handleSelectFolder = async () => {
    try {
      // используем существующий селектор папки (selectLessonPlansFolder), можно заменить на selectPresentationsFolder в preload/main
      const path = await window.electronAPI.selectLessonPlansFolder();
      if (path) {
        setPresentationsPath(path);
        // Сохраняем в настройках paths.presentationsDir
        try {
          await window.electronAPI.saveSettings({ paths: { presentationsDir: path } });
        } catch (err) {
          console.warn("Не удалось сохранить путь в настройках:", err);
        }

        setLoading(true);
        try {
          const list = await window.electronAPI.getLessonFiles(path);
          setFiles(Array.isArray(list) ? list : []);
        } catch (err) {
          console.error("Ошибка получения файлов после выбора папки:", err);
          setFiles([]);
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Ошибка выбора папки:", err);
    }
  };

  // Категоризация файлов
  const presentations = useMemo(
    () => files.filter((f) => [".pptx", ".ppt"].includes(extLower(f))),
    [files]
  );
  const videos = useMemo(
    () => files.filter((f) => [".mp4", ".avi", ".mov"].includes(extLower(f))),
    [files]
  );
  const tasksPdf = useMemo(() => files.filter((f) => extLower(f) === ".pdf"), [files]);
  const documents = useMemo(
    () => files.filter((f) => [".docx", ".doc"].includes(extLower(f))),
    [files]
  );
  const links = useMemo(() => files.filter((f) => extLower(f) === ".url"), [files]);

  // Обработчики открытия/печати
  const openGenericFile = async (file: FileItem) => {
    try {
      await window.electronAPI.openFile(file.path);
    } catch (err) {
      console.error("Ошибка открытия файла:", err);
      setToast({ message: "Ошибка открытия файла", type: "error" });
    }
  };

  const printPdf = async (file: FileItem) => {
    try {
      setPrintingFileId(file.path);
      setToast({ message: `Печать "${file.name}"...`, type: "info" });
      await window.electronAPI.printFile(file.path);
      setToast({ message: `Файл "${file.name}" отправлен на печать`, type: "success" });
    } catch (error: any) {
      console.error("Ошибка печати:", error);
      let msg = error?.message || "Ошибка печати";
      msg = msg.replace(/^Error invoking remote method '[^']+': Error:\s*/i, "").replace(/^Error:\s*/i, "");
      setToast({ message: msg, type: "error" });
    } finally {
      setPrintingFileId(null);
    }
  };

  // Для .url используем отдельный IPC openUrlFile, который парсит строку URL= и вызывает shell.openExternal
  const openUrlFile = async (file: FileItem) => {
    try {
      await window.electronAPI.openUrlFile(file.path);
    } catch (err) {
      console.error("Ошибка открытия .url файла:", err);
      setToast({ message: "Не удалось открыть ссылку", type: "error" });
    }
  };

  // Универсальный компонент строки с номером (№)
  const ItemRow = ({
                     file,
                     index,
                     onOpen,
                     rightNode,
                   }: {
    file: FileItem;
    index: number;
    onOpen: (f: FileItem) => Promise<void> | void;
    rightNode?: React.ReactNode;
  }) => {
    return (
      <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-all duration-150">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">{getFileIcon(file)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">№ {index + 1}</span>
              <h3 className="font-medium text-sm truncate" title={file.name}>
                {file.name}
              </h3>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onOpen(file)}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                Открыть
              </button>

              {rightNode}

              {/* Кнопка отправки в Telegram */}
              <button
                onClick={() => handleSendToTelegram(file.path, file.name)}
                disabled={sendingFile === file.path}
                className="text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed bg-green-100 text-green-700 hover:bg-green-200"
                title="Отправить в Telegram"
              >
                {sendingFile === file.path ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Telegram
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Путь к папке презентаций */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Папка презентаций</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={presentationsPath}
            readOnly
            placeholder="Путь к папке с презентациями"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={handleSelectFolder}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Folder size={18} />
            Выбрать
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">Загрузка файлов...</div>
      ) : (
        <>
          {/* Презентации */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Презентации</label>
            {presentations.length === 0 ? (
              <div className="text-xs text-gray-400">Нет презентаций</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presentations.map((f, i) => (
                  <ItemRow key={f.path} file={f} index={i} onOpen={openGenericFile} />
                ))}
              </div>
            )}
          </div>

          {/* Видео */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Видео</label>
            {videos.length === 0 ? (
              <div className="text-xs text-gray-400">Нет видео</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {videos.map((f, i) => (
                  <ItemRow key={f.path} file={f} index={i} onOpen={openGenericFile} />
                ))}
              </div>
            )}
          </div>

          {/* Задания (PDF) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Задания (PDF)</label>
            {tasksPdf.length === 0 ? (
              <div className="text-xs text-gray-400">Нет PDF заданий</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasksPdf.map((f, i) => (
                  <ItemRow
                    key={f.path}
                    file={f}
                    index={i}
                    onOpen={openGenericFile}
                    rightNode={
                      <button
                        onClick={() => printPdf(f)}
                        disabled={printingFileId === f.path}
                        className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                          printingFileId === f.path
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {printingFileId === f.path ? "Печать..." : "Печать"}
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Документы */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Документы</label>
            {documents.length === 0 ? (
              <div className="text-xs text-gray-400">Нет документов</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((f, i) => (
                  <ItemRow key={f.path} file={f} index={i} onOpen={openGenericFile} />
                ))}
              </div>
            )}
          </div>

          {/* Ссылки */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ссылки</label>
            {links.length === 0 ? (
              <div className="text-xs text-gray-400">Нет ссылок</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {links.map((f, i) => (
                  <ItemRow key={f.path} file={f} index={i} onOpen={openUrlFile} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default FilesTab;
