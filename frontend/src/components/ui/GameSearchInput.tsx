import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useGameSearch } from '@/hooks/useGameSearch';
import type { GameSuggestion } from '@/types';
import './GameSearchInput.css';

interface GameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (game: GameSuggestion) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GameSearchInput({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = 'Buscar videojuego...',
  disabled = false,
}: GameSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading } = useGameSearch(value, isOpen);

  const showDropdown = isOpen && value.length >= 2;

  const handleSelect = useCallback(
    (game: GameSuggestion) => {
      onChange(game.name);
      onSelect(game);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange, onSelect],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && suggestions[highlightIndex]) {
          handleSelect(suggestions[highlightIndex]);
        } else {
          onSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="game-search">
      <div className="game-search__input-wrapper">
        <input
          ref={inputRef}
          className="game-search__input"
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        <span className="game-search__icon" aria-hidden="true">
          ⌕
        </span>
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="game-search__dropdown" role="listbox">
          {isLoading && (
            <div className="game-search__loading">Buscando...</div>
          )}
          {!isLoading && suggestions.length === 0 && (
            <div className="game-search__empty">Sin resultados</div>
          )}
          {!isLoading &&
            suggestions.map((game, index) => (
              <button
                key={game.id}
                className={`game-search__option${
                  index === highlightIndex ? ' game-search__option--highlighted' : ''
                }`}
                role="option"
                aria-selected={index === highlightIndex}
                onClick={() => handleSelect(game)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                {game.coverImage ? (
                  <img
                    className="game-search__cover"
                    src={game.coverImage}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="game-search__cover game-search__cover--placeholder">
                    ?
                  </div>
                )}
                <div className="game-search__info">
                  <div className="game-search__name">{game.name}</div>
                  {game.released && (
                    <div className="game-search__meta">{game.released}</div>
                  )}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
