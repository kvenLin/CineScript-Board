import React, { useEffect, useState } from 'react';
import { TranslationStrings } from '../i18n';

interface KeySettingsModalProps {
  isOpen: boolean;
  defaultValue: string;
  t: TranslationStrings;
  onClose: () => void;
  onSave: (key: string) => void;
}

const KeySettingsModal: React.FC<KeySettingsModalProps> = ({ isOpen, defaultValue, t, onClose, onSave }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-2">{t.keySettingsTitle}</h3>
        <p className="text-xs text-slate-400 mb-4">{t.keySettingsDesc}</p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.enterKeyPlaceholder}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            {t.saveKey}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeySettingsModal;
