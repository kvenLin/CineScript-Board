import React from 'react';
import { Loader2, Sparkles, Square, Wand2 } from 'lucide-react';
import { TranslationStrings } from '../i18n';
import { ImageResolution } from '../types';

interface PromptComposerProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  t: TranslationStrings;
  isEnhancingPrompt: boolean;
  onEnhancePrompt: () => void;
  isGeneratingScript: boolean;
  onGenerateScript: () => void;
  onStopScript: () => void;
  resolution: ImageResolution;
  onResolutionChange: (res: ImageResolution) => void;
}

const PromptComposer: React.FC<PromptComposerProps> = ({
  prompt,
  onPromptChange,
  t,
  isEnhancingPrompt,
  onEnhancePrompt,
  isGeneratingScript,
  onGenerateScript,
  onStopScript,
  resolution,
  onResolutionChange,
}) => {
  const isPromptEmpty = !prompt.trim();

  return (
    <section className="max-w-4xl mx-auto w-full space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          {t.heroTitle} <span className="text-purple-400">{t.heroTitleHighlight}</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">{t.heroDesc}</p>
      </div>

      <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={t.storyPlaceholder}
            className="w-full bg-slate-950 text-white placeholder-slate-600 rounded-xl p-6 min-h-[160px] resize-none focus:outline-none text-lg leading-relaxed"
          />

          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <button
              onClick={onEnhancePrompt}
              disabled={isEnhancingPrompt || isGeneratingScript || isPromptEmpty}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-purple-400 rounded-lg transition-colors border border-slate-800 hover:border-purple-500/30"
              title="AI Enhance Prompt"
            >
              {isEnhancingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </button>

            <div className="w-px h-8 bg-slate-800 mx-1"></div>

            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
              {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => onResolutionChange(res)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    resolution === res ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>

            {isGeneratingScript ? (
              <button
                onClick={onStopScript}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                {t.stop}
              </button>
            ) : (
              <button
                onClick={onGenerateScript}
                disabled={isPromptEmpty || isEnhancingPrompt}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                {t.generate}
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default PromptComposer;
