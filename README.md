# CaptionRender

Upload a video → get automatic AI captions → edit & style them → download with subtitles burned in.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (>= 1.2.0)
- [FFmpeg](https://ffmpeg.org) (must be in your PATH)

### 1. Start the Backend

```bash
cd backend
bun install
bun dev
```

The API runs on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd frontend
bun install
bun dev
```

The app runs on `http://localhost:5173`

### 3. Open your browser

Go to `http://localhost:5173` and upload a video!

---

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UPLOAD    │ ──→ │ TRANSCRIBE  │ ──→ │ EDIT & STYLE│ ──→ │   RENDER    │
│             │     │             │     │             │     │             │
│ User uploads│     │ Whisper AI  │     │ Edit words, │     │ FFmpeg burns│
│ video file  │     │ generates   │     │ change font,│     │ captions    │
│             │     │ timestamps  │     │ color, pos  │     │ into video  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload a video file |
| `GET` | `/api/transcribe/:jobId` | Get transcription status + words |
| `GET` | `/api/video/:jobId` | Stream the uploaded video |
| `POST` | `/api/render` | Burn captions into video |
| `GET` | `/api/download/:jobId` | Download the final video |
| `GET` | `/api/job/:jobId` | Get job status |
| `GET` | `/api/health` | Health check |

## Project Structure

```
projectfame/
├── backend/               # Bun + Hono API server
│   ├── src/
│   │   ├── index.ts       # Main server + routes
│   │   ├── transcribe.ts  # Whisper AI transcription
│   │   ├── render.ts      # FFmpeg caption burning
│   │   └── types.ts       # Shared types
│   ├── uploads/           # Uploaded videos (temp)
│   └── outputs/           # Rendered videos (temp)
│
└── frontend/              # React + Vite + Tailwind
    └── src/
        ├── components/    # UI components
        │   ├── VideoUpload.tsx
        │   ├── VideoPreview.tsx
        │   ├── CaptionTimeline.tsx
        │   ├── StyleControls.tsx
        │   └── Layout.tsx
        ├── pages/         # Route pages
        │   ├── Index.tsx      # Upload page
        │   ├── Editor.tsx     # Edit captions
        │   └── Downloads.tsx  # Download page
        ├── lib/
        │   ├── api.ts     # API client
        │   └── types.ts   # TypeScript types
        └── App.tsx        # Router setup
```

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api
```

### Backend (`.env`)
```
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_FILE_SIZE_MB=500
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
```

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Bun, Hono
- **AI**: Xenova Transformers (Whisper-tiny)
- **Video**: FFmpeg
