import { useState, useRef, useEffect } from 'react';
import { Trash2, Volume2, VolumeX, FileAudio, Sparkles, Loader2, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { AudioControls } from './AudioControls';
import { AudioProgress } from './AudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TranscriptionResult } from '@/services/transcription';
import { transcribeAudio, SUPPORTED_LANGUAGES } from '@/services/transcription';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioCardProps {
  fileName: string;
  filePath: string;
  fileId: string;
  audioUrl: string;
  createdAt?: string;
  onDelete: (id: string) => void;
  currentPlayingId: string | null;
  onPlayStateChange: (fileId: string | null) => void;
}

const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioCard = ({
  fileName,
  filePath,
  fileId,
  audioUrl,
  createdAt,
  onDelete,
  currentPlayingId,
  onPlayStateChange,
}: AudioCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('none');
  const languages = SUPPORTED_LANGUAGES;

  // Pause this card when another card starts playing.
  useEffect(() => {
    if (currentPlayingId !== fileId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [currentPlayingId, fileId, isPlaying]);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .match({ id: fileId, user_id: user.id });

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      const { error: storageError } = await supabase
        .storage
        .from('audio_files')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        toast.error('File partially deleted - storage cleanup failed');
      }

      toast.success('Audio file deleted');
      onDelete(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete audio file');
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPlayStateChange(null);
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio file');
        });
        onPlayStateChange(fileId);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const next = volume === 0 ? 1 : 0;
      setVolume(next);
      audioRef.current.volume = next;
    }
  };

  const handleTranscribe = async () => {
    if (isTranscribing) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(
        filePath,
        sourceLang === 'auto' ? undefined : sourceLang,
        targetLang === 'none' ? undefined : targetLang
      );

      setTranscription(result);

      toast.success(
        result.task === 'translate'
          ? 'Audio translated successfully'
          : 'Audio transcribed successfully'
      );
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to process audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription.text);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    if (!transcription) return;
    const blob = new Blob([transcription.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayLanguage = (code: string) =>
    languages[code] || code.charAt(0).toUpperCase() + code.slice(1);

  return (
    <div className="glass animate-fade-up overflow-hidden rounded-2xl transition-colors hover:border-primary/30">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand shadow-md shadow-violet-600/25">
            <FileAudio className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{fileName}</p>
            {createdAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(createdAt), 'MMM d, yyyy · h:mm a')}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={toggleMute}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete file"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="space-y-5 px-6 py-5">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            onPlayStateChange(null);
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            toast.error('Error loading audio file');
          }}
        />

        <div className="flex items-center gap-6">
          <AudioControls
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onSkipForward={skipForward}
            onSkipBackward={skipBackward}
          />
          <div className="flex-1">
            <AudioProgress
              currentTime={currentTime}
              duration={duration}
              onSliderChange={handleSliderChange}
            />
          </div>
        </div>

        {/* Transcription controls */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source language</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="Source language" />
              </SelectTrigger>
              <SelectContent side="bottom" className="z-50 max-h-72">
                <SelectItem value="auto">Auto-detect</SelectItem>
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Output</label>
            {/* Whisper only translates to English, so that's the only target offered */}
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Output" />
              </SelectTrigger>
              <SelectContent side="bottom" className="z-50">
                <SelectItem value="none">Original language</SelectItem>
                <SelectItem value="en">Translate to English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="ml-auto flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {targetLang === 'none' ? 'Transcribe' : 'Translate'}
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {transcription && (
          <div className="animate-fade-in space-y-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-gradient">
                {transcription.task === 'translate' ? 'Translation' : 'Transcript'}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  aria-label="Copy transcript"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDownload}
                  aria-label="Download transcript as .txt"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{transcription.text}</p>

            {transcription.chunks && transcription.chunks.length > 1 && (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg bg-background/40 p-3">
                {transcription.chunks.map((chunk, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 tabular-nums text-xs leading-6 text-muted-foreground">
                      {formatTimestamp(chunk.timestamp[0])} – {formatTimestamp(chunk.timestamp[1])}
                    </span>
                    <span className="text-foreground/80">{chunk.text}</span>
                  </div>
                ))}
              </div>
            )}

            {transcription.source_language && (
              <p className="text-xs text-muted-foreground">
                {/* Auto-detection returns a language name ("english"), not a code */}
                Source language: {displayLanguage(transcription.source_language)}
                {transcription.target_language && ' · Translated to English'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
