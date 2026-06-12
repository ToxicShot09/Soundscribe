import { Slider } from '@/components/ui/slider';

interface AudioProgressProps {
  currentTime: number;
  duration: number;
  onSliderChange: (value: number[]) => void;
}

export const AudioProgress = ({
  currentTime,
  duration,
  onSliderChange
}: AudioProgressProps) => {
  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sliderMax = Number.isFinite(duration) && duration > 0 ? duration : 100;

  return (
    <div className="space-y-2">
      <Slider
        value={[currentTime]}
        min={0}
        max={sliderMax}
        step={0.1}
        onValueChange={onSliderChange}
        className="w-full cursor-pointer"
      />
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
