# Soundscribe

AI-powered audio transcription and translation. Upload an audio file — or record straight from your microphone — play it back in the browser, and get a Whisper-generated transcript or English translation in seconds.

**Stack:** React + TypeScript + Vite + Tailwind/shadcn-ui · Supabase (auth, Postgres, storage, edge functions) · OpenAI Whisper API

## How it works

```
Browser (React SPA, Vercel)
  └── Supabase
        ├── Auth ─────────── email/password sign-in
        ├── Postgres ──────── audio_files metadata (row-level security)
        ├── Storage ───────── private audio bucket, signed-URL playback
        └── Edge Function ─── transcribe: fetches the user's file from
                              storage and calls OpenAI Whisper (whisper-1)
```

1. Users sign up / log in via Supabase Auth.
2. Audio comes in as file uploads (MP3/WAV/FLAC, ≤10MB) or in-browser mic recordings (MediaRecorder, up to 5 min). Both land in a private storage bucket, with metadata in Postgres under RLS so users only ever see their own files.
3. Playback uses short-lived signed URLs.
4. "Transcribe" invokes the `transcribe` edge function with the file's storage path. The function authenticates the caller, downloads the file under the caller's own permissions (so you can only transcribe files you own), and forwards it to OpenAI's Whisper API. Whisper auto-detects the source language among 90+ supported, or translates any of them to English.

The OpenAI key lives server-side as a Supabase secret — it never reaches the browser — and transcription is pay-per-use (whisper-1 is $0.006/min of audio), so there is no idle hosting cost and nothing to keep warm.

## Setup

### 1. Supabase (~5 min)

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the SQL editor, run [supabase/migrations/20260612000000_init.sql](supabase/migrations/20260612000000_init.sql). This creates the `audio_files` and `profiles` tables, the private `audio_files` storage bucket, and all row-level-security policies.
3. Deploy the edge function with the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase functions deploy transcribe
   ```
4. (Optional, for demos) In Authentication → Providers → Email, disable "Confirm email" so signups work without an SMTP setup.

### 2. Frontend

```bash
cp .env.example .env   # fill in your Supabase URL + anon key
npm install
npm run dev            # http://localhost:8080
```

To iterate on the edge function locally: `supabase functions serve transcribe --env-file <file with OPENAI_API_KEY>`.

## Deployment

Only the frontend needs hosting — everything else is Supabase.

1. Import the repo on [vercel.com](https://vercel.com) (framework preset: Vite). `vercel.json` already handles SPA routing.
2. Set environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. In Supabase → Authentication → URL Configuration, set the Site URL to your Vercel domain.

Netlify works identically (add an equivalent `_redirects` rule).

## Edge function API

`POST functions/v1/transcribe` (requires a logged-in user's JWT; invoked via `supabase.functions.invoke`)

```json
{
  "file_path": "<user-id>/<file>.mp3",   // path in the audio_files bucket
  "language": "hi",                       // optional ISO code; omit to auto-detect
  "task": "transcribe"                    // or "translate" (always outputs English — a Whisper limitation)
}
```

Returns `{ text, chunks: [{ text, timestamp: [start, end] }], task, source_language, target_language }`.
