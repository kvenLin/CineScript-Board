import React, { useState } from 'react';
import { Film, Globe } from 'lucide-react';
import { SupportedLanguage, TranslationStrings } from '../i18n';

interface KeyGateProps {
  language: SupportedLanguage;
  t: TranslationStrings;
  onToggleLanguage: () => void;
  onSaveKey: (key: string) => void;
  onSkip: () => void;
  initialValue?: string;
}

const KeyGate: React.FC<KeyGateProps> = ({ language, t, onToggleLanguage, onSaveKey, onSkip, initialValue = '' }) => {
  const [keyValue, setKeyValue] = useState(initialValue);

  const handleSave = () => {
    onSaveKey(keyValue);
    setKeyValue('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase font-bold text-xs">{language}</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
          <Film className="w-8 h-8 text-white drop-shadow-md" />
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.manualKeyOnlyTitle}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{t.manualKeyOnlyDesc}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500 mb-2 block">API Key</label>
            <input
              autoFocus
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder={t.enterKeyPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              {t.skipForNow}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              {t.saveKey}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t.needKey}{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors underline decoration-purple-500/30 underline-offset-2"
          >
            {t.getKeyLink}
          </a>
        </p>
      </div>
    </div>
  );
};

export default KeyGate;
