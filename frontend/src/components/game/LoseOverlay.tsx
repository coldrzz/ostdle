import { motion } from 'framer-motion';
import { TacticalButton } from '@/components/ui/TacticalButton';
import type { Level } from '@/types';
import './ResultOverlay.css';

interface LoseOverlayProps {
  level: Level;
  onContinue: () => void;
}

export function LoseOverlay({ level, onContinue }: LoseOverlayProps) {
  return (
    <motion.div
      className="result-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <span className="result-overlay__status result-overlay__status--lose">
        Misión fallida
      </span>

      {level.coverImage ? (
        <motion.img
          className="result-overlay__cover"
          src={level.coverImage}
          alt={level.gameTitle}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />
      ) : (
        <div className="result-overlay__cover result-overlay__cover--placeholder">?</div>
      )}

      <h2 className="result-overlay__title">{level.gameTitle}</h2>

      <p className="result-overlay__meta">La respuesta correcta era:</p>

      <div className="result-overlay__actions">
        <TacticalButton size="large" onClick={onContinue}>
          Continuar
        </TacticalButton>
      </div>
    </motion.div>
  );
}
