import {useState, useEffect} from "react";
import { Upload, Play, Printer } from 'lucide-react';

type FileItem = {
  id: number;
  name: string;
  type: "presentation" | "document";
  size: string;
  date: string;
}

const FilesTab = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const loadFiles = async () => {
      const mockFiles: FileItem[] = [
        { id: 1, name: "Первый закон Ньютона.ppts", type: "presentation", size: "3.2 МБ", date: "2025.03.01" },
        { id: 2, name: 'Задачи по физике.pdf', type: 'document', size: '1.8 МБ', date: '2025-02-28' },
        { id: 3, name: 'Контрольная работа.docx', type: 'document', size: '950 КБ', date: '2025-02-27' }
      ];
      setFiles(mockFiles);
    };

    loadFiles();
  }, [])

  const openPresentation = (fileName: string) => {
    // Логика открытия презентации
    console.log(`Открывается: ${fileName}`);
  }

  const printDocument = (fileName: string) => {
    // Логика печати
    console.log(`Печатается: ${fileName}`);
  }

  return (
    <div className="p-6 h-full overflow-y-auto">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Файлы</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
          <Upload size={20} />
          Загрузить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div key={file.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {file.type === 'presentation' ? '📊' : '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{file.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{file.size} • {file.date}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openPresentation(file.name)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"
                    >
                    <Play size={12} />
                    Открыть
                  </button>

                  <button
                    onClick={() => printDocument(file.name)}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"
                    >
                    <Printer size={12} />
                    Печать
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FilesTab;