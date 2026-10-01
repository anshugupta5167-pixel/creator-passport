'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  description?: string;
  aspectRatio?: 'avatar' | 'banner' | 'square';
  currentImage?: string;
  onImageChange: (dataUrl: string | null) => void;
  className?: string;
}

export default function ImageUploader({
  label,
  description,
  aspectRatio = 'square',
  currentImage,
  onImageChange,
  className = '',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
          {label}
        </label>
        {currentImage && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <Check className="w-3 h-3" />
            <span>Image Selected</span>
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-400">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {currentImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/15 bg-[#14171f] transition-all">
          {aspectRatio === 'banner' ? (
            <div className="w-full h-32 sm:h-36 overflow-hidden relative">
              <img
                src={currentImage}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold shadow hover:bg-slate-200"
                >
                  Change Banner
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-semibold hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : aspectRatio === 'avatar' ? (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src={currentImage}
                  alt="Avatar preview"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shadow-md ring-2 ring-black/40"
                />
                <div>
                  <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                    {fileName || 'Profile Picture'}
                  </span>
                  {fileSize && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {fileSize}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-white/15 bg-[#12141c]/60 hover:bg-[#161922] hover:border-white/30'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
            <Upload className="w-5 h-5 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white block">
              Click to upload or drag & drop
            </span>
            <span className="text-[11px] text-slate-400 font-sans block">
              PNG, JPG, or WebP up to 8MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
