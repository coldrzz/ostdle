import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GuessHistory } from '@/components/game/GuessHistory';
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
import { sessionToAttempt, useGameStore } from '@/store/gameStore';
import { useProgressStore } from '@/store/progressStore';
import type { GameSuggestion } from '@/types';
import './GamePage.css';

function clearGuessInput(
  setGuess: (value: string) => void,
  setSelectedGame: (game: GameSuggestion | null) => void,
) {
  setGuess('');
  setSelectedGame(null);
}

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
  const getAttempt = useProgressStore((s) => s.getAttempt);
  const saveAttempt = useProgressStore((s) => s.saveAttempt);

  const levelQuery = useQuery({
    queryKey: ['levels', isDaily ? 'daily' : levelParam],
    queryFn: () => {
      if (isDaily) return levelsApi.getDaily();
      if (levelParam) return levelsApi.getByNumber(parseInt(levelParam, 10));
      throw new Error('Invalid route');
    },
  });

  const levelsListQuery = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.getAll,
    enabled: !isDaily,
  });

  const level = levelQuery.data?.level;
  const displayLevelNumber = levelQuery.data?.levelNumber;
  const totalLevels = levelsListQuery.data?.length ?? 0;

  useEffect(() => {
    if (!level) return;

    clearGuessInput(setGuess, setSelectedGame);

    if (isDaily) {
      initSession(level.id);
    } else {
      initSession(level.id, getAttempt(level.id));
    }

    return () => reset();
  }, [level?.id, isDaily, initSession, reset, getAttempt]);

  useEffect(() => {
    if (!level || !session || isDaily) return;
    saveAttempt(level.id, sessionToAttempt(session, lastGuessResult));
  }, [level?.id, session, lastGuessResult, isDaily, saveAttempt]);

  const handleGuess = async (gameOverride?: GameSuggestion) => {
    if (!level || !session || session.status !== 'playing' || !guess.trim()) return;

    const game = gameOverride ?? selectedGame;
    const guessName = game?.name ?? guess.trim();

    setIsSubmitting(true);
    try {
      const result = await gamesApi.guess(
        level.id,
        guessName,
        game?.id,
      );

      if (result.correct) {
        playSuccess();
        recordWin(result);
      } else {
        playError();
        recordWrongGuess(guessName);
        clearGuessInput(setGuess, setSelectedGame);
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
    clearGuessInput(setGuess, setSelectedGame);
  };

  const handleNext = () => {
    clearGuessInput(setGuess, setSelectedGame);
    if (displayLevelNumber && displayLevelNumber < totalLevels) {
      navigate(`/play/${displayLevelNumber + 1}`);
    } else {
      navigate('/levels');
    }
  };

  const handlePrevious = () => {
    if (displayLevelNumber && displayLevelNumber > 1) {
      clearGuessInput(setGuess, setSelectedGame);
      navigate(`/play/${displayLevelNumber - 1}`);
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
    return (
      <WinOverlay
        result={lastGuessResult}
        audioSrc={getAudioUrl(level.audioFile)}
        onNext={handleNext}
      />
    );
  }

  if (session.status === 'lost') {
    return (
      <LoseOverlay
        level={level}
        audioSrc={getAudioUrl(level.audioFile)}
        onContinue={() => navigate('/levels')}
      />
    );
  }

  const canGuess = guess.trim().length > 0 && !isSubmitting;
  const canSkip = session.livesRemaining > 0 && !isSubmitting;
  const canGoPrevious = !isDaily && displayLevelNumber !== undefined && displayLevelNumber > 1;
  const canGoNext =
    !isDaily && displayLevelNumber !== undefined && displayLevelNumber < totalLevels;

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
        <div className="game-page__play-row">
          <AudioPlayer
            audioSrc={getAudioUrl(level.audioFile)}
            clipDuration={session.clipDuration}
          />
          <GuessHistory guesses={session.wrongGuessHistory} />
        </div>

        <div className="game-page__input-section">
          <GameSearchInput
            value={guess}
            onChange={setGuess}
            onSelect={setSelectedGame}
            onSubmit={handleGuess}
            disabled={isSubmitting}
            placeholder="Escribe el nombre del juego..."
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

          {!isDaily && (
            <div className="game-page__nav-actions">
              <TacticalButton onClick={handlePrevious} disabled={!canGoPrevious}>
                Anterior
              </TacticalButton>
              <TacticalButton onClick={handleNext} disabled={!canGoNext}>
                Siguiente
              </TacticalButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
