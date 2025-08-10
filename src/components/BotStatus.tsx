import React from 'react';
import { Circle, Wifi, WifiOff } from 'lucide-react';

interface BotStatusProps {
  isConnected: boolean;
}

const BotStatus: React.FC<BotStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-400" />
            <Circle className="h-2 w-2 text-green-400 fill-current animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Connecté</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-400" />
            <Circle className="h-2 w-2 text-red-400 fill-current" />
            <span className="text-red-400 text-sm font-medium">Déconnecté</span>
          </>
        )}
      </div>
    </div>
  );
};

export default BotStatus;