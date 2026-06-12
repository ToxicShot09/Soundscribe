const BAR_HEIGHTS = [10, 22, 16, 30, 24, 38, 28, 44, 34, 20, 40, 26, 14, 32, 24, 36, 18, 28, 12, 20];

interface WaveformProps {
  className?: string;
  animated?: boolean;
}

export const Waveform = ({ className = "", animated = true }: WaveformProps) => (
  <div className={`flex items-center justify-center gap-[5px] ${className}`} aria-hidden="true">
    {BAR_HEIGHTS.map((height, i) => (
      <span
        key={i}
        className={`w-[4px] rounded-full bg-gradient-to-t from-violet-600 to-fuchsia-400 ${animated ? "animate-wave" : ""}`}
        style={{ height: `${height}px`, animationDelay: `${i * 0.09}s` }}
      />
    ))}
  </div>
);
