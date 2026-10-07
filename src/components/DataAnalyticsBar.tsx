import React from 'react';
import { SheetData } from '../types/sync';
import { 
  TrendingUp, 
  DollarSign, 
  Hash, 
  CheckCircle2, 
  BarChart3,
  PieChart
} from 'lucide-react';

interface DataAnalyticsBarProps {
  sheet: SheetData;
}

export const DataAnalyticsBar: React.FC<DataAnalyticsBarProps> = ({ sheet }) => {
  if (!sheet || !sheet.rows || sheet.rows.length === 0) return null;

  // Compute numeric summaries across numeric columns
  const numericSummaries: { colName: string; sum: number; avg: number; min: number; max: number; count: number }[] = [];

  sheet.columns.forEach((colName, colIdx) => {
    const nums: number[] = [];
    sheet.rows.forEach(row => {
      const val = row[colIdx];
      if (typeof val === 'number' && !isNaN(val)) {
        nums.push(val);
      } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
        nums.push(Number(val));
      }
    });

    if (nums.length >= Math.max(1, Math.floor(sheet.rows.length * 0.3))) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      numericSummaries.push({
        colName,
        sum: Math.round(sum * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        count: nums.length
      });
    }
  });

  return (
    <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Total Rows:</span>
            <span className="font-bold text-white font-mono">{sheet.rows.length}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Total Columns:</span>
            <span className="font-bold text-white font-mono">{sheet.columns.length}</span>
          </div>

          {numericSummaries.slice(0, 3).map((summary, idx) => (
            <div key={idx} className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
              <span className="text-emerald-400 font-semibold truncate max-w-[120px]">{summary.colName}:</span>
              <span className="text-slate-300">Sum: <strong className="text-white font-mono">{summary.sum.toLocaleString()}</strong></span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Avg: <strong className="text-white font-mono">{summary.avg.toLocaleString()}</strong></span>
            </div>
          ))}
        </div>

        {/* Right Info */}
        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time aggregation engine calculated instantly</span>
        </div>

      </div>
    </div>
  );
};
