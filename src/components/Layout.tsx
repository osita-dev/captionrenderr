import { Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          CaptionRender
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Upload
          </Link>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
      <footer className="border-t border-zinc-800 py-4 text-center text-sm text-zinc-600">
        CaptionRender — auto-caption & burn subtitles
      </footer>
    </div>
  );
}
