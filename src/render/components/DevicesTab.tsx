import { useState, useEffect } from "react";
import { Wifi, HardDrive, WifiOff } from 'lucide-react'

type Device = {
  id: number;
  name: string;
  status: "connected" | "ready" | "disconnected";
  type: "board" | "projector" | "printer" | "audio";
}

const DevicesTab = () => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const loadDevices = async () => {
      const mockDevices: Device[] = [
        { id: 1, name: 'Интерактивная доска', status: 'connected', type: 'board' },
        { id: 2, name: 'Проектор', status: 'connected', type: 'projector' },
        { id: 3, name: 'Принтер HP LaserJet', status: 'ready', type: 'printer' },
        { id: 4, name: 'Аудиосистема', status: 'connected', type: 'audio' }
      ];
      setDevices(mockDevices);
    };
    loadDevices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="text-green-600" size={20} />;
      case 'ready': return <HardDrive className="text-blue-600" size={20} />;
      default: return <WifiOff className="text-gray-400" size={20} />;
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Устройства</h2>

      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(device.status)}
              <div>
                <h3 className="font-semibold">{device.name}</h3>
                <p className="text-sm text-gray-600">
                  {device.status === 'connected' ? 'Подключено' :
                  device.status === 'ready' ? 'Готов к работе' : 'Отключено'}
                </p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              device.status === 'connected' || device.status === 'ready' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>
        ))}
      </div>

    </div>
  );

};

export default DevicesTab;