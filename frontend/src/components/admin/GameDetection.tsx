import { useEffect, useState } from 'react';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { adminApi } from '@/services/adminApi';
import type { GameSuggestion } from '@/types';
import './GameDetection.css';

interface GameDetectionProps {
  videoTitle: string;
  onSelect: (game: GameSuggestion) => void;
  selectedGame?: GameSuggestion | null;
}

export function GameDetection({ videoTitle, onSelect, selectedGame }: GameDetectionProps) {
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [cleanedTitle, setCleanedTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async () => {
    if (!videoTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.detectGame(videoTitle);
      setSuggestions(result.suggestions);
      setCleanedTitle(result.cleanedTitle);
      if (result.suggestions.length > 0) {
        onSelect(result.suggestions[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al detectar juego');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoTitle) {
      void detect();
    }
  }, [videoTitle]);

  return (
    <div className="game-detection">
      <div className="admin__row">
        <TacticalButton onClick={() => void detect()} disabled={loading}>
          {loading ? 'Detectando...' : 'Detectar juego'}
        </TacticalButton>
        {cleanedTitle && (
          <span className="game-detection__cleaned">
            Título limpio: &quot;{cleanedTitle}&quot;
          </span>
        )}
      </div>

      {error && <p className="admin__message admin__message--error">{error}</p>}

      {suggestions.length > 0 && (
        <div className="game-detection__suggestions">
          {suggestions.map((game) => (
            <button
              key={game.id}
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
