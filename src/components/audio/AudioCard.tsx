import { useState, useRef, useEffect } from 'react';
import { Trash2, Volume2, VolumeX, FileText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioControls } from './AudioControls';
import { AudioProgress } from './AudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TranscriptionResult } from '@/services/transcription';
import { transcribeAudio, getSupportedLanguages } from '@/services/transcription';
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
  onDelete: (id: string) => void;
  isGlobalPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [sourceLang, setSourceLang] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('');

  useEffect(() => {
    if (isGlobalPlaying && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isGlobalPlaying, isPlaying]);

  useEffect(() => {
    getSupportedLanguages()
      .then(setLanguages)
      .catch(console.error);
  }, []);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Get user ID first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete from database only
      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      toast.success('Audio file deleted successfully');
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

  const handleTranscribe = async () => {
    if (isTranscribing) return;
    
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioUrl, sourceLang, targetLang);
      setTranscription(result);
      toast.success(targetLang ? 'Audio translated successfully' : 'Audio transcribed successfully');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to process audio');
    } finally {
      setIsTranscribing(false);
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

        <div className="flex justify-between items-center gap-4 mt-4">
          <div className="flex gap-2 items-center">
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto-detect</SelectItem>
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Target language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No translation</SelectItem>
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isTranscribing ? 'Processing...' : targetLang ? 'Translate' : 'Transcribe'}
            </Button>
          </div>
        </div>

        {transcription && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {targetLang ? 'Translation' : 'Transcription'} 
                {transcription.language && `(${languages[transcription.language] || transcription.language})`}
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">{transcription.text}</p>
              
              {transcription.timestamps && (
                <div className="mt-4 text-sm text-gray-500">
                  <h5 className="font-semibold mb-2">Timestamps</h5>
                  {transcription.timestamps.map((chunk, index) => (
                    <div key={index} className="flex gap-2">
                      <span>{formatTime(chunk.timestamp[0])} - {formatTime(chunk.timestamp[1])}</span>
                      <span>{chunk.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
