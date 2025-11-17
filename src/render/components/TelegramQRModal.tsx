// src/render/components/TelegramQRModal.tsx

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import type { Student } from '../../electron/shared-types';

interface TelegramQRModalProps {
  student: Student;
  onClose: () => void;
}

export function TelegramQRModal({ student, onClose }: TelegramQRModalProps) {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadQRCode();
  }, [student.id]);

  async function loadQRCode() {
    try {
      setLoading(true);
      setError('');

      // Получить токен от Electron
      const data = await window.electronAPI.getTelegramQRToken(student.id);

      // Сгенерировать QR-код
      const qrDataURL = await QRCode.toDataURL(data.qr_url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrDataURL(qrDataURL);
    } catch (err) {
      console.error('Ошибка загрузки QR:', err);
      setError('Не удалось создать QR-код. Проверьте подключение к Telegram сервису.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Регистрация в Telegram</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-gray-600">Создание QR-кода...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadQRCode}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-gray-700 font-medium mb-1">{student.name}</p>
                <p className="text-sm text-gray-500">Отсканируйте QR-код телефоном</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <img
                  src={qrDataURL}
                  alt="QR Code"
                  className="border-4 border-gray-200 rounded-lg"
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-2">Инструкция:</p>
                <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Откройте камеру на телефоне</li>
                  <li>Наведите на QR-код</li>
                  <li>Нажмите на ссылку Telegram</li>
                  <li>Нажмите "START" в боте</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}