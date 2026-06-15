import { motion } from 'framer-motion';
import { INITIAL_LIVES } from '@/types';
import './LivesIndicator.css';

interface LivesIndicatorProps {
  remaining: number;
  total?: number;
}

export function LivesIndicator({ remaining, total = INITIAL_LIVES }: LivesIndicatorProps) {
  return (
    <div className="lives" aria-label={`${remaining} de ${total} vidas`}>
      <span className="lives__label">Vidas</span>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i < remaining;
        return (
          <motion.span
            key={i}
            className={`lives__indicator${isActive ? '' : ' lives__indicator--lost'}`}
            initial={false}
            animate={{
              scale: isActive ? 1 : 0.8,
              opacity: isActive ? 1 : 0.5,
            }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
