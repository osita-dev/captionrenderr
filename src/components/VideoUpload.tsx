import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileVideo } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface VideoUploadProps {
  onFileSelected: (file: File) => void;
  uploadProgress: number;
  isUploading: boolean;
}

export function VideoUpload({ onFileSelected, uploadProgress, isUploading }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`rounded-xl border-2 border-dashed transition-colors ${
      isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-700'
    }`}>
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-4 py-10"
        >
          <Upload className="w-12 h-12 text-zinc-500" />
          <div className="text-center">
            <p className="font-medium text-lg">Drag your video here</p>
            <p className="text-sm text-zinc-500 mt-1">MP4, MOV, WebM — up to 500MB</p>
          </div>
          <Button
            variant="default"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileVideo className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-zinc-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} disabled={isUploading} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">Uploading...</p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
