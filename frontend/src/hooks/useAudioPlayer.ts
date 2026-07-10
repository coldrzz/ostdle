import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAudioPlayerOptions {
  src: string;
  /** Omit to play until the file ends. */
  clipDuration?: number;
  onPlayEnd?: () => void;
}

export function useAudioPlayer({ src, clipDuration, onPlayEnd }: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPlayEndRef = useRef(onPlayEnd);

  useEffect(() => {
    onPlayEndRef.current = onPlayEnd;
  }, [onPlayEnd]);

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

  useEffect(() => () => stop(), [stop]);

  const play = useCallback(() => {
    stop();

    const audio = new Audio(src);
    audioRef.current = audio;

    audio.currentTime = 0;
    audio.volume = 0.8;

    const handleEnded = () => {
      setIsPlaying(false);
      onPlayEndRef.current?.();
    };

    void audio.play().then(() => {
      setIsPlaying(true);
      setHasPlayed(true);

      if (clipDuration !== undefined) {
        timeoutRef.current = setTimeout(() => {
          audio.pause();
          handleEnded();
        }, clipDuration * 1000);
      } else {
        audio.addEventListener('ended', handleEnded, { once: true });
      }
    }).catch(() => {
      setIsPlaying(false);
    });
  }, [src, clipDuration, stop]);

  return { play, stop, isPlaying, hasPlayed };
}
