import React from 'react';
import { Clapperboard, Globe, Settings } from 'lucide-react';
import { TranslationStrings, SupportedLanguage } from '../i18n';

interface AppHeaderProps {
  t: TranslationStrings;
  referenceImages: string[];
  onOpenKeyModal: () => void;
  onToggleLanguage: () => void;
  language: SupportedLanguage;
}

const AppHeader: React.FC<AppHeaderProps> = ({ t, referenceImages, onOpenKeyModal, onToggleLanguage, language }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 supports-[backdrop-filter]:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg shadow-lg shadow-purple-900/20">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CineScript <span className="text-purple-400 font-light">& Board</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {referenceImages.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/50 border border-purple-500/30 pl-3 pr-4 py-1.5 rounded-full backdrop-blur-sm">
              <div className="flex -space-x-2">
                {referenceImages.slice(0, 3).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Ref"
                    className="w-6 h-6 rounded-full object-cover border-2 border-slate-900 ring-1 ring-purple-500/50"
                  />
                ))}
                {referenceImages.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border-2 border-slate-900">
                    +{referenceImages.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-purple-200">{t.activeRefs}</span>
            </div>
          )}

          <div className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono hidden sm:block">
            gemini-3-pro
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKeyModal}
              className="p-2 text-slate-400 hover:text-purple-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all active:scale-95"
              title="API Key Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleLanguage}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all active:scale-95 flex items-center gap-2"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase w-4">{language}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
