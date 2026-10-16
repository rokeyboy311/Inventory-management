import React from 'react';
import { AlertCircle, RotateCcw, Trash2, ArrowRight } from 'lucide-react';
import { UnsavedDraftState } from '../utils/storage';

interface DraftRecoveryBannerProps {
  draft: UnsavedDraftState | null;
  onContinueEditing: () => void;
  onDiscardDraft: () => void;
}

export const DraftRecoveryBanner: React.FC<DraftRecoveryBannerProps> = ({
  draft,
  onContinueEditing,
  onDiscardDraft
}) => {
  if (!draft) return null;

  return (
    <div className="w-full bg-blue-900 text-white px-4 py-2.5 shadow-md border-b border-blue-700 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-blue-300 flex-shrink-0" />
          <div>
            <span className="font-bold">Unsaved Performa Found:</span>{' '}
            <span className="text-blue-200">
              Draft for ID <strong className="text-white font-mono">{draft.performa.id}</strong> in{' '}
              <strong className="text-white">{draft.sheetName}</strong> was preserved.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onContinueEditing}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-blue-900 rounded font-bold text-xs shadow transition-colors"
          >
            <span>Continue Editing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDiscardDraft}
            className="flex items-center space-x-1 px-2.5 py-1 text-blue-200 hover:text-white hover:bg-blue-800 rounded text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
};
