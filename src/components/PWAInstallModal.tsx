import React from 'react';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  Apple, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-inner">
              <img src="/icon.svg" alt="App Icon" className="w-10 h-10 rounded-xl" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight">Install Performa App</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-widest">
                  PWA
                </span>
              </div>
              <p className="text-xs text-blue-200">Android • iPhone • Desktop Chrome / Edge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* If already running installed */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-emerald-950">Application Is Already Installed!</div>
              <p className="text-xs text-emerald-800">
                You are currently running the app in standalone mode with offline capabilities.
              </p>
            </div>
          ) : (
            <>
              {/* Direct 1-Click Install Button (When browser supports beforeinstallprompt) */}
              {isInstallable && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-3">
                  <div className="text-xs font-semibold text-blue-900">
                    Ready for 1-Click Fast Installation on this device:
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install App on Device Now</span>
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Works offline • Launches like a native app from Home Screen
                  </p>
                </div>
              )}

              {/* Instructions by Platform */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Installation Guides:
                </div>

                {/* 1. Android Chrome Guide */}
                <div className={`p-3.5 rounded-xl border text-xs ${
                  isAndroid ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Android (Google Chrome):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 text-[11px]">
                    <li>Chrome માં ઉપર જમણી બાજુ <strong>ત્રણ ટપકાં (⋮)</strong> પર ક્લિક કરો.</li>
                    <li><strong>"Install app"</strong> અથવા <strong>"Add to Home screen"</strong> પસંદ કરો.</li>
                    <li><strong>Install</strong> બટન દબાવો. ઍપ તમારા ફોનમાં સેવ થઈ જશે.</li>
                  </ol>
                </div>

                {/* 2. iPhone / iPad (Safari) Guide */}
                <div className={`p-3.5 rounded-xl border text-xs ${
                  isIOS ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                    <Apple className="w-4 h-4 text-slate-800" />
                    <span>iPhone / iPad (Apple Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 text-[11px]">
                    <li>Safari માં નીચે રહેલા <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> <strong>Share</strong> બટન પર ટેપ કરો.</li>
                    <li>નીચે સ્ક્રોલ કરીને <PlusSquare className="w-3.5 h-3.5 inline text-slate-800 mx-0.5" /> <strong>"Add to Home Screen"</strong> પસંદ કરો.</li>
                    <li>ઉપર જમણી બાજુ <strong>"Add"</strong> પર ટેપ કરો.</li>
                  </ol>
                </div>

                {/* 3. Desktop (Chrome / Edge / Windows / Mac) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 mb-2">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>Desktop (PC / Laptop - Chrome / Edge):</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Chrome એડ્રેસ બારમાં જમણી બાજુ રહેલા <Download className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> <strong>Install icon</strong> પર ક્લિક કરો અથવા ત્રણ ટપકાં (⋮) માં જઈને <strong>"Save and share" → "Install Transformer Maintenance Performa"</strong> પસંદ કરો.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Full Screen without URL bar</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Works Offline at field sites</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Instant fast launch</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Data stored safely in device</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
