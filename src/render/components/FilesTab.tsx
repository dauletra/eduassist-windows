import {useState, useEffect} from "react";
import { Folder, FileText, Presentation, File, Printer } from 'lucide-react';
import type {ClassFolder, LessonFolder, FileItem, SelectedGroup } from '../types';
import { Toast } from './Toast.tsx'

const getSchoolWeekNumber = (date: Date): number => {
  const year = date.getFullYear();
  // Начало учебного года - 1 сентября текущего или предыдущего года
  const septemberFirst = new Date(year, 8, 1); // месяц 8 = сентябрь (0-based)

  // Если текущая дата до 1 сентября, берем 1 сентября прошлого года
  const schoolYearStart = date < septemberFirst
    ? new Date(year - 1, 8, 1)
    : septemberFirst;

  // Количество миллисекунд с начала учебного года
  const diffTime = date.getTime() - schoolYearStart.getTime();
  // Количество дней
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  // Номер недели (округляем вверх, минимум 1)
  const weekNumber = Math.max(1, Math.ceil((diffDays + 1) / 7));

  return weekNumber;
};

interface FilesTabProps {
  selectedGroup?: SelectedGroup | null;
  selectedLesson: LessonFolder | null;
  onLessonChange: (lesson: LessonFolder | null) => void;
}

const FilesTab = ({ selectedGroup, selectedLesson, onLessonChange }: FilesTabProps) => {
  const [lessonPlansPath, setLessonPlansPath] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassFolder[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [lessonFiles, setLessonFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [printingFileId, setPrintingFileId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Загрузка сохраненного пути при монтировании
  useEffect(() => {
    const loadSavedPath = async () => {
      try {
        const savedPath = await window.electronAPI.getLessonPlansPath();
        if (savedPath) {
          setLessonPlansPath(savedPath);
          await scanLessonPlans(savedPath);
        }
      } catch(error) {
        console.log('Ошибка загрузки пути: ', error);
      }
    };
    loadSavedPath();
  }, []);

  // Автоматический выбор класса при изменении selectedGroup
  useEffect(() => {
    if (selectedGroup && classes.length > 0) {
      const className = selectedGroup.className;
      console.log('🎯 Ищем класс:', className);
      // Нормализуем название: убираем " класс" в конце
      const normalizedClassName = className.replace(/\s*класс\s*$/i, '').trim();
      console.log('🔧 Нормализованное название:', normalizedClassName);

      const matchedClass = classes.find((c: ClassFolder) => {
        const folderName = c.name.trim();
        return folderName === normalizedClassName;
      });
      if (matchedClass) {
        const classChanged = selectedClass !== matchedClass.name;
        setSelectedClass(matchedClass.name);

        if (classChanged && matchedClass.lessons.length > 0) {
          // Определяем текущую неделю
          const currentWeek = getSchoolWeekNumber(new Date());
          console.log('📅 Текущая учебная неделя:', currentWeek);

          // Ищем первый урок текущей недели
          let lessonToSelect = matchedClass.lessons.find(
            lesson => {
              const matches = lesson.week === currentWeek;
              return matches;
            }
          );
          // Если не найден урок текущей недели, ищем ближайшую доступную неделю
          if (!lessonToSelect) {
            console.log('⚠️ Урок для недели', currentWeek, 'не найден');
            lessonToSelect = matchedClass.lessons.find(
              lesson => lesson.week > currentWeek
            );
            // Если не найдена, берем первый доступный урок (самая ранняя неделя)
            if (!lessonToSelect) {
              lessonToSelect = matchedClass.lessons[0];
            }
          }
          onLessonChange(lessonToSelect);
        }
      } else {
        console.log('❌ Класс не найден! Проверьте совпадение названий');
      }
    }
  }, [selectedGroup, classes, onLessonChange, selectedClass]);

  // Загрузка файлов урока при выборе урока
  useEffect(() => {
    const loadLessonFiles = async () => {
      if (!selectedLesson) {
        setLessonFiles([]);
        return;
      }
      try {
        setLoadingFiles(true);
        const files = await window.electronAPI.getLessonFiles(selectedLesson.path);
        setLessonFiles(files);
      } catch(error) {
        console.error('Ошибка загрузки файлов урока: ', error);
        setLessonFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadLessonFiles();
  }, [selectedLesson]);

  // Выбор папки поурочных файлов
  const handleSelectFolder = async () => {
    try {
      const path = await window.electronAPI.selectLessonPlansFolder();
      if (path) {
        setLessonPlansPath(path);
        await window.electronAPI.saveLessonPlansPath(path);
        await scanLessonPlans(path);
      }
    } catch(error) {
      console.error('Ошибка выбора папки: ', error);
    }
  };

  const scanLessonPlans = async (basePath: string) => {
    try {
      const foundClasses = await window.electronAPI.scanLessonPlans(basePath);
      setClasses(foundClasses);

      // Автоматический выбрать класс из настроек
      const currentClass = await window.electronAPI.getCurrentClass();
      if (currentClass) {
        const matchedClass = foundClasses.find((c: ClassFolder) => c.name === currentClass);
        if (matchedClass) {
          setSelectedClass(matchedClass);
          if (matchedClass.lessons.length > 0) {
            onLessonChange(matchedClass.lessons[0]);
          }
        }
      }
    } catch(error) {
      console.error('Ошибка сканирования папки: ', error);
    }
  };

  // Выбор класса
  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    const classData = classes.find(c => c.name === className);
    if (classData && classData.lessons.length > 0) {
      onLessonChange(classData.lessons[0]);
    } else {
      onLessonChange(null);
    }
  };

  // Выбор урока
  const handleSelectLesson = (lesson: LessonFolder) => {
    onLessonChange(lesson);
  };

  // Навигация по урокам
  const currentClassLessons = classes.find(c => c.name === selectedClass)?.lessons || [];

  // Открыть файл
  const handleOpenFile = async (file: FileItem) => {
    console.log('--- open file clicked ---')
    try {
      await window.electronAPI.openFile(file.path);
    } catch (error) {
      console.error('Ошибка открытия файла:', error);
    }
  };

  // Печать файла
  const handlePrintFile = async (file: FileItem) => {
    try {
      setPrintingFileId(file.path);
      setToast({message: `Печать "${file.name}"...`, type: 'info'});

      console.log('Печать файла:', file.path);
      await window.electronAPI.printFile(file.path);

      setToast({ message: `Файл "${file.name}" отправлен на печать`, type: 'success' });
    } catch (error: any) {
      console.error('Ошибка печати файла:', error);

      // Извлекаем человекочитаемое сообщение об ошибке
      let errorMessage = 'Ошибка печати';

      if (error && error.message) {
        errorMessage = error.message;

        // Убираем технический префикс Electron IPC
        // "Error invoking remote method 'print-file': Error: Текст ошибки"
        errorMessage = errorMessage
          .replace(/^Error invoking remote method '[^']+': Error:\s*/i, '')
          .replace(/^Error:\s*/i, '');
      }

      // Убираем технические префиксы если есть
      errorMessage = errorMessage.replace(/^Error:\s*/i, '');

      console.log('Отображаемое сообщение:', errorMessage);

      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setPrintingFileId(null);
    }
  };

  // Получить иконку файла
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder size={20} className="text-yellow-600" />;
    }

    const ext = file.extension?.toLowerCase();
    if (ext === '.pptx' || ext === '.ppt') {
      return <Presentation size={20} className="text-orange-600" />;
    }
    if (ext === '.docx' || ext === '.doc' || ext === '.pdf') {
      return <FileText size={20} className="text-blue-600" />;
    }
    if (ext === '.xlsx' || ext === '.xls') {
      return <FileText size={20} className="text-green-600" />;
    }
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
      return <File size={20} className="text-purple-600" />;
    }
    if (ext === '.mp4' || ext === '.avi' || ext === '.mov') {
      return <File size={20} className="text-red-600" />;
    }

    return <File size={20} className="text-gray-600" />;
  };

  // Форматировать размер файла
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Форматировать название урока для кнопки
  const formatLessonButton = (lesson: LessonFolder) => {
    const weekWord = lesson.name.includes('неделя') ? 'неделя' : 'апта';
    const lessonWord = lesson.name.includes('урок') ? 'урок' : 'сабақ';
    return `${lesson.week} ${weekWord} ${lesson.lessonNumber} ${lessonWord}`;
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Выбор папки поурочных планов */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Папка поурочных планов
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={lessonPlansPath}
            readOnly
            placeholder="Выберите папку с поурочными планами"
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

      {/* Список классов */}
      {classes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Классы</label>
          <div className="flex gap-2 flex-wrap">
            {classes.map((classData) => (
              <button
                key={classData.name}
                onClick={() => handleSelectClass(classData.name)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedClass === classData.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {classData.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Навигация по урокам - кнопки */}
      {selectedClass && currentClassLessons.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Уроки</label>
          <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
            {currentClassLessons.map((lesson) => (
              <button
                key={lesson.path}
                onClick={() => handleSelectLesson(lesson)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLesson?.path === lesson.path
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={lesson.title || lesson.name}
              >
                {formatLessonButton(lesson)}
              </button>
            ))}
          </div>

          {/* Показать название выбранного урока */}
          {selectedLesson && selectedLesson.title && (
            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="font-medium">Тема:</span> {selectedLesson.title}
            </div>
          )}
        </div>
      )}

      {/* Список файлов урока */}
      {selectedLesson && (
        <div className="space-y-2 flex-1 min-h-0">
          <label className="text-sm font-medium text-gray-700">Файлы урока</label>

          {loadingFiles ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              Загрузка файлов...
            </div>
          ) : lessonFiles.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <File size={48} className="mx-auto mb-3 opacity-50" />
                <p>Нет файлов в этом уроке</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pb-36">
              {lessonFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </h3>
                      {file.size && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(file.size)}
                        </p>
                      )}

                      {file.type === 'file' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleOpenFile(file)}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                          >
                            <Presentation size={14} />
                            Открыть
                          </button>

                          {(file.extension === '.pdf') && (
                            <button
                              onClick={() => handlePrintFile(file)}
                              disabled={printingFileId === file.path}
                              className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                                printingFileId === file.path
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {printingFileId === file.path ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                                  Печать...
                                </>
                              ) : (
                                <>
                                  <Printer size={14} />
                                  Печать
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Сообщение если нет данных */}
      {!lessonPlansPath && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Folder size={48} className="mx-auto mb-3 opacity-50" />
            <p>Выберите папку с поурочными планами</p>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FilesTab;