import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { CheckCircle, Download, ArrowLeft, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { WordTimestamp, CaptionStyle } from '../lib/types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://captionrender.onrender.com/api';

export default function Downloads() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId, fileName, words, style } = location.state || {} as {
    jobId: string;
    fileName: string;
    words: WordTimestamp[];
    style: CaptionStyle;
  };

  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const hasRendered = useRef(false);

  useEffect(() => {
    if (!jobId || !words || !style) {
      navigate('/');
      return;
    }

    // Don't re-render if already completed
    if (hasRendered.current) {
      return;
    }

    let pollInterval: ReturnType<typeof setInterval>;

    // Start rendering
    hasRendered.current = true;
    setIsRendering(true);
    setProgress(0);

    // Poll for render progress
    const pollProgress = async () => {
      try {
        const res = await fetch(`${API_BASE}/job/${jobId}`);
        if (!res.ok) return;

        const job = await res.json();

        if (job.status === 'rendering') {
          // Use actual progress from backend
          setProgress(job.progress || 10);
        } else if (job.status === 'completed') {
          // Render is actually done
          setProgress(100);
          setIsReady(true);
          setIsRendering(false);
          clearInterval(pollInterval);
        } else if (job.status === 'error') {
          setRenderError(job.error || 'Render failed');
          setIsRendering(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Ignore polling errors
      }
    };

    // Start polling frequently for smooth progress
    pollProgress();
    pollInterval = setInterval(pollProgress, 100);

    // Also call render to trigger the process
    api.render(jobId, words, style)
      .then((url) => {
        setDownloadUrl(url);
      })
      .catch((err) => {
        setRenderError(err instanceof Error ? err.message : 'Render failed');
        setIsRendering(false);
        clearInterval(pollInterval);
      });

    return () => clearInterval(pollInterval);
  }, [jobId, words, style, navigate]);

  if (!jobId) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-center">
          {isReady ? '✅ Ready!' : renderError ? '❌ Error' : 'Rendering Video...'}
        </h1>

        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          {renderError ? (
            <div className="space-y-4 text-center">
              <p className="text-red-500">{renderError}</p>
              <Button
                onClick={() => navigate('/editor', { state: { jobId, fileName, words, style } })}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                variant="outline"
              >
                ← Back to Editor
              </Button>
            </div>
          ) : !isReady ? (
            <div className="space-y-4 text-center">
              <p className="text-zinc-400">Burning captions into your video</p>
              <Progress value={progress} className="w-full h-2 bg-zinc-800" />
              <p className="text-sm font-medium">{progress}%</p>
              {isRendering && progress < 100 && (
                <p className="text-xs text-zinc-500">Please wait, this may take a moment...</p>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/editor', { state: { jobId, fileName, words, style } })}
                className="w-full border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 mt-2"
              >
                <XCircle className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-lg">Your captioned video is ready</p>
              <div className="space-y-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <a
                    href={downloadUrl ?? undefined}
                    download="captioned-video.mp4"
                    className="no-underline text-inherit hover:text-inherit"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Video
                  </a>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> New Video
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
