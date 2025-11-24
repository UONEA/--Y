import React, { useCallback, useState } from 'react';
import { Upload, FileImage, FileVideo, X } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept: 'image' | 'video';
  label?: string;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, accept, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file) return;
    
    // Simple validation
    if (accept === 'image' && !file.type.startsWith('image/')) {
      alert('请上传图片文件。');
      return;
    }
    if (accept === 'video' && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
       // Note: For the Veo flow, we might actually start with an image frame, 
       // but let's assume the user provides an image for video generation for now as per service logic.
       // Or if we allow video, we'd need to extract a frame. To keep it simple and robust:
       // We will ask for an Image Reference to generate the video.
       // If accept is video, we'll check video types, but for this specific app flow (Veo),
       // starting from an image is safer. Let's stick to types.
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setFileName(file.name);
      onFileSelect(file);
    };
    reader.readAsDataURL(file);
  }, [accept, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
  }, []);

  return (
    <div 
      className={`relative w-full group cursor-pointer transition-all duration-300 ease-in-out
        ${isDragging ? 'scale-[1.01]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`file-upload-${accept}`)?.click()}
    >
      <input
        id={`file-upload-${accept}`}
        type="file"
        className="hidden"
        accept={accept === 'image' ? "image/*" : "image/*"} // We accept images for video generation too (Veo Image-to-Video)
        onChange={handleFileInput}
      />

      <div className={`
        relative h-64 md:h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-600 bg-slate-800/50 hover:border-slate-400 hover:bg-slate-800'}
      `}>
        
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4 opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
               <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700 flex items-center space-x-2">
                  {accept === 'image' ? <FileImage size={16} className="text-blue-400"/> : <FileVideo size={16} className="text-purple-400"/>}
                  <span className="text-sm text-slate-200 font-medium truncate max-w-[150px]">{fileName}</span>
                  <button 
                    onClick={clearFile}
                    className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
               </div>
               <p className="mt-4 text-white font-semibold drop-shadow-md">点击更换</p>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">
              {label || (accept === 'image' ? "上传图片" : "上传参考图片")}
            </h3>
            <p className="text-sm text-slate-400">
              拖放文件到此处或点击浏览
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {accept === 'image' ? "支持 PNG, JPG, WEBP，最大 10MB" : "上传一帧以生成视频"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;