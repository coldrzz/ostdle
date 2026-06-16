import { useState } from 'react';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { adminApi } from '@/services/adminApi';
import { appendOstToQuery } from '@/utils/youtube';
import type { YouTubeSearchResult } from '@/types';
import './VideoSearch.css';

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface VideoSearchProps {
  onSelect: (video: YouTubeSearchResult) => void;
  selectedUrl?: string;
}

export function VideoSearch({ onSelect, selectedUrl }: VideoSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const searchQuery = appendOstToQuery(query);
      const data = await adminApi.searchYouTube(searchQuery);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    onSelect({
      id: '',
      title: urlInput,
      thumbnail: '',
      url: urlInput,
    });
  };

  return (
    <div>
      <div className="admin__row" style={{ marginBottom: '1rem' }}>
        <div className="admin__field" style={{ flex: 3 }}>
          <label className="admin__label">Buscar en YouTube</label>
          <input
            className="admin__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            placeholder="Super Mario Galaxy 2..."
          />
        </div>
        <TacticalButton onClick={() => void handleSearch()} disabled={isSearching}>
          {isSearching ? 'Buscando...' : 'Buscar'}
        </TacticalButton>
      </div>

      <div className="admin__row">
        <div className="admin__field" style={{ flex: 3 }}>
          <label className="admin__label">O introducir URL directa</label>
          <input
            className="admin__input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <TacticalButton onClick={handleUrlSubmit}>Usar URL</TacticalButton>
      </div>

      {error && <p className="admin__message admin__message--error">{error}</p>}

      {results.length > 0 && (
        <div className="video-search__results">
          {results.map((video) => (
            <button
              key={video.id || video.url}
              className={`video-search__item${
                selectedUrl === video.url ? ' video-search__item--selected' : ''
              }`}
              onClick={() => onSelect(video)}
            >
              {video.thumbnail && (
                <img className="video-search__thumb" src={video.thumbnail} alt="" />
              )}
              <div className="video-search__meta">
                <span className="video-search__title">{video.title}</span>
                <span className="video-search__duration">
                  {formatDuration(video.duration)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
