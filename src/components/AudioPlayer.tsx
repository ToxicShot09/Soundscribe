import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AudioCard } from './audio/AudioCard';

interface AudioPlayerProps {
  fileName: string;
  filePath: string;
  fileId: string;
  onDelete: (id: string) => void;
  isGlobalPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export const AudioPlayer = ({ 
  fileName, 
  filePath, 
  fileId, 
  onDelete,
  isGlobalPlaying,
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
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-4">
      <AudioCard
        fileName={fileName}
        filePath={filePath}
        fileId={fileId}
        audioUrl={audioUrl}
        onDelete={onDelete}
        isGlobalPlaying={isGlobalPlaying}
        onPlayStateChange={onPlayStateChange}
      />
    </div>
  );
};