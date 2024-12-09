import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
}

export const AudioControls = ({
  isPlaying,
  onPlayPause,
  onSkipForward,
  onSkipBackward
}: AudioControlsProps) => {
  return (
    <div className="flex items-center justify-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onSkipBackward}
        className="h-8 w-8"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onPlayPause}
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
        onClick={onSkipForward}
        className="h-8 w-8"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
};