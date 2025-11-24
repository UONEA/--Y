import React, { useState } from 'react';
import { Eraser, Video, Wand2, AlertCircle, Info, Loader2 } from 'lucide-react';
import Dropzone from './components/Dropzone';
import Button from './components/Button';
import CompareSlider from './components/CompareSlider';
import { removeImageWatermark, generateCleanVideo } from './services/geminiService';
import { MediaType, ProcessedResult } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MediaType>(MediaType.IMAGE);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [progress, setProgress] = useState({ message: '', percent: 0 });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleProcess = async () => {
    if (!file || !previewUrl) return;

    setIsLoading(true);
    setProgress({ message: '开始处理...', percent: 0 });
    
    setResult({
      originalUrl: previewUrl,
      processedUrl: null,
      type: activeTab,
      status: 'processing'
    });

    const onProgress = (message: string, percent: number) => {
      setProgress({ message, percent });
    };

    try {
      let processedUrl = '';
      
      if (activeTab === MediaType.IMAGE) {
        // Image Watermark Removal
        processedUrl = await removeImageWatermark(previewUrl, onProgress);
      } else {
        // Video Resynthesis
        processedUrl = await generateCleanVideo(previewUrl, videoPrompt, onProgress);
      }

      setResult({
        originalUrl: previewUrl,
        processedUrl,
        type: activeTab,
        status: 'completed'
      });
    } catch (error: any) {
      console.error(error);
      setResult({
        originalUrl: previewUrl,
        processedUrl: null,
        type: activeTab,
        status: 'error',
        errorMessage: error.message || "发生未知错误。"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setVideoPrompt("");
    setProgress({ message: '', percent: 0 });
  };

  const renderContent = () => {
    // 1. Loading / Progress State
    if (isLoading && previewUrl) {
      return (
        <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 animate-in fade-in duration-300">
           {/* Background Image with Blur */}
           <div className="absolute inset-0">
             <img 
               src={previewUrl} 
               alt="Processing preview" 
               className="w-full h-full object-contain opacity-40 blur-sm scale-105"
             />
             <div className="absolute inset-0 bg-slate-900/60" />
           </div>

           {/* Progress Card */}
           <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 space-y-6">
              <div className="flex justify-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    <div className="relative bg-slate-800 p-4 rounded-full shadow-lg border border-slate-700">
                       <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                 </div>
              </div>
              
              <div className="space-y-2 text-center">
                 <h3 className="text-lg font-semibold text-white">
                    {activeTab === MediaType.IMAGE ? "正在去除水印" : "正在生成视频"}
                 </h3>
                 <p className="text-slate-400 text-sm animate-pulse">
                   {progress.message}
                 </p>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-medium text-slate-500">
                   <span>处理进度</span>
                   <span>{Math.round(progress.percent)}%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                   <div 
                     className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out"
                     style={{ width: `${progress.percent}%` }}
                   />
                 </div>
              </div>
              
              {activeTab === MediaType.VIDEO && (
                  <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    视频生成需要较长时间 (约 1-2 分钟)，<br/>请勿关闭此页面。
                  </p>
              )}
           </div>
        </div>
      );
    }

    // 2. Result State (Success or Error)
    if (result && result.status !== 'processing') {
       if (result.status === 'error') {
         return (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-400 shadow-inner shadow-red-500/10">
                <AlertCircle size={32}/>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-200">处理失败</h3>
                <p className="text-red-300/70 text-sm mt-1">{result.errorMessage}</p>
              </div>
              <Button variant="secondary" onClick={() => setResult(null)} className="mt-4">
                重试
              </Button>
            </div>
         );
       }
       
       return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {result.processedUrl && (
                <CompareSlider 
                  beforeImage={result.originalUrl} 
                  afterImage={result.processedUrl}
                  type={activeTab === MediaType.IMAGE ? 'image' : 'video'}
                />
             )}
             <div className="flex justify-center pt-6">
                <Button variant="outline" onClick={reset}>处理新文件</Button>
             </div>
          </div>
       );
    }

    // 3. Input State (Default)
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === MediaType.VIDEO && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex gap-3 items-start">
              <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-blue-200">
                <strong>实验性功能：</strong> 上传视频中的参考帧（图片）。Veo 将根据此图片生成一个新的、干净的视频。
                <br/>
                <span className="text-xs opacity-70 mt-1 block">注意：这将生成一个新的视频片段，而不是直接修改现有的 .mp4 文件。</span>
              </p>
            </div>
        )}

        <Dropzone 
          onFileSelect={handleFileSelect} 
          accept={activeTab === MediaType.IMAGE ? 'image' : 'video'} 
          label={activeTab === MediaType.VIDEO ? "上传参考帧" : undefined}
        />

        {activeTab === MediaType.VIDEO && file && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">动画提示词（可选）</label>
            <input 
              type="text" 
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="例如：电影感慢动作镜头，逼真的光照..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleProcess} 
            disabled={!file} 
            isLoading={isLoading}
            icon={<Wand2 size={16}/>}
            className="w-full md:w-auto"
          >
            {activeTab === MediaType.IMAGE ? '去除水印' : '生成干净视频'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Eraser className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              PureLens AI
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1">
              <Info size={14}/> 由 Gemini 2.5 驱动
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            瞬间 <span className="text-blue-500">去除水印</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            使用先进的 AI 清理您的图片或根据参考帧重新合成视频。几秒钟内即可获得专业级的清理效果。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 inline-flex shadow-inner">
            <button
              onClick={() => { if(!isLoading) { setActiveTab(MediaType.IMAGE); reset(); } }}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50
                ${activeTab === MediaType.IMAGE 
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Eraser size={16} />
              魔法橡皮擦
            </button>
            <button
              onClick={() => { if(!isLoading) { setActiveTab(MediaType.VIDEO); reset(); } }}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50
                ${activeTab === MediaType.VIDEO 
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Video size={16} />
              视频重绘
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm min-h-[400px] flex flex-col justify-center">
          {renderContent()}
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} PureLens AI. 版权所有。</p>
      </footer>
    </div>
  );
};

export default App;