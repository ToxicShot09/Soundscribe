import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onSkipBackward}
        aria-label="Skip back 10 seconds"
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <SkipBack className="h-4.5 w-4.5" />
      </button>
      <button
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-lg shadow-violet-600/35 transition-all hover:shadow-violet-600/55 hover:brightness-110 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="ml-0.5 h-6 w-6" />
        )}
      </button>
      <button
        onClick={onSkipForward}
        aria-label="Skip forward 10 seconds"
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <SkipForward className="h-4.5 w-4.5" />
      </button>
    </div>
  );
};
