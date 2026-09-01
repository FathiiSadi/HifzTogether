import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  colorScheme?: 'emerald' | 'amber' | 'mixed';
  className?: string;
  showStatusLabel?: boolean;
  label?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barCount = 18,
  height = 36,
  colorScheme = 'mixed',
  className = '',
  showStatusLabel = false,
  label,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas internal resolution for crisp retina rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : barCount * 5 + (barCount - 1) * 3;
    const effectiveHeight = height;

    canvas.width = width * dpr;
    canvas.height = effectiveHeight * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, effectiveHeight);

      const totalBarWidth = width;
      const barSpacing = 3;
      const singleBarWidth = Math.max(2, (totalBarWidth - (barCount - 1) * barSpacing) / barCount);

      if (isPlaying) {
        phaseRef.current += 0.08;
      }

      for (let i = 0; i < barCount; i++) {
        let barHeight: number;

        if (isPlaying) {
          // Dynamic undulating sound wave frequency simulation
          const normalizedIndex = i / (barCount - 1);
          // Bell curve weighting towards center with harmonic sine wave variations
          const envelope = Math.sin(normalizedIndex * Math.PI);
          const wave1 = Math.sin(phaseRef.current * 2 + i * 0.45);
          const wave2 = Math.cos(phaseRef.current * 1.3 - i * 0.7);
          const wave3 = Math.sin(phaseRef.current * 3.1 + i * 0.9);

          const intensity = 0.25 + 0.75 * Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
          barHeight = Math.max(4, effectiveHeight * 0.85 * envelope * intensity);
        } else {
          // Resting flat static state when paused / stopped
          barHeight = 3;
        }

        const x = i * (singleBarWidth + barSpacing);
        const y = (effectiveHeight - barHeight) / 2;

        // Gradient coloring: emerald & golden amber highlights
        let fillGradient: CanvasGradient;
        if (colorScheme === 'emerald') {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, '#10B981');
          fillGradient.addColorStop(1, '#047857');
        } else if (colorScheme === 'amber') {
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          fillGradient.addColorStop(0, '#F59E0B');
          fillGradient.addColorStop(1, '#B45309');
        } else {
          // Mixed Quran theme: Emerald with Amber center peak
          const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
          fillGradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (centerDist < 0.35) {
            fillGradient.addColorStop(0, '#F59E0B');
            fillGradient.addColorStop(1, '#D97706');
          } else {
            fillGradient.addColorStop(0, '#10B981');
            fillGradient.addColorStop(1, '#059669');
          }
        }

        ctx.fillStyle = isPlaying ? fillGradient : '#94A3B8';
        
        // Draw rounded pill bar
        const radius = Math.min(singleBarWidth / 2, barHeight / 2);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, singleBarWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, singleBarWidth, barHeight);
        }
        ctx.fill();
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      // Immediate clean static redraw when paused or stopped
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      render();
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, barCount, height, colorScheme]);

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} title={isPlaying ? 'Audio Recitation Playing' : 'Audio Paused'}>
      <canvas
        ref={canvasRef}
        className="w-full max-w-[140px] sm:max-w-[180px] h-[32px] sm:h-[36px]"
        style={{ height: `${height}px` }}
      />
      {showStatusLabel && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
            isPlaying ? 'text-[#059669] dark:text-emerald-400 animate-pulse' : 'text-[#94A3B8]'
          }`}
        >
          {label || (isPlaying ? 'LIVE' : 'PAUSED')}
        </span>
      )}
    </div>
  );
};
