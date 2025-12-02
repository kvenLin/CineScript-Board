import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  Image as ImageIcon,
  Loader2,
  MousePointer2,
  RefreshCw,
  Trash2,
  UserCheck,
  Wand2,
} from 'lucide-react';
import { Scene, GeneratedImage, ImageResolution, SelectionBox } from '../types';
import { TranslationStrings } from '../i18n';

interface SceneCardProps {
  scene: Scene;
  index: number;
  generatedImage?: GeneratedImage;
  t: TranslationStrings;
  resolution: ImageResolution;
  referenceImages: string[];
  editingSceneIndex: number | null;
  selectionBox: SelectionBox | null;
  isDragging: boolean;
  isEditingImage: boolean;
  editPrompt: string;
  onUpdateScene: (index: number, field: keyof Scene, value: string) => void;
  onDeleteScene: (index: number) => void;
  onGenerateImage: () => void;
  onStartEditing: (index: number) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, index: number) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onSubmitEdit: (index: number, imageUrl: string) => void;
  onEditPromptChange: (value: string) => void;
  imageContainerRef: React.RefObject<HTMLDivElement>;
  onAddGeneratedToReference: (imageUrl: string) => void;
  onDownloadImage: (imageUrl: string, sceneNumber: number, title: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  generatedImage,
  t,
  resolution,
  referenceImages,
  editingSceneIndex,
  selectionBox,
  isDragging,
  isEditingImage,
  editPrompt,
  onUpdateScene,
  onDeleteScene,
  onGenerateImage,
  onStartEditing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onSubmitEdit,
  onEditPromptChange,
  imageContainerRef,
  onAddGeneratedToReference,
  onDownloadImage,
}) => {
  const isEditingThisScene = editingSceneIndex === index;
  const imageUrl = generatedImage?.imageUrl || '';

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[360px]">
        {/* Script Content */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/50 relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => onDeleteScene(index)}
              className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800"
              title={t.deleteScene}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pr-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-950 px-2 py-1 rounded">
              Scene {scene.sceneNumber}
            </span>
            <input
              value={scene.cameraShot}
              onChange={(e) => onUpdateScene(index, 'cameraShot', e.target.value)}
              className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 focus:outline-none focus:border-purple-500 w-32 text-center"
              placeholder={t.shotTypePlaceholder}
            />
          </div>

          <input
            value={scene.title}
            onChange={(e) => onUpdateScene(index, 'title', e.target.value)}
            className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-800 focus:border-purple-500 focus:outline-none transition-all pb-1 w-full"
            placeholder={t.sceneTitlePlaceholder}
          />

          <div className="flex-1">
            <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block tracking-wider">{t.narrativeLabel}</label>
            <textarea
              value={scene.narrativeScript}
              onChange={(e) => onUpdateScene(index, 'narrativeScript', e.target.value)}
              className="w-full bg-slate-950/30 text-slate-300 text-sm p-4 rounded-xl border border-slate-800 focus:border-purple-500 focus:outline-none resize-none min-h-[120px] leading-relaxed italic"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block flex items-center justify-between tracking-wider">
              <span>{t.visualPromptLabel}</span>
              <Edit3 className="w-3 h-3 text-slate-600" />
            </label>
            <textarea
              value={scene.visualPrompt}
              onChange={(e) => onUpdateScene(index, 'visualPrompt', e.target.value)}
              className="w-full bg-slate-800/30 text-slate-400 text-xs p-3 rounded-xl border border-slate-800 focus:border-purple-500 focus:outline-none resize-none min-h-[80px] font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Image Area */}
        <div
          className={`lg:col-span-3 bg-black relative flex items-center justify-center transition-colors select-none overflow-hidden ${
            isEditingThisScene ? 'cursor-crosshair' : ''
          }`}
          ref={isEditingThisScene ? imageContainerRef : null}
          onMouseDown={(e) => onMouseDown(e, index)}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
              <img
                src={imageUrl}
                alt={`Scene ${scene.sceneNumber}`}
                className={`w-full h-full object-contain animate-in fade-in duration-500 ${
                  isEditingImage && isEditingThisScene ? 'opacity-50 blur-sm scale-[0.99] transition-all' : ''
                }`}
              />

              {isEditingThisScene && selectionBox && selectionBox.width > 5 && (
                <div
                  className="absolute border border-white bg-purple-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 backdrop-contrast-125"
                  style={{
                    left: selectionBox.startX,
                    top: selectionBox.startY,
                    width: selectionBox.width,
                    height: selectionBox.height,
                  }}
                >
                  {!isDragging && (
                    <div
                      className="absolute top-full left-0 mt-3 bg-slate-900 border border-slate-700 p-2 rounded-XL shadow-2xl flex gap-2 w-72 z-20 animate-in zoom-in-95 slide-in-from-top-2 duration-200"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={editPrompt}
                        onChange={(e) => onEditPromptChange(e.target.value)}
                        placeholder={t.editPlaceholder}
                        className="flex-1 bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-purple-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSubmitEdit(index, imageUrl);
                        }}
                      />
                      <button
                        onClick={() => onSubmitEdit(index, imageUrl)}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {editingSceneIndex !== index && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    onClick={onGenerateImage}
                    className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.regenerate}
                  </button>

                  <button
                    onClick={() => onStartEditing(index)}
                    data-ignore-outside-click="true"
                    className="bg-blue-600/80 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                  >
                    <MousePointer2 className="w-3.5 h-3.5" />
                    {t.magicEdit}
                  </button>

                  <button
                    onClick={() => onAddGeneratedToReference(imageUrl)}
                    className="bg-purple-600/80 hover:bg-purple-500 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                    title={t.useAsRef}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {t.useAsRef}
                  </button>
                </div>
              )}

              {editingSceneIndex !== index && (
                <button
                  onClick={() => onDownloadImage(imageUrl, scene.sceneNumber, scene.title)}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  title={t.downloadZip}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {isEditingThisScene && !selectionBox && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-4 py-1.5 rounded-full shadow-lg pointer-events-none backdrop-blur animate-in fade-in slide-in-from-top-2">
                  {t.dragToSelect}
                </div>
              )}

              {isEditingImage && isEditingThisScene && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="bg-black/50 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
              {generatedImage?.isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin relative z-10" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">
                    {t.rendering} {resolution} {t.frame}...
                  </span>
                </div>
              ) : generatedImage?.error ? (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-red-500/80" />
                  <span className="text-sm text-red-400">{t.failed}</span>
                  <button
                    onClick={onGenerateImage}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-1.5 rounded-full text-white mt-2 border border-slate-700 transition-colors"
                  >
                    {t.retry}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 group/btn">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner group-hover/btn:border-purple-500/30 transition-colors">
                    <ImageIcon className="w-8 h-8 text-slate-700 group-hover/btn:text-purple-500/50 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={onGenerateImage}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5"
                    >
                      {t.generateFrame}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {referenceImages.includes(imageUrl) && imageUrl && (
            <div className="absolute bottom-4 left-4 bg-green-500/20 border border-green-500/50 text-green-400 px-2 py-1 rounded text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3" /> {t.savedRef}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
