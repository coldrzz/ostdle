import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { AdminLevelList } from '@/components/admin/AdminLevelList';
import { GameDetection } from '@/components/admin/GameDetection';
import { TimelineSelector } from '@/components/admin/TimelineSelector';
import { VideoSearch } from '@/components/admin/VideoSearch';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { adminApi } from '@/services/adminApi';
import { levelsApi } from '@/services/levelsApi';
import type { GameSuggestion, YouTubeSearchResult } from '@/types';
import './AdminPage.css';

export function AdminPage() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  return <AdminPageContent />;
}

function AdminPageContent() {
  const queryClient = useQueryClient();
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.getAll,
  });

  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(15);
  const [selectedGame, setSelectedGame] = useState<GameSuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleVideoSelect = (video: YouTubeSearchResult) => {
    setSelectedVideo(video);
    setVideoTitle(video.title);
    setSelectedGame(null);
    setMessage(null);
  };

  const handleRangeChange = useCallback((start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  }, []);

  const handleGenerate = async () => {
    if (!selectedVideo || !selectedGame) {
      setMessage({ type: 'error', text: 'Selecciona un vídeo y un juego' });
      return;
    }

    setIsGenerating(true);
    setMessage(null);

    try {
      await adminApi.generateLevel({
        videoUrl: selectedVideo.url,
        startTime,
        endTime,
        gameTitle: selectedGame.name,
        gameId: String(selectedGame.id),
        coverImage: selectedGame.coverImage,
      });

      setMessage({ type: 'success', text: 'Nivel generado correctamente' });
      void queryClient.invalidateQueries({ queryKey: ['levels'] });
      setSelectedVideo(null);
      setSelectedGame(null);
      setVideoTitle('');
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al generar nivel. ¿Está el servicio Python en marcha?',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="admin">
      <h1 className="admin__title">
        Panel de administración
        <span className="admin__badge">Dev only</span>
      </h1>

      <section className="admin__section">
        <h2 className="admin__section-title">1 — Buscar vídeo</h2>
        <VideoSearch
          onSelect={handleVideoSelect}
          selectedUrl={selectedVideo?.url}
        />
      </section>

      {selectedVideo && (
        <>
          <section className="admin__section">
            <h2 className="admin__section-title">2 — Seleccionar fragmento</h2>
            <TimelineSelector
              videoUrl={selectedVideo.url}
              onRangeChange={handleRangeChange}
            />
          </section>

          <section className="admin__section">
            <h2 className="admin__section-title">3 — Detectar videojuego</h2>
            <GameDetection
              videoTitle={videoTitle}
              onSelect={setSelectedGame}
              selectedGame={selectedGame}
            />
          </section>

          <section className="admin__section">
            <h2 className="admin__section-title">4 — Generar nivel</h2>
            {selectedGame && (
              <p className="admin__message">
                Juego seleccionado: <strong>{selectedGame.name}</strong>
                {' — '}
                Fragmento: {Math.floor(startTime / 60)}:{String(Math.floor(startTime % 60)).padStart(2, '0')}
                {' → '}
                {Math.floor(endTime / 60)}:{String(Math.floor(endTime % 60)).padStart(2, '0')}
              </p>
            )}
            <TacticalButton
              variant="primary"
              size="large"
              onClick={() => void handleGenerate()}
              disabled={isGenerating || !selectedGame}
            >
              {isGenerating ? 'Generando...' : 'Generar nivel'}
            </TacticalButton>
            {message && (
              <p className={`admin__message admin__message--${message.type}`}>
                {message.text}
              </p>
            )}
          </section>
        </>
      )}

      <section className="admin__section">
        <h2 className="admin__section-title">Gestionar niveles</h2>
        <AdminLevelList levels={levels} />
      </section>
    </div>
  );
}
