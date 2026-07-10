import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { levelsApi } from '@/services/levelsApi';
import { useProgressStore } from '@/store/progressStore';
import './PreviousLevelsPage.css';

export function PreviousLevelsPage() {
  const navigate = useNavigate();
  const getOutcome = useProgressStore((s) => s.getOutcome);
  const isCompleted = useProgressStore((s) => s.isCompleted);

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
      <header className="levels-list-page__header">
        <h1 className="levels-list-page__title">Niveles anteriores</h1>
        <p className="levels-list-page__subtitle">Archivo de misiones</p>
      </header>

      {levels.length === 0 ? (
        <div className="levels-list-page__empty">No hay niveles disponibles</div>
      ) : (
        <div className="levels-list-page__scroll">
          <div className="levels-list-page__grid">
            {levels.map((level, index) => {
              const levelNumber = index + 1;
              const completed = isCompleted(level.id);
              const outcome = getOutcome(level.id);

              return (
                <button
                  key={level.id}
                  type="button"
                  className={[
                    'level-entry',
                    completed && outcome ? `level-entry--${outcome}` : 'level-entry--unsolved',
                  ].join(' ')}
                  onClick={() => navigate(`/play/${levelNumber}`)}
                >
                  <div className="level-entry__icon" aria-hidden="true">
                    {completed && level.coverImage ? (
                      <img
                        className="level-entry__cover"
                        src={level.coverImage}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="level-entry__icon-placeholder" />
                    )}
                  </div>
                  <div className="level-entry__label">
                    {completed
                      ? `Nivel ${levelNumber}: ${level.gameTitle}`
                      : `Nivel ${levelNumber}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
