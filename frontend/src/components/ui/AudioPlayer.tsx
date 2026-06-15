import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import './AudioPlayer.css';

interface AudioPlayerProps {
  audioSrc: string;
  clipDuration: number;
  disabled?: boolean;
}

export function AudioPlayer({ audioSrc, clipDuration, disabled = false }: AudioPlayerProps) {
  const { playHover } = useSoundEffects();
  const { play, isPlaying } = useAudioPlayer({
    src: audioSrc,
    clipDuration,
  });

  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 1, 0.5, 0.8];

  return (
    <div className="audio-player">
      <span className="audio-player__label">Reproductor de audio</span>

      <button
        className={`audio-player__play-btn${isPlaying ? ' audio-player__play-btn--playing' : ''}`}
        onClick={play}
        onMouseEnter={playHover}
        disabled={disabled || isPlaying}
        aria-label={isPlaying ? 'Reproduciendo...' : 'Reproducir fragmento'}
      >
        {isPlaying ? '■' : '▶'}
      </button>

      {isPlaying && (
        <div className="audio-player__wave" aria-hidden="true">
          {bars.map((height, i) => (
            <motion.div
              key={i}
              className="audio-player__bar"
              animate={{ height: [height * 24, height * 12, height * 24] }}
              transition={{
                duration: 0.5 + (i % 3) * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ height: height * 24 }}
            />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <div className="audio-player__duration-label">Duración desbloqueada</div>
        <div className="audio-player__duration">{clipDuration} seg</div>
      </div>
    </div>
  );
}
