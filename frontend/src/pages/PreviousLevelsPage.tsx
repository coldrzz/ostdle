import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { levelsApi } from '@/services/levelsApi';
import './PreviousLevelsPage.css';

export function PreviousLevelsPage() {
  const navigate = useNavigate();
  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.getAll,
  });

  if (isLoading) {
    return <div className="levels-list-page__empty">Cargando niveles...</div>;
  }

  return (
    <motion.div
      className="levels-list-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="levels-list-page__title">Niveles anteriores</h1>

      {levels.length === 0 ? (
        <div className="levels-list-page__empty">No hay niveles disponibles</div>
      ) : (
        <div className="levels-list-page__grid">
          {levels.map((level, index) => (
            <button
              key={level.id}
              className="level-card"
              onClick={() => navigate(`/play/${index + 1}`)}
            >
              {level.coverImage ? (
                <img
                  className="level-card__cover"
                  src={level.coverImage}
                  alt={level.gameTitle}
                  loading="lazy"
                />
              ) : (
                <div className="level-card__cover level-card__cover--placeholder">
                  ?
                </div>
              )}
              <div className="level-card__info">
                <div className="level-card__number">Nivel #{index + 1}</div>
                <div className="level-card__title">{level.gameTitle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
