import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const { data } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);
        
        console.log('Audio URL:', data.publicUrl);
        setAudioUrl(data.publicUrl);
      } catch (error) {
        console.error('Error fetching audio URL:', error);
        toast.error('Failed to load audio file');
      }
    };

    fetchAudioUrl();
  }, [filePath]);

  useEffect(() => {
    if (isGlobalPlaying && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isGlobalPlaying, isPlaying]);

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
      console.log('Audio duration:', audioRef.current.duration);
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

  const handleDelete = async () => {
    try {
      console.log('Deleting file:', { fileId, filePath });
      
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
        .eq('id', fileId)
        .single();

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      console.log('File deleted successfully');
      onDelete(fileId);
      toast.success('Audio file deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete audio file');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium truncate flex-1 mr-4">{fileName}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-8 w-8 text-destructive hover:text-destructive/90"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {audioUrl && (
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
      )}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBackward}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};