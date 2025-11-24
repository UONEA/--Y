import { GoogleGenAI, Modality } from "@google/genai";

// Helper to strip base64 header
const stripBase64Header = (base64: string) => {
  return base64.replace(/^data:(image|video)\/\w+;base64,/, '');
};

export type ProgressCallback = (message: string, percent: number) => void;

// 1. Image Watermark Removal
export const removeImageWatermark = async (base64Image: string, onProgress?: ProgressCallback): Promise<string> => {
  // Always create a new instance to ensure latest key if environment supports it, 
  // though for standard env usage process.env.API_KEY is fixed.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (onProgress) onProgress("正在分析图片内容...", 5);

  // Simulate progress for better UX during the wait since generateContent doesn't stream progress for this task
  let progress = 10;
  const progressInterval = setInterval(() => {
    progress = Math.min(85, progress + (Math.random() * 8)); // Slower increment
    if (onProgress) {
        if (progress < 30) onProgress("识别水印区域...", progress);
        else if (progress < 60) onProgress("正在重绘背景细节...", progress);
        else onProgress("优化图像质量...", progress);
    }
  }, 800);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: stripBase64Header(base64Image),
              mimeType: 'image/png', // Assuming PNG for simplicity, or detect from header
            },
          },
          {
            text: 'Remove all watermarks, logos, text overlays, and copyright symbols from this image. Inpaint the area naturally to match the surrounding texture and background. Output ONLY the cleaned image.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    clearInterval(progressInterval);
    if (onProgress) onProgress("处理完成，正在解码...", 90);

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      if (onProgress) onProgress("完成！", 100);
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data in response");
  } catch (error) {
    clearInterval(progressInterval);
    console.error("Error removing watermark:", error);
    throw error;
  }
};

// 2. Video Resynthesis (Clean & Animate)
// Since we cannot directly 'edit' a video file to remove a watermark frame-by-frame easily with current APIs,
// We will use Veo to generate a NEW clean video based on a cleaned reference image.
export const generateCleanVideo = async (
  base64StartImage: string, 
  prompt: string,
  onProgress?: ProgressCallback
): Promise<string> => {
  
  if (onProgress) onProgress("正在检查 API 权限...", 5);

  // Veo requires user selected API key
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        if (onProgress) onProgress("等待用户选择 API Key...", 5);
        await window.aistudio.openSelectKey();
    }
  }

  // Create AI instance (Veo requires this check usually, or use the env key if provided in a standard env)
  // The prompt instructions say "The selected API key is available via process.env.API_KEY" automatically after selection.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    if (onProgress) onProgress("正在提交 Veo 视频生成任务...", 10);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "A high quality video scene matching this image, cinematic, clear.",
      image: {
        imageBytes: stripBase64Header(base64StartImage),
        mimeType: 'image/png', 
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    let percent = 15;
    // Poll for completion
    while (!operation.done) {
      if (onProgress) {
        if (percent < 30) onProgress("正在初始化视频模型...", percent);
        else if (percent < 70) onProgress("正在逐帧渲染视频 (这可能需要几分钟)...", percent);
        else onProgress("正在进行最终处理...", percent);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({operation: operation});
      
      // Increment progress but don't exceed 95%
      // Slow down increment as it gets higher
      const increment = Math.max(0.5, (95 - percent) / 20);
      percent = Math.min(95, percent + increment);
    }

    if (onProgress) onProgress("生成完成，正在下载视频...", 98);

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Failed to generate video URI");

    // Fetch the actual video bytes
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) throw new Error("Failed to download generated video");
    
    const videoBlob = await videoResponse.blob();
    if (onProgress) onProgress("完成！", 100);
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};