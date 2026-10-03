import type { VideoJob, WordTimestamp, CaptionStyle } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  async uploadVideo(file: File, onProgress: (p: number) => void): Promise<VideoJob> {
    const formData = new FormData();
    formData.append('video', file);

    // Simulate progress while uploading
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(95, progress + 5);
      onProgress(progress);
    }, 100);

    try {
      // Use XMLHttpRequest for better large file support with progress
      return await new Promise<VideoJob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        });

        xhr.addEventListener('load', () => {
          clearInterval(progressInterval);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const job: VideoJob = JSON.parse(xhr.responseText);
              onProgress(100);
              resolve(job);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            let errorMsg = 'Upload failed';
            try {
              const err = JSON.parse(xhr.responseText);
              errorMsg = err.error || errorMsg;
            } catch { /* ignore */ }
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener('error', () => {
          clearInterval(progressInterval);
          reject(new Error('Network error during upload. Please try again.'));
        });

        xhr.addEventListener('timeout', () => {
          clearInterval(progressInterval);
          reject(new Error('Upload timed out. Please try a smaller file or check your connection.'));
        });

        xhr.open('POST', `${API_BASE}/upload`);
        xhr.timeout = 30 * 60 * 1000; // 30 minutes max for large files
        xhr.send(formData);
      });
    } catch (err) {
      clearInterval(progressInterval);
      throw err;
    }
  },

  async transcribe(jobId: string): Promise<{ words: WordTimestamp[]; duration: number }> {
    // Poll until ready (max ~10 minutes for whisper-medium)
    for (let attempt = 0; attempt < 600; attempt++) {
      const res = await fetch(`${API_BASE}/transcribe/${jobId}`);
      if (!res.ok) throw new Error('Transcribe check failed');

      const data = await res.json();

      if (data.status === 'ready') {
        return { words: data.words, duration: data.duration };
      }
      if (data.status === 'error') {
        throw new Error(data.error || 'Transcription failed');
      }

      // Still transcribing — wait 1 second
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Transcription timed out');
  },

  async compressVideo(file: File, onProgress: (p: number) => void): Promise<File> {
    // Use FFmpeg.wasm or backend compression
    // For now, we'll send to backend for compression
    const formData = new FormData();
    formData.append('video', file);

    return await new Promise<File>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Return the compressed file
          const blob = new Blob([xhr.response], { type: 'video/mp4' });
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '_compressed.mp4'), { type: 'video/mp4' }));
        } else {
          reject(new Error('Compression failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during compression'));
      });

      xhr.open('POST', `${API_BASE}/compress`);
      xhr.responseType = 'arraybuffer';
      xhr.timeout = 10 * 60 * 1000; // 10 minutes
      xhr.send(formData);
    });
  },

  async render(jobId: string, words: WordTimestamp[], style: CaptionStyle): Promise<string> {
    const res = await fetch(`${API_BASE}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, words, style }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Render failed');
    }

    const data = await res.json();

    if (data.status === 'error') throw new Error(data.error || 'Render failed');
    if (!data.downloadUrl) throw new Error('No download URL returned');

    // downloadUrl already contains /api, so just prepend the base URL
    return `http://localhost:3001${data.downloadUrl}`;
  },
};
