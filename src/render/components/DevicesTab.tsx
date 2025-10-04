import { useState, useEffect } from "react";
import { Printer, Mic, Volume2, CheckCircle2, XCircle } from 'lucide-react'
import type { Device, DeviceSettings } from '../types'

const DevicesTab = () => {
  const [printers, setPrinters] = useState<Device[]>([]);
  const [audioInputs, setAudioInputs] = useState<Device[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<Device[]>([]);
  const [defaultDevices, setDefaultDevices] = useState<DeviceSettings['devices']>({});

  useEffect(() => {
    loadDevices();
    loadDefaultDevices();
  }, []);

  const loadDefaultDevices = async () => {
    try {
      const settings = await window.electronAPI.loadSettings();
      if (settings?.devices) {
        setDefaultDevices(settings.devices);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек устройств:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const devices = await window.electronAPI.getDevices();
      setPrinters(devices.printers || []);
      setAudioInputs(devices.audioInputs || []);
      setAudioOutputs(devices.audioOutputs || []);
    } catch (error) {
      console.error('Ошибка загрузки устройств:', error);
    }
  };

  const setDefaultDevice = async (
    type: 'defaultPrinter' | 'defaultAudioInput' | 'defaultAudioOutput',
    deviceId: string
  ) => {
    try {
      const updated = {
        devices: {
          ...defaultDevices,
          [type]: deviceId
        }
      };

      await window.electronAPI.saveSettings(updated);
      setDefaultDevices(updated.devices);

      // Обновить список устройств для отображения нового статуса
      await loadDevices();
    } catch (error) {
      console.error('Ошибка установки устройства по умолчанию:', error);
    }
  };

  const DeviceList = ({
                        title,
                        icon: Icon,
                        devices,
                        type,
                        defaultDeviceId
                      }: {
    title: string;
    icon: typeof Printer;
    devices: Device[];
    type: 'defaultPrinter' | 'defaultAudioInput' | 'defaultAudioOutput';
    defaultDeviceId?: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {devices.map((device) => {
          const isDefault = defaultDeviceId === device.id;
          return (
            <div
              key={device.id}
              onClick={() => setDefaultDevice(type, device.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                isDefault
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-sm font-medium truncate ${
                    isDefault ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {device.name}
                  </span>
                  {isDefault && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded flex-shrink-0">
                      По умолчанию
                    </span>
                  )}
                </div>
                {device.isAvailable ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                )}
              </div>
            </div>
          );
        })}
        {devices.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            Устройства не найдены
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Устройства</h2>
        <p className="text-sm text-gray-600">
          Настройте устройства по умолчанию для работы приложения
        </p>
      </div>

      <DeviceList
        title="Принтер"
        icon={Printer}
        devices={printers}
        type="defaultPrinter"
        defaultDeviceId={defaultDevices.defaultPrinter}
      />
      <DeviceList
        title="Аудиовход (микрофон)"
        icon={Mic}
        devices={audioInputs}
        type="defaultAudioInput"
        defaultDeviceId={defaultDevices.defaultAudioInput}
      />
      <DeviceList
        title="Аудиовыход (динамики)"
        icon={Volume2}
        devices={audioOutputs}
        type="defaultAudioOutput"
        defaultDeviceId={defaultDevices.defaultAudioOutput}
      />
    </div>
  );

};

export default DevicesTab;