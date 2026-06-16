import { useState } from 'react';
import { useGameSearch } from '@/hooks/useGameSearch';
import type { GameSuggestion } from '@/types';
import './GameDetection.css';

interface AdminGameSearchProps {
  selectedGame?: GameSuggestion | null;
  onSelect: (game: GameSuggestion) => void;
}

export function AdminGameSearch({ selectedGame, onSelect }: AdminGameSearchProps) {
  const [query, setQuery] = useState(selectedGame?.name ?? '');
  const { data: suggestions = [], isLoading, isFetching } = useGameSearch(query, query.trim().length >= 2);

  const showResults = query.trim().length >= 2;

  return (
    <div className="game-detection">
      <p className="admin__message" style={{ marginBottom: '1rem' }}>
        Escribe el nombre del juego para buscar en IGDB.
      </p>

      <div className="admin__row">
        <div className="admin__field" style={{ flex: 3 }}>
          <label className="admin__label">Buscar videojuego</label>
          <input
            className="admin__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Super Mario Galaxy 2..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {showResults && (isLoading || isFetching) && (
        <p className="admin__message">Buscando...</p>
      )}
      {showResults && !isLoading && !isFetching && suggestions.length === 0 && (
        <p className="admin__message">Sin resultados</p>
      )}

      {suggestions.length > 0 && (
        <div className="game-detection__suggestions">
          {suggestions.map((game) => (
            <button
              key={game.id}
              type="button"
              className={`game-detection__item${
                selectedGame?.id === game.id ? ' game-detection__item--selected' : ''
              }`}
              onClick={() => onSelect(game)}
            >
              {game.coverImage && (
                <img className="game-detection__cover" src={game.coverImage} alt="" />
              )}
              <div>
                <div className="game-detection__name">{game.name}</div>
                {game.released && (
                  <div className="game-detection__meta">{game.released}</div>
                )}
              </div>
              {selectedGame?.id === game.id && (
                <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
