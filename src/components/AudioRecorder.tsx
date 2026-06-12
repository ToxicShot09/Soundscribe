import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Waveform } from './Waveform';

const MAX_SECONDS = 300; // 5 min cap keeps recordings well under the 10MB limit

interface AudioRecorderProps {
  onUploadComplete?: () => void;
}

const formatElapsed = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

export const AudioRecorder = ({ onUploadComplete }: AudioRecorderProps) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  const stopTracks = () => {
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      stopTracks();
    };
  }, []);

  const stopRecording = useCallback(() => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const uploadRecording = async () => {
    setStatus('uploading');
    try {
      const mime = recorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      stopTracks();

      if (blob.size === 0) {
        toast.error('Nothing was recorded — check your microphone');
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please login to record audio');
        return;
      }

      // Safari records audio/mp4; Chromium-based browsers record webm.
      // Whisper accepts both, and the edge function reads the format from
      // the file_path extension.
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(filePath, blob, { contentType: mime });

      if (uploadError) {
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from('audio_files')
        .insert({
          file_name: `Recording ${format(new Date(), 'MMM d, h.mm a')}`,
          file_path: filePath,
          content_type: mime,
          file_size: blob.size,
          user_id: user.id,
        });

      if (dbError) {
        throw dbError;
      }

      toast.success('Recording saved to your library!');
      onUploadComplete?.();
    } catch (error) {
      console.error('Recording upload error:', error);
      toast.error('Failed to save recording');
    } finally {
      setStatus('idle');
      setElapsed(0);
    }
  };

  const startRecording = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('Microphone access was denied');
      return;
    }

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
      (t) => MediaRecorder.isTypeSupported(t),
    );
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = uploadRecording;

    recorder.start();
    setElapsed(0);
    setStatus('recording');
    timerRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= MAX_SECONDS) {
          stopRecording();
          toast.info('Recording stopped at the 5 minute limit');
        }
        return prev + 1;
      });
    }, 1000);
  };

  return (
    <div className="glass mx-auto w-full max-w-2xl rounded-2xl px-6 py-5">
      {status === 'recording' ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            <span className="text-sm font-medium tabular-nums">{formatElapsed(elapsed)}</span>
            <Waveform className="h-8 scale-75" />
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-lg bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-500"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop & save
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
              <Mic className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No audio file handy?</p>
              <p className="text-xs text-muted-foreground">Record straight from your microphone — up to 5 min</p>
            </div>
          </div>
          <button
            onClick={startRecording}
            disabled={status === 'uploading'}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Record
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
