import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { TranslationStrings } from '../i18n';

interface ContinueSectionProps {
  value: string;
  onChange: (value: string) => void;
  isContinuing: boolean;
  onContinue: () => void;
  t: TranslationStrings;
}

const ContinueSection: React.FC<ContinueSectionProps> = ({ value, onChange, isContinuing, onContinue, t }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isContinuing) {
      onContinue();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 border-t border-slate-800 border-dashed rounded-3xl bg-slate-900/20 space-y-4">
      <div className="w-full max-w-2xl px-4 flex gap-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.continuePlaceholder}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-purple-500 focus:outline-none placeholder-slate-600"
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={onContinue}
          disabled={isContinuing}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg whitespace-nowrap"
        >
          {isContinuing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.continuing}
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4" />
              {t.continueScript}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ContinueSection;
