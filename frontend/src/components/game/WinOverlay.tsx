import { motion } from 'framer-motion';
import { FullClipPlayer } from '@/components/game/FullClipPlayer';
import { TacticalButton } from '@/components/ui/TacticalButton';
import type { GuessResponse } from '@/types';
import './ResultOverlay.css';

interface WinOverlayProps {
  result: GuessResponse;
  audioSrc: string;
  onNext: () => void;
}

export function WinOverlay({ result, audioSrc, onNext }: WinOverlayProps) {
  return (
    <motion.div
      className="result-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className="sweep-line"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}
      />

      <span className="result-overlay__status result-overlay__status--win">
        Misión cumplida
      </span>

      {result.coverImage ? (
        <motion.img
          className="result-overlay__cover"
          src={result.coverImage}
          alt={result.gameTitle ?? ''}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />
      ) : (
        <div className="result-overlay__cover result-overlay__cover--placeholder">?</div>
      )}

      <FullClipPlayer audioSrc={audioSrc} />

      <h2 className="result-overlay__title">{result.gameTitle}</h2>

      {result.released && (
        <p className="result-overlay__meta">{result.released}</p>
      )}

      {result.platforms && result.platforms.length > 0 && (
        <p className="result-overlay__meta">
          {result.platforms.slice(0, 4).join(' · ')}
        </p>
      )}

      <div className="result-overlay__actions">
        <TacticalButton variant="primary" size="large" onClick={onNext}>
          Siguiente nivel
        </TacticalButton>
      </div>
    </motion.div>
  );
}
