import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftRight, Download, ExternalLink } from 'lucide-react';

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
  type: 'image' | 'video';
}

const CompareSlider: React.FC<CompareSliderProps> = ({ beforeImage, afterImage, type }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, [isResizing]);

  // Touch support
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleTouchMove]);

  // Video handling
  // If it's a video, the 'afterImage' is actually a video blob URL.
  // We display the 'before' image as a static background, and the 'after' video in the foreground clip.
  
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-blue-400"/> 
          结果对比
        </h3>
        <a 
          href={afterImage} 
          download={`processed_${type === 'video' ? 'video.mp4' : 'image.png'}`}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <Download size={14} /> 下载
        </a>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-700 shadow-2xl"
      >
        {/* Background (After/Result) */}
        {type === 'video' ? (
          <video 
            src={afterImage} 
            className="absolute inset-0 w-full h-full object-contain bg-black"
            autoPlay 
            loop 
            muted 
            playsInline
          />
        ) : (
          <img 
            src={afterImage} 
            alt="Result" 
            className="absolute inset-0 w-full h-full object-contain bg-[#0f172a]" // Dark bg to match theme
          />
        )}

        {/* Foreground (Before/Original) - Clipped */}
        <div 
          className="absolute inset-0 overflow-hidden bg-[#0f172a]"
          style={{ width: `${sliderPosition}%`, borderRight: '2px solid rgba(255,255,255,0.8)' }}
        >
           <img 
            src={beforeImage} 
            alt="Original" 
            className="absolute top-0 left-0 h-full max-w-none object-contain"
            style={{ width: containerRef.current?.clientWidth ? `${containerRef.current.clientWidth}px` : '100%' }} 
            // Note: We need to ensure the widths match perfectly for overlay. 
            // Using object-contain makes this tricky if aspect ratios differ, but for same image size it's okay.
            // In a real app, we'd force aspect ratio container. Assuming 16:9 or input ratio here.
          />
          
           {/* Label */}
           <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
              原图
           </div>
        </div>

         {/* Label for Result */}
         <div className="absolute top-4 right-4 bg-blue-600/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
            {type === 'video' ? '重绘后' : '清理后'}
         </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-900">
            <ArrowLeftRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareSlider;