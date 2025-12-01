import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Film, Clapperboard, Image as ImageIcon, Sparkles, AlertCircle, Loader2, Wand2, Square, Edit3, RefreshCw, MousePointer2, CheckCircle2, UserCheck, X, Download, FolderDown, KeyRound, Upload, Plus, Settings, Globe, ArrowDown, Trash2 } from 'lucide-react';
import { StoryboardData, GeneratedImage, ImageResolution, Scene, SelectionBox } from './types';
import * as GeminiService from './services/geminiService';
// @ts-ignore
import JSZip from 'jszip';

// Define a local interface for the AI Studio helper to avoid global namespace conflicts
interface AIStudioClient {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => void;
}

const translations = {
  en: {
    connectViaAI: "Connect via AI Studio",
    or: "Or",
    enterKeyPlaceholder: "Enter API Key manually (sk-...)",
    useManualKey: "Use Manual Key",
    needKey: "Need a key?",
    getKeyLink: "Get one from Google AI Studio",
    keySettingsTitle: "API Key Settings",
    keySettingsDesc: "Manually override the API Key. This will take precedence over any environment key.",
    cancel: "Cancel",
    saveKey: "Save Key",
    activeRefs: "Active Refs",
    heroTitle: "Visual Storytelling,",
    heroTitleHighlight: "Reimagined",
    heroDesc: "Describe your vision. Upload characters. Generate a professional storyboard in seconds.",
    storyPlaceholder: "Story idea: A cyberpunk detective walking through neon-lit streets searching for a rogue android...",
    stop: "Stop",
    generate: "Generate",
    refsButton: "Refs",
    uploadRefsHint: "Upload character references or style guides here...",
    styleLabel: "Style:",
    stylePlaceholder: "Define visual style...",
    downloadZip: "Download ZIP",
    stopAll: "Stop All",
    generateAllFrames: "Generate All Frames",
    shotTypePlaceholder: "Shot Type",
    sceneTitlePlaceholder: "Scene Title",
    narrativeLabel: "Narrative Action",
    visualPromptLabel: "Visual Prompt",
    regenerate: "Regenerate",
    magicEdit: "Magic Edit",
    useAsRef: "Use as Ref",
    dragToSelect: "Drag to select area → Type change → Enter",
    rendering: "Rendering",
    frame: "frame",
    failed: "Generation failed",
    retry: "Retry",
    generateFrame: "Generate Frame",
    savedRef: "SAVED REF",
    editPlaceholder: "Describe change (e.g. 'Add a red hat')",
    noResponse: "No response from AI",
    scriptFailed: "Failed to generate script. Please try again or check your API key connection.",
    enhancementFailed: "Enhancement failed. Check your API key.",
    noImagesToDownload: "No images to download.",
    failedToZip: "Failed to create zip file.",
    editFailed: "Failed to edit image. Try a different prompt.",
    continueScript: "Continue Script",
    continuePlaceholder: "Describe what happens next... (optional)",
    continuing: "Continuing...",
    deleteScene: "Delete Scene",
    deleteSceneConfirm: "Are you sure you want to delete this scene?",
  },
  zh: {
    connectViaAI: "通过 AI Studio 连接",
    or: "或",
    enterKeyPlaceholder: "手动输入 API Key (sk-...)",
    useManualKey: "使用手动 Key",
    needKey: "没有 Key？",
    getKeyLink: "从 Google AI Studio 获取",
    keySettingsTitle: "API Key 设置",
    keySettingsDesc: "手动覆盖 API Key。这将优先于环境变量。",
    cancel: "取消",
    saveKey: "保存 Key",
    activeRefs: "参考图",
    heroTitle: "视觉叙事，",
    heroTitleHighlight: "重塑想象",
    heroDesc: "描述你的构想。上传角色。几秒钟内生成专业的分镜脚本。",
    storyPlaceholder: "故事创意：一个赛博朋克侦探走在霓虹闪烁的街道上寻找流氓机器人...",
    stop: "停止",
    generate: "生成",
    refsButton: "参考",
    uploadRefsHint: "在此上传角色参考图或风格指南...",
    styleLabel: "风格：",
    stylePlaceholder: "定义视觉风格...",
    downloadZip: "打包下载",
    stopAll: "全部停止",
    generateAllFrames: "生成所有画面",
    shotTypePlaceholder: "镜头类型",
    sceneTitlePlaceholder: "场景标题",
    narrativeLabel: "剧情描述",
    visualPromptLabel: "画面提示词",
    regenerate: "重新生成",
    magicEdit: "魔法编辑",
    useAsRef: "设为参考",
    dragToSelect: "拖拽框选区域 → 输入修改 → 回车",
    rendering: "正在渲染",
    frame: "画面",
    failed: "生成失败",
    retry: "重试",
    generateFrame: "生成画面",
    savedRef: "已设参考",
    editPlaceholder: "描述修改 (例如：'加一顶红帽子')",
    noResponse: "AI 未响应",
    scriptFailed: "脚本生成失败。请重试或检查 API Key 连接。",
    enhancementFailed: "优化失败。请检查 API Key。",
    noImagesToDownload: "没有可下载的图片。",
    failedToZip: "创建压缩包失败。",
    editFailed: "编辑失败。请尝试不同的提示词。",
    continueScript: "续写脚本",
    continuePlaceholder: "描述接下来的剧情... (可选)",
    continuing: "正在续写...",
    deleteScene: "删除分镜",
    deleteSceneConfirm: "确定要删除此分镜吗？",
  }
};

const App: React.FC = () => {
  // Detect browser language
  const [language, setLanguage] = useState<'en' | 'zh'>(
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
    const checkKey = async () => {
      // If we already have a process.env key, we are good.
      if (process.env.API_KEY) {
          setApiKeyReady(true);
          return;
      }
      
      const aistudio = (window as any).aistudio as AIStudioClient | undefined;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (hasKey) setApiKeyReady(true);
      }
    };
    checkKey();
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

  const handleSelectKey = () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio && aistudio.openSelectKey) {
      aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };

  const saveManualKey = (key: string) => {
      if (key.trim()) {
          setCustomApiKey(key.trim());
          setApiKeyReady(true);
          setShowKeyModal(false);
      }
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
        const files = Array.from(e.target.files);
        
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
          
          const newImageUrl = await GeminiService.editSceneImage(originalImageUrl, instruction, resolution, customApiKey);
          
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>

        <div className="absolute top-6 right-6 z-20">
             <button 
                onClick={toggleLanguage}
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
          
          <div className="text-center mb-8">
             <h1 className="text-3xl font-bold mb-2 tracking-tight">CineScript AI</h1>
             <p className="text-slate-400 text-sm">Professional Storyboarding powered by Gemini 3 Pro</p>
          </div>

          <div className="space-y-4">
             {/* Auto Connect Button */}
             <button 
                onClick={handleSelectKey}
                className="w-full py-3 px-4 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" className="w-5 h-5" alt="Gemini" />
                {t.connectViaAI}
              </button>
              
              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-600 text-xs uppercase">{t.or}</span>
                  <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button 
                onClick={() => setShowKeyModal(true)}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                {t.useManualKey}
              </button>
          </div>
          
          <p className="mt-6 text-center text-xs text-slate-500">
            {t.needKey} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors underline decoration-purple-500/30 underline-offset-2">{t.getKeyLink}</a>
          </p>
        </div>

        {/* Manual Key Modal (Landing) */}
        {showKeyModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-bold mb-2">{t.keySettingsTitle}</h3>
                    <p className="text-xs text-slate-400 mb-4">{t.keySettingsDesc}</p>
                    <input 
                        autoFocus
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
      </div>
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

      {/* Header */}
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
                            <img key={idx} src={img} alt="Ref" className="w-6 h-6 rounded-full object-cover border-2 border-slate-900 ring-1 ring-purple-500/50" />
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
                    onClick={() => setShowKeyModal(true)}
                    className="p-2 text-slate-400 hover:text-purple-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all active:scale-95"
                    title="API Key Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
                <button 
                    onClick={toggleLanguage}
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-10 pb-20">
        
        {/* Input Section */}
        <section className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {t.heroTitle} <span className="text-purple-400">{t.heroTitleHighlight}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              {t.heroDesc}
            </p>
          </div>

          <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.storyPlaceholder}
                className="w-full bg-slate-950 text-white placeholder-slate-600 rounded-xl p-6 min-h-[160px] resize-none focus:outline-none text-lg leading-relaxed"
              />
              
              {/* Internal Toolbar */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                 {/* Enhance Button */}
                <button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt || isGeneratingScript || !prompt.trim()}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-purple-400 rounded-lg transition-colors border border-slate-800 hover:border-purple-500/30 tooltip-trigger group relative"
                    title="AI Enhance Prompt"
                >
                    {isEnhancingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </button>

                <div className="w-px h-8 bg-slate-800 mx-1"></div>

                 {/* Resolution Selector */}
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                    {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                        <button
                            key={res}
                            onClick={() => setResolution(res)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                resolution === res 
                                ? 'bg-slate-800 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {res}
                        </button>
                    ))}
                </div>

                {isGeneratingScript ? (
                    <button
                        onClick={handleStopScript}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        {t.stop}
                    </button>
                ) : (
                    <button
                        onClick={handleGenerateScript}
                        disabled={!prompt.trim() || isEnhancingPrompt}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5"
                    >
                        <Sparkles className="w-4 h-4" />
                        {t.generate}
                    </button>
                )}
              </div>
            </div>

            {/* Reference Images Area */}
            <div className="border-t border-slate-800 bg-slate-950/30 rounded-b-xl px-4 py-3 flex items-center gap-4 overflow-x-auto min-h-[80px]">
                <div className="flex-shrink-0">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-slate-900 transition-all group"
                    >
                        <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">{t.refsButton}</span>
                    </button>
                </div>

                {referenceImages.length === 0 ? (
                    <span className="text-slate-600 text-xs italic">{t.uploadRefsHint}</span>
                ) : (
                    <div className="flex items-center gap-3">
                        {referenceImages.map((img, idx) => (
                            <div key={idx} className="relative group w-16 h-16 flex-shrink-0 animate-in fade-in zoom-in duration-300">
                                <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover rounded-lg border border-slate-700" />
                                <button 
                                    onClick={() => removeReferenceImage(idx)}
                                    className="absolute -top-1.5 -right-1.5 bg-slate-900 text-slate-400 hover:text-red-400 rounded-full p-0.5 border border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {storyboard && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="sticky top-20 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-xl md:border md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{storyboard.title}</h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-purple-400 font-medium text-xs uppercase tracking-wider">{t.styleLabel}</span>
                    <input 
                        type="text" 
                        value={storyboard.artStyle}
                        onChange={(e) => setStoryboard({...storyboard, artStyle: e.target.value})}
                        className="bg-transparent border-b border-slate-800 hover:border-slate-600 focus:border-purple-500 text-slate-300 text-sm w-full md:w-[400px] focus:outline-none transition-colors placeholder:text-slate-700"
                        placeholder={t.stylePlaceholder}
                    />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasAnyImages && (
                    <button
                        onClick={handleDownloadAll}
                        disabled={isZipping}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-800 transition-colors"
                    >
                        {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
                        {t.downloadZip}
                    </button>
                )}

                {isGeneratingImages ? (
                    <button
                        onClick={handleStopImages}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        {t.stopAll}
                    </button>
                ) : (
                    <button
                        onClick={handleGenerateAllImages}
                        className="bg-white text-slate-950 hover:bg-purple-50 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/10 transition-all hover:scale-105"
                    >
                        <ImageIcon className="w-4 h-4" />
                        {t.generateAllFrames}
                    </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {storyboard.scenes.map((scene, index) => (
                <div 
                  key={index} 
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[360px]">
                    
                    {/* Script Content (Editable) */}
                    <div className="lg:col-span-2 p-6 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/50 relative">
                      
                      {/* Delete Button */}
                      <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={() => handleDeleteScene(index)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800"
                            title={t.deleteScene}
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                      </div>

                      {/* Header Row */}
                      <div className="flex items-center justify-between pr-8">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-950 px-2 py-1 rounded">Scene {scene.sceneNumber}</span>
                          <input 
                            value={scene.cameraShot}
                            onChange={(e) => updateSceneData(index, 'cameraShot', e.target.value)}
                            className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 focus:outline-none focus:border-purple-500 w-32 text-center"
                            placeholder={t.shotTypePlaceholder}
                          />
                      </div>

                      {/* Title */}
                      <input 
                        value={scene.title}
                        onChange={(e) => updateSceneData(index, 'title', e.target.value)}
                        className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-800 focus:border-purple-500 focus:outline-none transition-all pb-1 w-full"
                        placeholder={t.sceneTitlePlaceholder}
                      />

                      {/* Narrative */}
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block tracking-wider">{t.narrativeLabel}</label>
                        <textarea 
                            value={scene.narrativeScript}
                            onChange={(e) => updateSceneData(index, 'narrativeScript', e.target.value)}
                            className="w-full bg-slate-950/30 text-slate-300 text-sm p-4 rounded-xl border border-slate-800 focus:border-purple-500 focus:outline-none resize-none min-h-[120px] leading-relaxed italic"
                        />
                      </div>

                      {/* Visual Prompt */}
                      <div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block flex items-center justify-between tracking-wider">
                            <span>{t.visualPromptLabel}</span>
                            <Edit3 className="w-3 h-3 text-slate-600" />
                        </label>
                        <textarea 
                            value={scene.visualPrompt}
                            onChange={(e) => updateSceneData(index, 'visualPrompt', e.target.value)}
                            className="w-full bg-slate-800/30 text-slate-400 text-xs p-3 rounded-xl border border-slate-800 focus:border-purple-500 focus:outline-none resize-none min-h-[80px] font-mono leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Image Area - Interactive Canvas */}
                    <div 
                        className={`lg:col-span-3 bg-black relative flex items-center justify-center transition-colors select-none overflow-hidden ${editingSceneIndex === index ? 'cursor-crosshair' : ''}`}
                        ref={editingSceneIndex === index ? imageContainerRef : null}
                        onMouseDown={(e) => handleMouseDown(e, index)}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        
                        {generatedImages[index]?.imageUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                                <img 
                                    src={generatedImages[index].imageUrl} 
                                    alt={`Scene ${scene.sceneNumber}`}
                                    className={`w-full h-full object-contain animate-in fade-in duration-500 ${isEditingImage && editingSceneIndex === index ? 'opacity-50 blur-sm scale-[0.99] transition-all' : ''}`}
                                />

                                {/* Edit Mode Overlay */}
                                {editingSceneIndex === index && selectionBox && selectionBox.width > 5 && (
                                    <div 
                                        className="absolute border border-white bg-purple-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 backdrop-contrast-125"
                                        style={{
                                            left: selectionBox.startX,
                                            top: selectionBox.startY,
                                            width: selectionBox.width,
                                            height: selectionBox.height
                                        }}
                                    >
                                        {/* Input Popover when selection is drawn and not dragging */}
                                        {!isDragging && (
                                            <div className="absolute top-full left-0 mt-3 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex gap-2 w-72 z-20 animate-in zoom-in-95 slide-in-from-top-2 duration-200" onMouseDown={e => e.stopPropagation()}>
                                                <input 
                                                    autoFocus
                                                    value={editPrompt}
                                                    onChange={(e) => setEditPrompt(e.target.value)}
                                                    placeholder={t.editPlaceholder}
                                                    className="flex-1 bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-purple-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') submitEdit(index, generatedImages[index].imageUrl);
                                                        if (e.key === 'Escape') { /* Handled by global */ }
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => submitEdit(index, generatedImages[index].imageUrl)}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors"
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Image Action Overlay (Hover) */}
                                {editingSceneIndex !== index && (
                                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <button 
                                            onClick={() => generateImageForScene(index, scene.sceneNumber, scene.visualPrompt, storyboard.artStyle)}
                                            className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            {t.regenerate}
                                        </button>

                                        <button 
                                            onClick={() => startEditing(index)}
                                            data-ignore-outside-click="true"
                                            className="bg-blue-600/80 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                                        >
                                            <MousePointer2 className="w-3.5 h-3.5" />
                                            {t.magicEdit}
                                        </button>

                                        <button 
                                            onClick={() => addGeneratedToReference(generatedImages[index].imageUrl)}
                                            className="bg-purple-600/80 hover:bg-purple-500 hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-semibold transition-all backdrop-blur-md"
                                            title={t.useAsRef}
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            {t.useAsRef}
                                        </button>
                                    </div>
                                )}

                                {/* Individual Download Button (Always visible on hover) */}
                                {editingSceneIndex !== index && (
                                     <button 
                                        onClick={() => handleDownloadImage(generatedImages[index].imageUrl, scene.sceneNumber, scene.title)}
                                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                        title={t.downloadZip}
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {/* Edit Mode Info */}
                                {editingSceneIndex === index && !selectionBox && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-4 py-1.5 rounded-full shadow-lg pointer-events-none backdrop-blur animate-in fade-in slide-in-from-top-2">
                                        {t.dragToSelect}
                                    </div>
                                )}
                                
                                {isEditingImage && editingSceneIndex === index && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                         <div className="bg-black/50 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                         </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                                {generatedImages[index]?.isLoading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                                            <Loader2 className="w-10 h-10 text-purple-400 animate-spin relative z-10" />
                                        </div>
                                        <span className="text-sm text-slate-400 font-medium">{t.rendering} {resolution} {t.frame}...</span>
                                    </div>
                                ) : generatedImages[index]?.error ? (
                                     <div className="flex flex-col items-center gap-3">
                                        <AlertCircle className="w-10 h-10 text-red-500/80" />
                                        <span className="text-sm text-red-400">{t.failed}</span>
                                        <button 
                                            onClick={() => generateImageForScene(index, scene.sceneNumber, scene.visualPrompt, storyboard.artStyle)}
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
                                                onClick={() => generateImageForScene(index, scene.sceneNumber, scene.visualPrompt, storyboard.artStyle)}
                                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5"
                                            >
                                                {t.generateFrame}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Status Label - shows if consistent with reference */}
                         {referenceImages.includes(generatedImages[index]?.imageUrl || "") && (
                            <div className="absolute bottom-4 left-4 bg-green-500/20 border border-green-500/50 text-green-400 px-2 py-1 rounded text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md">
                                <CheckCircle2 className="w-3 h-3" /> {t.savedRef}
                            </div>
                         )}
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Continue Script Section */}
            <div className="flex flex-col items-center justify-center py-12 border-t border-slate-800 border-dashed rounded-3xl bg-slate-900/20 space-y-4">
                 <div className="w-full max-w-2xl px-4 flex gap-3">
                    <input 
                        value={continuePrompt}
                        onChange={(e) => setContinuePrompt(e.target.value)}
                        placeholder={t.continuePlaceholder}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-purple-500 focus:outline-none placeholder-slate-600"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isContinuingScript) handleContinueScript();
                        }}
                    />
                    <button
                        onClick={handleContinueScript}
                        disabled={isContinuingScript}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg whitespace-nowrap"
                    >
                        {isContinuingScript ? (
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
    </div>
  );
};

export default App;