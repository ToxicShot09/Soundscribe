import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioControls } from './AudioControls';
import { AudioProgress } from './AudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioCardProps {
  fileName: string;
  filePath: string;
  fileId: string;
  audioUrl: string;
  onDelete: (id: string) => void;
  isGlobalPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export const AudioCard = ({
  fileName,
  filePath,
  fileId,
  audioUrl,
  onDelete,
  isGlobalPlaying,
  onPlayStateChange,
}: AudioCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isGlobalPlaying && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isGlobalPlaying, isPlaying]);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      console.log('Starting deletion process for file:', fileId);
      
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('audio_files')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw storageError;
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }
      
      onDelete(fileId);
      toast.success('Audio file deleted successfully');
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
        onPlayStateChange(false);
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio file');
        });
        onPlayStateChange(true);
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

  return (
    <Card className="w-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold truncate">{fileName}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            onPlayStateChange(false);
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            toast.error('Error loading audio file');
          }}
        />
        <AudioProgress
          currentTime={currentTime}
          duration={duration}
          onSliderChange={handleSliderChange}
        />
        <AudioControls
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onSkipForward={skipForward}
          onSkipBackward={skipBackward}
        />
      </CardContent>
    </Card>
  );
};