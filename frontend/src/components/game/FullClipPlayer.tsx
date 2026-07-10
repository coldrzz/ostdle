import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { LEVEL_AUDIO_DURATION } from '@/types';
import './ResultOverlay.css';

interface FullClipPlayerProps {
  audioSrc: string;
}

export function FullClipPlayer({ audioSrc }: FullClipPlayerProps) {
  const { playHover } = useSoundEffects();
  const { play, stop, isPlaying } = useAudioPlayer({ src: audioSrc });

  return (
    <div className="result-overlay__audio-controls">
      {!isPlaying ? (
        <button
          type="button"
          className="result-overlay__play-btn"
          onClick={play}
          onMouseEnter={playHover}
          aria-label={`Escuchar ${LEVEL_AUDIO_DURATION} segundos completos`}
        >
          <span className="result-overlay__play-icon" aria-hidden="true">
            ▶
          </span>
          <span>Escuchar {LEVEL_AUDIO_DURATION} seg</span>
        </button>
      ) : (
        <>
          <span className="result-overlay__playing-label">Reproduciendo...</span>
          <button
            type="button"
            className="result-overlay__play-btn result-overlay__play-btn--playing"
            onClick={stop}
            onMouseEnter={playHover}
            aria-label="Detener audio"
          >
            <span className="result-overlay__play-icon" aria-hidden="true">
              ■
            </span>
            <span>Detener</span>
          </button>
        </>
      )}
    </div>
  );
}
