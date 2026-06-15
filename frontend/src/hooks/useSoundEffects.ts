import { useCallback, useRef } from 'react';

function createOscillator(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume = 0.15,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playHover = useCallback(() => {
    const ctx = getContext();
    createOscillator(ctx, 800, 'sine', 0.05, 0.05);
  }, [getContext]);

  const playClick = useCallback(() => {
    const ctx = getContext();
    createOscillator(ctx, 600, 'square', 0.08, 0.08);
  }, [getContext]);

  const playSuccess = useCallback(() => {
    const ctx = getContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.12, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  }, [getContext]);

  const playError = useCallback(() => {
    const ctx = getContext();
    createOscillator(ctx, 200, 'sawtooth', 0.2, 0.1);
  }, [getContext]);

  return { playHover, playClick, playSuccess, playError };
}
