import React from 'react';
import { FolderDown, Image as ImageIcon, Loader2, Square } from 'lucide-react';
import { TranslationStrings } from '../i18n';

interface StoryboardToolbarProps {
  title: string;
  artStyle: string;
  onArtStyleChange: (value: string) => void;
  t: TranslationStrings;
  hasAnyImages: boolean;
  isZipping: boolean;
  onDownloadAll: () => void;
  isGeneratingImages: boolean;
  onStopImages: () => void;
  onGenerateAllImages: () => void;
}

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  title,
  artStyle,
  onArtStyleChange,
  t,
  hasAnyImages,
  isZipping,
  onDownloadAll,
  isGeneratingImages,
  onStopImages,
  onGenerateAllImages,
}) => {
  return (
    <div className="sticky top-20 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-xl md:border md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-purple-400 font-medium text-xs uppercase tracking-wider">{t.styleLabel}</span>
          <input
            type="text"
            value={artStyle}
            onChange={(e) => onArtStyleChange(e.target.value)}
            className="bg-transparent border-b border-slate-800 hover:border-slate-600 focus:border-purple-500 text-slate-300 text-sm w-full md:w-[400px] focus:outline-none transition-colors placeholder:text-slate-700"
            placeholder={t.stylePlaceholder}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasAnyImages && (
          <button
            onClick={onDownloadAll}
            disabled={isZipping}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
            {t.downloadZip}
          </button>
        )}

        {isGeneratingImages ? (
          <button
            onClick={onStopImages}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            {t.stopAll}
          </button>
        ) : (
          <button
            onClick={onGenerateAllImages}
            className="bg-white text-slate-950 hover:bg-purple-50 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/10 transition-all hover:scale-105"
          >
            <ImageIcon className="w-4 h-4" />
            {t.generateAllFrames}
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryboardToolbar;
