import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  X, 
  Camera, 
  Download, 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Zap, 
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface EngineerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstallModal: () => void;
  totalPerformasCount: number;
  currentLocationName: string;
}

export const EngineerProfileModal: React.FC<EngineerProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenInstallModal,
  totalPerformasCount,
  currentLocationName
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Custom avatar photo from localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('performa_engineer_photo_v1') || null;
  });

  const [engineerName, setEngineerName] = useState<string>(() => {
    return localStorage.getItem('performa_engineer_name_v1') || 'Dk';
  });

  const [engineerRole, setEngineerRole] = useState<string>(() => {
    return localStorage.getItem('performa_engineer_role_v1') || 'Senior Transformer Maintenance Engineer';
  });

  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setProfilePhoto(base64);
        localStorage.setItem('performa_engineer_photo_v1', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    setProfilePhoto(null);
    localStorage.removeItem('performa_engineer_photo_v1');
  };

  const handleSaveProfileInfo = () => {
    localStorage.setItem('performa_engineer_name_v1', engineerName);
    localStorage.setItem('performa_engineer_role_v1', engineerRole);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Banner with Electric Theme */}
        <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 pb-16 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 font-mono">
              Field Engineer Profile
            </span>
          </div>
          <h2 className="text-xl font-black mt-1 tracking-tight">Transformer Maintenance Division</h2>
        </div>

        {/* Profile Avatar Card (Overlapping header) */}
        <div className="relative px-6 -mt-12 flex items-end justify-between">
          <div className="relative group">
            {/* Hidden file input for uploading custom photo */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div 
              onClick={() => photoInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-800 p-1 shadow-xl border-4 border-white cursor-pointer relative overflow-hidden group-hover:scale-105 transition-transform"
            >
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={engineerName} 
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                /* Default Styled Avatar with "Dk" Signature Monogram matching reference photo */
                <div className="w-full h-full rounded-xl bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-blue-500/20 to-transparent"></div>
                  <span className="text-amber-400 font-serif font-black italic text-3xl tracking-wide drop-shadow-md">
                    Dk
                  </span>
                  <span className="text-[9px] text-blue-300 font-mono tracking-widest uppercase mt-0.5">
                    LEAD ENG.
                  </span>
                </div>
              )}

              {/* Camera change overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl text-white text-xs font-bold">
                <Camera className="w-5 h-5" />
              </div>
            </div>

            {profilePhoto && (
              <button
                type="button"
                onClick={handleResetPhoto}
                className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md text-[10px]"
                title="Reset to default Dk avatar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Install App Button in Profile */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInstallModal();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer border border-amber-300"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>

        {/* Profile Info Details */}
        <div className="p-6 space-y-4 text-slate-800">
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Engineer Name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:border-blue-600 outline-none"
                />
                <input
                  type="text"
                  value={engineerRole}
                  onChange={(e) => setEngineerRole(e.target.value)}
                  placeholder="Designation"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-blue-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveProfileInfo}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{engineerName}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{engineerRole}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Edit Info
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Performas Saved</span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                {totalPerformasCount}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Location</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                {currentLocationName || 'Ahmedabad'}
              </div>
            </div>
          </div>

          {/* App Status & PWA info */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
            <div className="flex items-center justify-between font-bold text-blue-950">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>PWA & Offline Ready</span>
              </div>
              <span className="font-mono text-[10px] bg-blue-200 px-1.5 py-0.5 rounded text-blue-900">
                v2.5.0
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              This app can be installed on Android Chrome, iPhone Safari, and Desktop Chrome for lightning-fast full-screen entry at transformer sites.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Photo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
