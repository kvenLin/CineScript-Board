import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, ArrowDown, Images } from 'lucide-react';
import { StoryboardData, GeneratedImage, ImageResolution, Scene, SelectionBox } from './types';
import * as GeminiService from './services/geminiService';
// @ts-ignore
import JSZip from 'jszip';
import { translations, SupportedLanguage } from './i18n';
import KeyGate from './components/KeyGate';
import KeySettingsModal from './components/KeySettingsModal';
import AppHeader from './components/AppHeader';
import PromptComposer from './components/PromptComposer';
import StoryboardToolbar from './components/StoryboardToolbar';
import SceneCard from './components/SceneCard';
import ContinueSection from './components/ContinueSection';
import ReferencePanel from './components/ReferencePanel';

const LOCAL_STORAGE_KEY = 'cinescript_api_key';

const App: React.FC = () => {
  // Detect browser language
  const [language, setLanguage] = useState<SupportedLanguage>(
    navigator.language.startsWith('zh') ? 'zh' : 'en'
  );
  
  const t = translations[language];

  // API Key State
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  
  const [prompt, setPrompt] = useState<string>("");
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  
  // Map of sceneIndex (0-based) -> GeneratedImage data
  // Using Index is safer than sceneNumber because AI might duplicate scene numbers
  const [generatedImages, setGeneratedImages] = useState<Record<number, GeneratedImage>>({});

  // Character Consistency State (Array of base64 strings)
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState<boolean>(false);

  // Edit Mode State (uses scene index)
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  
  // Continue Script State
  const [isContinuingScript, setIsContinuingScript] = useState<boolean>(false);
  const [continuePrompt, setContinuePrompt] = useState<string>("");
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);

  // Refs for cancellation
  const abortScriptRef = useRef<boolean>(false);
  const abortImagesRef = useRef<boolean>(false);

  // Check API Key on mount
  useEffect(() => {
    if (process.env.API_KEY) {
        setApiKeyReady(true);
        return;
    }

    const storedKey = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (storedKey) {
        setCustomApiKey(storedKey);
        setApiKeyReady(true);
    }
  }, []);

  // --- Keyboard & Click Outside Handlers for Edit Mode ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectionBox) {
          setSelectionBox(null);
        } else if (editingSceneIndex !== null) {
          setEditingSceneIndex(null);
          setSelectionBox(null);
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (editingSceneIndex !== null && imageContainerRef.current) {
        const target = e.target as HTMLElement;
        // Check if click is outside the image container
        // AND not on a button intended to toggle the mode (prevent race condition)
        if (!imageContainerRef.current.contains(target) && !target.closest('[data-ignore-outside-click]')) {
           setEditingSceneIndex(null);
           setSelectionBox(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingSceneIndex, selectionBox]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const saveManualKey = (key: string) => {
      if (key.trim()) {
          setCustomApiKey(key.trim());
          if (typeof window !== 'undefined') {
              window.localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
          }
          setApiKeyReady(true);
          setShowKeyModal(false);
      }
  };

  const handleSkipKeySetup = () => {
      setApiKeyReady(true);
      setShowKeyModal(false);
  };

  const handleOpenFilePicker = () => {
      fileInputRef.current?.click();
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
        const enhanced = await GeminiService.enhanceStoryPrompt(prompt, language, customApiKey);
        setPrompt(enhanced);
    } catch (error) {
        console.error("Enhancement failed", error);
        alert(t.enhancementFailed);
    } finally {
        setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;
    
    setIsGeneratingScript(true);
    abortScriptRef.current = false;
    
    setStoryboard(null);
    setGeneratedImages({}); 
    // We DO NOT clear referenceImages here, because the user might have uploaded them for this story.

    try {
      // Pass referenceImages so the script generator can "see" the characters
      const data = await GeminiService.generateScriptAndStoryboard(prompt, referenceImages, language, customApiKey);
      
      if (abortScriptRef.current) {
          console.log("Script generation aborted by user.");
          return;
      }
      
      setStoryboard(data);
    } catch (error) {
      console.error("Script generation failed:", error);
      if (!abortScriptRef.current) {
        alert(t.scriptFailed);
      }
    } finally {
      setIsGeneratingScript(false);
    }
  };
  
  const handleContinueScript = async () => {
      if (!storyboard) return;
      
      setIsContinuingScript(true);
      try {
          const newScenes = await GeminiService.continueScriptAndStoryboard(
              storyboard,
              continuePrompt,
              referenceImages,
              language,
              customApiKey
          );
          
          setStoryboard(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  scenes: [...prev.scenes, ...newScenes]
              };
          });
          
          // Clear prompt after successful continuation
          setContinuePrompt("");
          
      } catch (error) {
          console.error("Failed to continue script:", error);
          alert(t.scriptFailed);
      } finally {
          setIsContinuingScript(false);
      }
  };

  const handleDeleteScene = (indexToDelete: number) => {
      if (!storyboard) return;
      // Optional confirmation could go here
      
      setStoryboard(prev => {
          if (!prev) return null;
          return {
              ...prev,
              scenes: prev.scenes.filter((_, idx) => idx !== indexToDelete)
          };
      });

      // Also clean up generated images state for this index
      setGeneratedImages(prev => {
          const newState: Record<number, GeneratedImage> = {};
          // Shift indices down for subsequent images to keep alignment with the new array
          Object.keys(prev).forEach(keyStr => {
              const key = parseInt(keyStr);
              if (key < indexToDelete) {
                  newState[key] = prev[key];
              } else if (key > indexToDelete) {
                  newState[key - 1] = prev[key];
              }
              // key === indexToDelete is skipped (deleted)
          });
          return newState;
      });
  };

  const handleStopScript = () => {
      abortScriptRef.current = true;
      setIsGeneratingScript(false);
  };

  const handleStopImages = () => {
      abortImagesRef.current = true;
      setIsGeneratingImages(false);
  };

  // --- Reference Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files: File[] = Array.from(e.target.files);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setReferenceImages(prev => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const addGeneratedToReference = (imageUrl: string) => {
      if (!referenceImages.includes(imageUrl)) {
          setReferenceImages(prev => [...prev, imageUrl]);
      }
  };

  const updateSceneData = (index: number, field: keyof Scene, value: string) => {
    if (!storyboard) return;
    const newScenes = [...storyboard.scenes];
    newScenes[index] = { ...newScenes[index], [field]: value };
    setStoryboard({ ...storyboard, scenes: newScenes });
  };

  const generateImageForScene = useCallback(async (index: number, sceneNumber: number, visualPrompt: string, styleGuide: string) => {
    // Set loading state for this specific scene index
    setGeneratedImages(prev => ({
      ...prev,
      [index]: { sceneNumber, imageUrl: "", isLoading: true }
    }));

    try {
      const imageUrl = await GeminiService.generateSceneImage(
          styleGuide, 
          visualPrompt, 
          resolution, 
          referenceImages, // Pass the array of reference images
          customApiKey
      );
      setGeneratedImages(prev => ({
        ...prev,
        [index]: { sceneNumber, imageUrl, isLoading: false }
      }));
    } catch (error) {
      console.error(`Image generation failed for scene ${sceneNumber} (index ${index}):`, error);
      setGeneratedImages(prev => ({
        ...prev,
        [index]: { sceneNumber, imageUrl: "", isLoading: false, error: "Failed to generate" }
      }));
    }
  }, [resolution, referenceImages, customApiKey]);

  const handleGenerateAllImages = async () => {
    if (!storyboard) return;
    
    setIsGeneratingImages(true);
    abortImagesRef.current = false;

    // Sequential generation to be safe and allowing interruption
    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      if (abortImagesRef.current) break;
      
      // Don't regenerate if already exists and not error
      if (generatedImages[i]?.imageUrl && !generatedImages[i]?.error) continue;
      
      await generateImageForScene(i, scene.sceneNumber, scene.visualPrompt, storyboard.artStyle);
    }
    setIsGeneratingImages(false);
  };

  // --- Download Handlers ---
  const handleDownloadImage = (imageUrl: string, sceneNumber: number, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    // Sanitize filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    link.download = `scene_${sceneNumber}_${safeTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (!storyboard || Object.keys(generatedImages).length === 0) return;
    
    setIsZipping(true);
    try {
      const zip = new JSZip();
      let count = 0;

      storyboard.scenes.forEach((scene, index) => {
        const imgData = generatedImages[index] as GeneratedImage | undefined;
        if (imgData && imgData.imageUrl && !imgData.error) {
           const safeTitle = scene.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
           const filename = `scene_${scene.sceneNumber}_${safeTitle}.png`;
           // Remove header to get pure base64
           const base64Content = imgData.imageUrl.split(',')[1];
           zip.file(filename, base64Content, { base64: true });
           count++;
        }
      });

      if (count === 0) {
        alert(t.noImagesToDownload);
        return;
      }

      // Cast to any to avoid TypeScript errors with Blob type mismatch
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content as any);
      link.download = `${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_storyboard.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to zip images", error);
      alert(t.failedToZip);
    } finally {
      setIsZipping(false);
    }
  };


  // --- Image Editing & Box Selection Logic ---

  const startEditing = (index: number) => {
    if (editingSceneIndex === index) {
        setEditingSceneIndex(null);
        setSelectionBox(null);
    } else {
        setEditingSceneIndex(index);
        setSelectionBox(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (editingSceneIndex !== index) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    dragStartRef.current = { x, y };
    setIsDragging(true);
    setSelectionBox({ startX: x, startY: y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const x = Math.min(currentX, startX);
    const y = Math.min(currentY, startY);
    
    setSelectionBox({ startX: x, startY: y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const submitEdit = async (index: number, originalImageUrl: string) => {
      if (!editPrompt.trim() || !selectionBox) return;

      setIsEditingImage(true);
      
      try {
          // Construct an instruction that helps the model understand the intent based on the "selection"
          const instruction = `${editPrompt}`; 
          
          const newImageUrl = await GeminiService.editSceneImage(
              originalImageUrl,
              instruction,
              resolution,
              referenceImages,
              customApiKey
          );
          
          setGeneratedImages(prev => ({
              ...prev,
              [index]: { ...prev[index], imageUrl: newImageUrl }
          }));

          // Reset Edit Mode
          setEditingSceneIndex(null);
          setSelectionBox(null);
          setEditPrompt("");

      } catch (error) {
          console.error("Edit failed", error);
          alert(t.editFailed);
      } finally {
          setIsEditingImage(false);
      }
  };

  if (!apiKeyReady) {
    return (
      <KeyGate
        language={language}
        t={t}
        onToggleLanguage={toggleLanguage}
        onSaveKey={saveManualKey}
        onSkip={handleSkipKeySetup}
        initialValue={customApiKey}
      />
    );
  }

  const hasAnyImages = Object.values(generatedImages).some((img: GeneratedImage) => img.imageUrl && !img.error);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Key Modal (App) */}
      {showKeyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-bold mb-2">{t.keySettingsTitle}</h3>
                    <p className="text-xs text-slate-400 mb-4">{t.keySettingsDesc}</p>
                    <input 
                        autoFocus
                        defaultValue={customApiKey}
                        type="password"
                        placeholder={t.enterKeyPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none mb-4"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') saveManualKey((e.target as HTMLInputElement).value)
                        }}
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowKeyModal(false)}
                            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={(e) => {
                                const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement).value;
                                saveManualKey(input);
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                        >
                            {t.saveKey}
                        </button>
                    </div>
                </div>
            </div>
        )}

      <AppHeader
        t={t}
        referenceImages={referenceImages}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onToggleLanguage={toggleLanguage}
        language={language}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-10 pb-20">
        
        <PromptComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          t={t}
          isEnhancingPrompt={isEnhancingPrompt}
          onEnhancePrompt={handleEnhancePrompt}
          isGeneratingScript={isGeneratingScript}
          onGenerateScript={handleGenerateScript}
          onStopScript={handleStopScript}
          resolution={resolution}
          onResolutionChange={setResolution}
        />

        {/* Results Section */}
        {storyboard && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <StoryboardToolbar
              title={storyboard.title}
              artStyle={storyboard.artStyle}
              onArtStyleChange={(value) => setStoryboard({ ...storyboard, artStyle: value })}
              t={t}
              hasAnyImages={hasAnyImages}
              isZipping={isZipping}
              onDownloadAll={handleDownloadAll}
              isGeneratingImages={isGeneratingImages}
              onStopImages={handleStopImages}
              onGenerateAllImages={handleGenerateAllImages}
            />

            <div className="grid grid-cols-1 gap-12">
              {storyboard.scenes.map((scene, index) => (
                <SceneCard
                  key={index}
                  scene={scene}
                  index={index}
                  generatedImage={generatedImages[index]}
                  t={t}
                  resolution={resolution}
                  referenceImages={referenceImages}
                  editingSceneIndex={editingSceneIndex}
                  selectionBox={selectionBox}
                  isDragging={isDragging}
                  isEditingImage={isEditingImage}
                  editPrompt={editPrompt}
                  onUpdateScene={updateSceneData}
                  onDeleteScene={handleDeleteScene}
                  onGenerateImage={() => generateImageForScene(index, scene.sceneNumber, scene.visualPrompt, storyboard.artStyle)}
                  onStartEditing={startEditing}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onSubmitEdit={submitEdit}
                  onEditPromptChange={setEditPrompt}
                  imageContainerRef={imageContainerRef}
                  onAddGeneratedToReference={addGeneratedToReference}
                  onDownloadImage={handleDownloadImage}
                />
              ))}
            </div>

            <ContinueSection
              value={continuePrompt}
              onChange={setContinuePrompt}
              isContinuing={isContinuingScript}
              onContinue={handleContinueScript}
              t={t}
            />

          </div>
        )}

        {!storyboard && !isGeneratingScript && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none blur-[1px]">
             {/* Placeholder content for empty state visuals */}
             {[1, 2, 3].map(i => (
                 <div key={i} className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
             ))}
          </div>
        )}

      </main>

      {/* Floating Reference Panel Trigger */}
      <button
        onClick={() => setIsReferencePanelOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 shadow-xl hover:border-purple-500/50 hover:text-white hover:bg-slate-900/90 transition-all"
        aria-pressed={isReferencePanelOpen}
      >
        <Images className="w-5 h-5 text-purple-300" />
        <span className="text-sm font-semibold">{t.refsButton}</span>
        {referenceImages.length > 0 && (
          <span className="text-xs font-bold bg-purple-600/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/40">
            {referenceImages.length}
          </span>
        )}
      </button>

      <ReferencePanel
        isOpen={isReferencePanelOpen}
        onClose={() => setIsReferencePanelOpen(false)}
        referenceImages={referenceImages}
        onRemoveReferenceImage={removeReferenceImage}
        fileInputRef={fileInputRef}
        onImageUpload={handleImageUpload}
        onOpenFilePicker={handleOpenFilePicker}
        t={t}
      />
    </div>
  );
};

export default App;