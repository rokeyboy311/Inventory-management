import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Wrench, 
  Home, 
  User, 
  Wifi, 
  WifiOff, 
  Plus, 
  Check, 
  X, 
  Layers,
  Sparkles
} from 'lucide-react';

interface HeaderControlsProps {
  location: string;
  onLocationChange: (loc: string) => void;
  locationType: 'In house' | 'Maintenance';
  onLocationTypeChange: (type: 'In house' | 'Maintenance') => void;
  submittedBy: string;
  onSubmittedByChange: (name: string) => void;
  isOnline: boolean;
  offlineCount: number;
  availableLocations: string[];
  onAddCustomLocation: (newLoc: string) => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  location,
  onLocationChange,
  locationType,
  onLocationTypeChange,
  submittedBy,
  onSubmittedByChange,
  isOnline,
  offlineCount,
  availableLocations,
  onAddCustomLocation,
}) => {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  const handleSaveLocation = () => {
    if (newLocationInput.trim()) {
      onAddCustomLocation(newLocationInput.trim());
      onLocationChange(newLocationInput.trim());
      setNewLocationInput('');
      setIsAddingLocation(false);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-lg sticky top-0 z-30">
      {/* Top Banner / System Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Site Inventory Management System
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Excel Auto-Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Daily Site Material Entry &amp; Bi-directional Google Sheets / Excel Live Integration
            </p>
          </div>
        </div>

        {/* Live Network & Offline Queue Status */}
        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
            isOnline 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
          }`}>
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-medium">Online (Live Sync)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-medium">Offline Mode</span>
              </>
            )}
          </div>

          {offlineCount > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium flex items-center gap-1 animate-pulse">
              <span>{offlineCount} Queued Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Controls Section matching layout sketch */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* 1. Location Selection Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Location (Site Selection)</span>
                <span className="text-rose-400">*</span>
              </label>
              {!isAddingLocation && (
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Site</span>
                </button>
              )}
            </div>

            {isAddingLocation ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="Enter new site location name..."
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                  className="w-full bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveLocation}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                  title="Save Location"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingLocation(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
                >
                  <option value="" disabled>-- Select Main Site Location --</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            )}
          </div>

          {/* 2. Location Type Selection Dropdown (Exactly 2 options: "In house" & "Maintenance") */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Location Type</span>
              <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLocationTypeChange('In house')}
                className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  locationType === 'In house'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>1st: In house</span>
              </button>

              <button
                type="button"
                onClick={() => onLocationTypeChange('Maintenance')}
                className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  locationType === 'Maintenance'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>2nd: Maintenance</span>
              </button>
            </div>
          </div>

          {/* 3. Submitted By / Engineer Information */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Submitted By (Engineer / Tech)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Engineer or Supervisor Name..."
                value={submittedBy}
                onChange={(e) => onSubmittedByChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
