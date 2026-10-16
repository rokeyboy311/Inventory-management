import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isInstallable, isIOS, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running inside installed standalone PWA
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px]">Installed App</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-amber-300/60 animate-pulse"
        title="Install app on Android, iPhone, or Desktop Chrome"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
        {(isAndroid || isIOS) && (
          <Smartphone className="w-3.5 h-3.5 opacity-80" />
        )}
      </button>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
