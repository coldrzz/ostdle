import { useState, type KeyboardEvent } from 'react';
import { gamesApi } from '@/services/gamesApi';
import type { GameSuggestion } from '@/types';
import './GameDetection.css';

interface AdminGameSearchProps {
  selectedGame?: GameSuggestion | null;
  onSelect: (game: GameSuggestion) => void;
}

export function AdminGameSearch({ selectedGame, onSelect }: AdminGameSearchProps) {
  const [query, setQuery] = useState(selectedGame?.name ?? '');
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await gamesApi.search(trimmed);
      setSuggestions(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  };

  return (
    <div className="game-detection">
      <p className="admin__message" style={{ marginBottom: '1rem' }}>
        Escribe el nombre del juego y pulsa <strong>Enter</strong> para buscar en RAWG.
      </p>

      <div className="admin__row">
        <div className="admin__field" style={{ flex: 3 }}>
          <label className="admin__label">Buscar videojuego</label>
          <input
            className="admin__input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Super Mario Galaxy 2..."
          />
        </div>
      </div>

      {isLoading && <p className="admin__message">Buscando...</p>}
      {error && <p className="admin__message admin__message--error">{error}</p>}
      {hasSearched && !isLoading && suggestions.length === 0 && !error && (
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
