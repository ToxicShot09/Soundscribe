import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AudioCard } from './audio/AudioCard';

interface AudioPlayerProps {
  fileName: string;
  filePath: string;
  fileId: string;
  createdAt?: string;
  onDelete: (id: string) => void;
  currentPlayingId: string | null;
  onPlayStateChange: (fileId: string | null) => void;
}

export const AudioPlayer = ({
  fileName,
  filePath,
  fileId,
  createdAt,
  onDelete,
  currentPlayingId,
  onPlayStateChange
}: AudioPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('audio_files')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.error('Error creating signed URL:', error);
          toast.error('Failed to load audio file');
          return;
        }

        if (data?.signedUrl) {
          setAudioUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error fetching audio URL:', error);
        toast.error('Failed to load audio file');
      }
    };

    fetchAudioUrl();
  }, [filePath]);

  if (!audioUrl) {
    return <div className="glass h-44 w-full animate-pulse rounded-2xl" />;
  }

  return (
    <AudioCard
      fileName={fileName}
      filePath={filePath}
      fileId={fileId}
      createdAt={createdAt}
      audioUrl={audioUrl}
      onDelete={onDelete}
      currentPlayingId={currentPlayingId}
      onPlayStateChange={onPlayStateChange}
    />
  );
};
