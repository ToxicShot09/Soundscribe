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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <Slider
        value={[currentTime]}
        min={0}
        max={duration || 100}
        step={0.1}
        onValueChange={onSliderChange}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};