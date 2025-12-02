import React from 'react';
import { X, Upload } from 'lucide-react';
import { TranslationStrings } from '../i18n';

interface ReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  referenceImages: string[];
  onRemoveReferenceImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  t: TranslationStrings;
}

const ReferencePanel: React.FC<ReferencePanelProps> = ({
  isOpen,
  onClose,
  referenceImages,
  onRemoveReferenceImage,
  fileInputRef,
  onImageUpload,
  onOpenFilePicker,
  t,
}) => {
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={onImageUpload}
      />

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-5 z-40 animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">{t.referencePanelTitle}</p>
              <h3 className="text-xl font-semibold text-white">{t.refsButton}</h3>
              <p className="text-xs text-slate-400 mt-1">{t.referencePanelDesc}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={onOpenFilePicker}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/60 hover:bg-slate-900 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-semibold">{t.addReferences}</span>
            </button>
            <span className="text-xs text-slate-500">{referenceImages.length}</span>
          </div>

          {referenceImages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-500">
              {t.noReferencesYet}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-32 object-cover" />
                  <button
                    onClick={() => onRemoveReferenceImage(idx)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Remove reference"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ReferencePanel;
