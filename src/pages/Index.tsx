import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoUpload } from '../components/VideoUpload';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import type { VideoJob } from '../lib/types';

const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB — upload directly
const COMPRESS_THRESHOLD = 90 * 1024 * 1024; // 90MB — max allowed

export default function Index() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCompressDialog, setShowCompressDialog] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleContinue = async () => {
    if (!selectedFile) return;

    // Over 90MB — reject
    if (selectedFile.size > COMPRESS_THRESHOLD) {
      setUploadError('This video is too large. Please use a video under 90MB.');
      return;
    }

    // 60-90MB — offer compression
    if (selectedFile.size > MAX_FILE_SIZE) {
      setShowCompressDialog(true);
      return;
    }

    // Under 60MB — upload directly
    await uploadFile(selectedFile, false);
  };

  const uploadFile = async (file: File, _compress: boolean) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const job: VideoJob = await api.uploadVideo(file, setUploadProgress);
      navigate('/editor', { state: { jobId: job.id, fileName: file.name } });
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleCompressAndUpload = async () => {
    if (!selectedFile) return;
    setShowCompressDialog(false);
    setIsCompressing(true);

    // Compress the file first, then upload
    try {
      const compressedFile = await api.compressVideo(selectedFile, setUploadProgress);
      setIsCompressing(false);
      await uploadFile(compressedFile, false);
    } catch (err) {
      console.error('Compression failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Compression failed. Please try again.');
      setIsCompressing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Caption Your Video</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Upload a video → get automatic captions → edit → style → download with subtitles burned in.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <VideoUpload
            onFileSelected={handleFileSelected}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />
        </div>

        {uploadError && (
          <div className="text-center">
            <p className="text-red-500 text-sm">{uploadError}</p>
          </div>
        )}

        {selectedFile && selectedFile.size > COMPRESS_THRESHOLD && (
          <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-3 text-center">
            <p className="text-red-400 text-sm">
              ⚠️ This video is {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB — too large. Please use a video under 90MB.
            </p>
          </div>
        )}

        {selectedFile && !isUploading && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={selectedFile.size > COMPRESS_THRESHOLD}
              className={`px-8 ${
                selectedFile.size > COMPRESS_THRESHOLD
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Continue →
            </Button>
          </div>
        )}
      </div>

      {/* Compress Dialog */}
      {showCompressDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4 border border-zinc-800">
            <h2 className="text-lg font-bold mb-2">Large Video File</h2>
            <p className="text-zinc-400 mb-4">
              This video is {(selectedFile!.size / (1024 * 1024)).toFixed(1)}MB.
              Videos over 60MB can be compressed for faster processing.
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              Compress to ~70MB? This will reduce quality slightly but speed up upload and processing.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCompressDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompressAndUpload}
                disabled={isCompressing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCompressing ? 'Compressing...' : 'Compress & Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
