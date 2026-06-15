import { useCallback, useRef, useState } from 'react';

interface UseAudioPlayerOptions {
  src: string;
  clipDuration: number;
  onPlayEnd?: () => void;
}

export function useAudioPlayer({ src, clipDuration, onPlayEnd }: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    stop();

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.currentTime = 0;
    audio.volume = 0.8;

    void audio.play().then(() => {
      setIsPlaying(true);
      setHasPlayed(true);

      timeoutRef.current = setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
        onPlayEnd?.();
      }, clipDuration * 1000);
    }).catch(() => {
      setIsPlaying(false);
    });
  }, [src, clipDuration, stop, onPlayEnd]);

  return { play, stop, isPlaying, hasPlayed };
}
