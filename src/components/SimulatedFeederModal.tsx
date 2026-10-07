import React, { useState, useEffect } from 'react';
import { X, Play, Square, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface SimulatedFeederModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPushSimulatedRow: (row: (string | number | boolean | null)[]) => Promise<void>;
  isStreaming: boolean;
  onToggleStreaming: (intervalMs: number) => void;
}

export const SimulatedFeederModal: React.FC<SimulatedFeederModalProps> = ({
  isOpen,
  onClose,
  onPushSimulatedRow,
  isStreaming,
  onToggleStreaming,
}) => {
  const [streamInterval, setStreamInterval] = useState(3000);
  const [productName, setProductName] = useState('Apple Vision Pro');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState(3499);
  const [qty, setQty] = useState(15);

  if (!isOpen) return null;

  const handleManualPush = async () => {
    const revenue = price * qty;
    const newId = `P${Math.floor(100 + Math.random() * 900)}`;
    const date = new Date().toISOString().split('T')[0];
    const row = [newId, productName, category, price, qty, revenue, 'In Stock', date];
    await onPushSimulatedRow(row);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Data Feed Simulator</h3>
              <p className="text-xs text-slate-400">Push simulated real-time Excel updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Automated Stream Controller */}
          <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-200">Auto Live Stream</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isStreaming ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {isStreaming ? '● STREAMING LIVE' : 'IDLE'}
              </span>
            </div>

            <p className="text-slate-300 text-[11px]">
              Automatically generates and pushes realistic incoming data rows at regular intervals to test real-time synchronization.
            </p>

            <div className="flex items-center space-x-2">
              <select
                value={streamInterval}
                onChange={(e) => setStreamInterval(Number(e.target.value))}
                disabled={isStreaming}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs flex-1"
              >
                <option value={1500}>Every 1.5 seconds</option>
                <option value={3000}>Every 3.0 seconds (Recommended)</option>
                <option value={5000}>Every 5.0 seconds</option>
              </select>

              <button
                onClick={() => onToggleStreaming(streamInterval)}
                className={`px-4 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                  isStreaming 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Stream</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Manual Push Single Row */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-slate-200">Push Single Custom Row:</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Product</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>

            <button
              onClick={handleManualPush}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Push Row to Active Excel Sheet</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
