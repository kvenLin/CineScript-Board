import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData, ImageResolution, Scene } from "../types";

// Helper to get the AI client. 
// Prioritizes a manually passed key, falls back to process.env.API_KEY.
const getAiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set it in settings or use AI Studio.");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry helper for transient 500 errors common in preview models
async function withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Retry on server errors or rate limits if appropriate
    if (retries > 0 && (error.status === 500 || error.status === 503 || error.message?.includes('internal') || error.message?.includes('overloaded'))) {
      console.warn(`Operation failed with ${error.status || 'error'}. Retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

export const enhanceStoryPrompt = async (
  originalPrompt: string, 
  language: 'en' | 'zh' = 'en',
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);
  // Using Gemini 3 Pro Preview for creative writing capabilities
  const modelId = "gemini-3-pro-preview";

  const langInstruction = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Act as a professional creative consultant for film. 
      Rewrite and expand the following short story idea into a detailed, evocative paragraph that describes the plot, tone, and visual atmosphere. 
      The goal is to provide a rich basis for a storyboard generator.
      
      User Idea: "${originalPrompt}"
      
      Output the enhanced description only, in ${langInstruction}.`,
    });

    return response.text?.trim() || originalPrompt;
  });
};

export const generateScriptAndStoryboard = async (
  prompt: string, 
  referenceImagesBase64?: string[],
  language: 'en' | 'zh' = 'en',
  apiKey?: string
): Promise<StoryboardData> => {
  const ai = getAiClient(apiKey);
  
  // Using Gemini 3 Pro Preview for complex reasoning and structured JSON output
  const modelId = "gemini-3-pro-preview";

  const langInstruction = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const systemInstruction = `You are a world-class film director and cinematographer. 
  Your goal is to take a simple user idea and turn it into a compelling short film script and storyboard breakdown.
  
  CRITICAL INSTRUCTION FOR REFERENCE IMAGES:
  If the user provides reference images (characters, settings, etc.), you MUST analyze them.
  When writing the "Visual Prompt" for each scene:
  1. DO NOT just say "the character from the image". 
  2. YOU MUST EXPLICITLY DESCRIBE their physical appearance based on the image (e.g., "A young woman with chopped pink hair wearing a distressed denim jacket").
  3. Ensure these visual details are consistent across all scenes where the character appears.

  Standard Tasks:
  1. Define a consistent "Art Style" for the visual generation (e.g., "Cinematic lighting, Cyberpunk aesthetic, anamorphic lens, teal and orange grade").
  2. Break the story into 4-6 key scenes.
  3. For each scene, provide:
     - A script narrative (dialogue or action).
     - A highly detailed "Visual Prompt" optimized for an AI image generator. 
     - The camera shot type (e.g., Close-up, Wide Shot, Dutch Angle).
  
  LANGUAGE REQUIREMENT:
  Output the JSON values (title, artStyle, narrativeScript, visualPrompt, cameraShot) strictly in ${langInstruction}.
  Even for the "Visual Prompt", write it in ${langInstruction} so the user can understand it, but ensure it is descriptive enough for an image model.
  `;

  return withRetry(async () => {
    let contentsPayload: any = prompt;

    // Handle Multimodal Input (Text + Images)
    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      const parts: any[] = [];
      
      for (const refImg of referenceImagesBase64) {
        const base64Data = refImg.split(',')[1] || refImg;
        // Simple mime type detection or default
        let mimeType = 'image/png';
        const match = refImg.match(/data:([^;]+);base64,/);
        if (match) mimeType = match[1];

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
      }
      
      parts.push({ text: `Story Idea: ${prompt}\n\nInstructions: Please analyze the attached reference images and use their visual details to ensure character consistency in the generated scene descriptions.` });
      
      contentsPayload = { parts: parts };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contentsPayload,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the short film" },
            artStyle: { type: Type.STRING, description: "The global visual style description for image consistency" },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  narrativeScript: { type: Type.STRING, description: "The script content, dialogue or action text" },
                  visualPrompt: { type: Type.STRING, description: "Detailed visual description for image generation. MUST include specific physical details of characters if reference images were provided." },
                  cameraShot: { type: Type.STRING, description: "Camera angle/lens description" }
                },
                required: ["sceneNumber", "title", "narrativeScript", "visualPrompt", "cameraShot"]
              }
            }
          },
          required: ["title", "artStyle", "scenes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean up Markdown code blocks if present (common issue with JSON responses)
    const cleanedText = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    
    try {
      return JSON.parse(cleanedText) as StoryboardData;
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.log("Raw Text:", text);
      throw new Error("Failed to parse AI response");
    }
  });
};

export const continueScriptAndStoryboard = async (
  currentStoryboard: StoryboardData,
  continuationPrompt: string,
  referenceImagesBase64?: string[],
  language: 'en' | 'zh' = 'en',
  apiKey?: string
): Promise<Scene[]> => {
  const ai = getAiClient(apiKey);
  const modelId = "gemini-3-pro-preview";
  const langInstruction = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const lastSceneNumber = currentStoryboard.scenes.length > 0 
    ? currentStoryboard.scenes[currentStoryboard.scenes.length - 1].sceneNumber 
    : 0;

  const systemInstruction = `You are a world-class film director. 
  You are CONTINUING an existing storyboard.
  
  CONTEXT:
  Title: "${currentStoryboard.title}"
  Art Style: "${currentStoryboard.artStyle}"
  Previous Scenes: ${JSON.stringify(currentStoryboard.scenes.map(s => ({ number: s.sceneNumber, script: s.narrativeScript })))}
  
  TASK:
  Generate the NEXT 2-3 scenes based on the user's continuation prompt.
  Ensure logic and narrative continuity with previous scenes.
  Maintain the established Art Style.
  Start numbering scenes from ${lastSceneNumber + 1}.

  LANGUAGE:
  Output strictly in ${langInstruction}.
  `;

  return withRetry(async () => {
    let contentsPayload: any = `User Continuation Instruction: "${continuationPrompt || "Continue the story logically."}"`;

    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      const parts: any[] = [];
      for (const refImg of referenceImagesBase64) {
        const base64Data = refImg.split(',')[1] || refImg;
        let mimeType = 'image/png';
        const match = refImg.match(/data:([^;]+);base64,/);
        if (match) mimeType = match[1];

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
      }
      parts.push({ text: contentsPayload });
      contentsPayload = { parts: parts };
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contentsPayload,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newScenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  narrativeScript: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING, description: "Detailed visual description, consistent with previous style and characters." },
                  cameraShot: { type: Type.STRING }
                },
                required: ["sceneNumber", "title", "narrativeScript", "visualPrompt", "cameraShot"]
              }
            }
          },
          required: ["newScenes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const cleanedText = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    
    try {
      const json = JSON.parse(cleanedText);
      return json.newScenes as Scene[];
    } catch (e) {
      console.error("JSON Parse Error:", e);
      throw new Error("Failed to parse AI response for continuation");
    }
  });
};

export const generateSceneImage = async (
  styleGuide: string,
  sceneVisual: string,
  resolution: ImageResolution,
  referenceImagesBase64?: string[],
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);
  
  // Using Gemini 3 Pro Image Preview for high-fidelity generation
  const modelId = "gemini-3-pro-image-preview";

  return withRetry(async () => {
    // Combine style guide and specific scene visual for consistency
    let textPrompt = `Style: ${styleGuide}. Scene: ${sceneVisual}`;
    
    const parts: any[] = [];

    // If reference images are provided, add them to the parts
    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      for (const refImg of referenceImagesBase64) {
        const base64Data = refImg.split(',')[1] || refImg;
        // Determine mime type if possible
        let mimeType = 'image/png';
        const match = refImg.match(/data:([^;]+);base64,/);
        if (match) mimeType = match[1];

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
      }
      
      // Strengthen the prompt to enforce consistency
      textPrompt += " Maintain strict character and visual consistency with the provided reference image(s).";
    }

    parts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: resolution,
          aspectRatio: "16:9"
        }
      }
    });

    // Iterate to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in response");
  });
};

export const editSceneImage = async (
  originalImageBase64: string,
  editInstruction: string,
  resolution: ImageResolution,
  referenceImagesBase64?: string[],
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);
  const modelId = "gemini-3-pro-image-preview"; 

  return withRetry(async () => {
    const base64Data = originalImageBase64.split(',')[1] || originalImageBase64;
    let mimeType = 'image/png';
    const match = originalImageBase64.match(/data:([^;]+);base64,/);
    if (match) mimeType = match[1];

    const parts: any[] = [
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ];

    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      for (const refImg of referenceImagesBase64) {
        const refBase64 = refImg.split(',')[1] || refImg;
        let refMimeType = 'image/png';
        const match = refImg.match(/data:([^;]+);base64,/);
        if (match) refMimeType = match[1];

        parts.push({
          inlineData: {
            data: refBase64,
            mimeType: refMimeType,
          },
        });
      }
    }

    parts.push({ text: `${editInstruction} Maintain consistency with provided reference image(s) if any.` });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts,
      },
      config: {
          imageConfig: {
              imageSize: resolution,
              aspectRatio: "16:9"
          }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No edited image generated");
  });
};