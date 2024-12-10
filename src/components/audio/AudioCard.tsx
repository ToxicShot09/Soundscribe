import { useState, useRef, useEffect } from 'react';
import { Trash2, Volume2, VolumeX } from 'lucide-react';
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
  const [volume, setVolume] = useState(1);
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
      // First, delete from database to prevent new fetches from showing the file
      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      // Then delete from storage
      const { error: storageError } = await supabase.storage
        .from('audio_files')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Even if storage deletion fails, we proceed since the database record is gone
        toast.error('File partially deleted - storage cleanup failed');
      }

      // Notify parent component about deletion
      onDelete(fileId);
      toast.success('Audio file deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete audio file');
      // Refresh the list to ensure consistent state
      onDelete(fileId);
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

  const toggleMute = () => {
    if (audioRef.current) {
      if (volume === 0) {
        setVolume(1);
        audioRef.current.volume = 1;
      } else {
        setVolume(0);
        audioRef.current.volume = 0;
      }
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-xl font-semibold truncate flex-1 mr-4 text-gray-800">{fileName}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
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
        <div className="bg-white/50 p-4 rounded-lg backdrop-blur-sm border border-gray-100">
          <AudioProgress
            currentTime={currentTime}
            duration={duration}
            onSliderChange={handleSliderChange}
          />
        </div>
        <div className="flex justify-center pt-2">
          <AudioControls
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onSkipForward={skipForward}
            onSkipBackward={skipBackward}
          />
        </div>
      </CardContent>
    </Card>
  );
};