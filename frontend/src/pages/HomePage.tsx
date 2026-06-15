import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { levelsApi } from '@/services/levelsApi';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const { data: daily } = useQuery({
    queryKey: ['levels', 'daily'],
    queryFn: levelsApi.getDaily,
  });

  return (
    <motion.div
      className="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="home__header">
        <p className="home__subtitle">Operación — Audio Recon</p>
        <h1 className="home__title">Game OST Guesser</h1>
        <p className="home__description">
          Escucha fragmentos de bandas sonoras y adivina a qué videojuego pertenecen.
          Cada error revela más de la pista. ¿Cuántos necesitas?
        </p>
      </div>

      <div className="home__actions">
        <TacticalButton
          variant="primary"
          size="large"
          onClick={() => navigate('/play/daily')}
        >
          Jugar nivel del día
        </TacticalButton>
        <TacticalButton
          size="large"
          onClick={() => navigate('/levels')}
        >
          Ver niveles anteriores
        </TacticalButton>
      </div>

      {daily && (
        <div className="home__daily-info">
          <div className="home__daily-label">Nivel del día</div>
          <div className="home__daily-number">
            Nivel #{daily.levelNumber}
          </div>
        </div>
      )}
    </motion.div>
  );
}
