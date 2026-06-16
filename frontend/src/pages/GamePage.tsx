import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { GameSearchInput } from '@/components/ui/GameSearchInput';
import { LivesIndicator } from '@/components/ui/LivesIndicator';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { WinOverlay } from '@/components/game/WinOverlay';
import { LoseOverlay } from '@/components/game/LoseOverlay';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { gamesApi } from '@/services/gamesApi';
import { getAudioUrl } from '@/services/api';
import { levelsApi } from '@/services/levelsApi';
import { useGameStore } from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import type { GameSuggestion } from '@/types';
import './GamePage.css';

export function GamePage() {
  const { levelNumber: levelParam } = useParams<{ levelNumber?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isDaily = location.pathname.endsWith('/daily');
  const { playSuccess, playError } = useSoundEffects();

  const [guess, setGuess] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameSuggestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const session = useGameStore((s) => s.session);
  const lastGuessResult = useGameStore((s) => s.lastGuessResult);
  const initSession = useGameStore((s) => s.initSession);
  const recordWrongGuess = useGameStore((s) => s.recordWrongGuess);
  const recordSkip = useGameStore((s) => s.recordSkip);
  const recordWin = useGameStore((s) => s.recordWin);
  const reset = useGameStore((s) => s.reset);
  const markSolved = useProgressStore((s) => s.markSolved);

  const levelQuery = useQuery({
    queryKey: ['levels', isDaily ? 'daily' : levelParam],
    queryFn: () => {
      if (isDaily) return levelsApi.getDaily();
      if (levelParam) return levelsApi.getByNumber(parseInt(levelParam, 10));
      throw new Error('Invalid route');
    },
  });

  const level = levelQuery.data?.level;
  const displayLevelNumber = levelQuery.data?.levelNumber;

  useEffect(() => {
    if (level) {
      initSession(level.id);
    }
    return () => reset();
  }, [level?.id, initSession, reset]);

  useEffect(() => {
    if (!level || !session) return;
    if (session.status === 'won') {
      markSolved(level.id, 'won');
    } else if (session.status === 'lost') {
      markSolved(level.id, 'lost');
    }
  }, [level?.id, session?.status, markSolved]);

  const handleGuess = async (gameOverride?: GameSuggestion) => {
    if (!level || !session || session.status !== 'playing' || !guess.trim()) return;

    const game = gameOverride ?? selectedGame;

    setIsSubmitting(true);
    try {
      const result = await gamesApi.guess(
        level.id,
        game?.name ?? guess.trim(),
        game?.id,
      );

      if (result.correct) {
        playSuccess();
        recordWin(result);
      } else {
        playError();
        recordWrongGuess();
        setGuess('');
        setSelectedGame(null);
      }
    } catch {
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!session || session.status !== 'playing') return;
    playError();
    recordSkip();
    setGuess('');
    setSelectedGame(null);
  };

  const handleNext = () => {
    if (displayLevelNumber) {
      navigate(`/play/${displayLevelNumber + 1}`);
    } else {
      navigate('/');
    }
  };

  if (levelQuery.isLoading) {
    return <div className="game-page__loading">Cargando nivel...</div>;
  }

  if (levelQuery.isError || !level || !session) {
    return (
      <div className="game-page__error">
        Nivel no encontrado.{' '}
        <TacticalButton onClick={() => navigate('/')}>Volver</TacticalButton>
      </div>
    );
  }

  if (session.status === 'won' && lastGuessResult) {
    return <WinOverlay result={lastGuessResult} onNext={handleNext} />;
  }

  if (session.status === 'lost') {
    return <LoseOverlay level={level} onContinue={() => navigate('/levels')} />;
  }

  const canGuess = guess.trim().length > 0 && !isSubmitting;
  const canSkip = session.livesRemaining > 0 && !isSubmitting;

  return (
    <div className="game-page">
      <div className="game-page__header">
        <div>
          <div className="game-page__level-info">Operación activa</div>
          <div className="game-page__level-number">
            Nivel #{displayLevelNumber ?? '?'}
          </div>
        </div>
        <LivesIndicator remaining={session.livesRemaining} />
      </div>

      <div className="game-page__center">
        <AudioPlayer
          audioSrc={getAudioUrl(level.audioFile)}
          clipDuration={session.clipDuration}
        />

        <div className="game-page__input-section">
          <GameSearchInput
            value={guess}
            onChange={setGuess}
            onSelect={setSelectedGame}
            onSubmit={handleGuess}
            disabled={isSubmitting}
            placeholder="Introduce el videojuego..."
          />

          <div className="game-page__actions">
            <TacticalButton
              variant="primary"
              onClick={() => void handleGuess()}
              disabled={!canGuess}
            >
              Adivinar
            </TacticalButton>
            <TacticalButton onClick={handleSkip} disabled={!canSkip}>
              Skip
            </TacticalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
