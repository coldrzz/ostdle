import { useCallback, useEffect, useRef, useState } from 'react';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { YouTubePlayer } from '@/components/admin/YouTubePlayer';
import { adminApi } from '@/services/adminApi';
import { extractYouTubeId } from '@/utils/youtube';
import type { YouTubeVideoInfo } from '@/types';
import './TimelineSelector.css';

const CLIP_LENGTH = 10;

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function parseTimeInput(value: string): number {
  const parts = value.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseFloat(value) || 0;
}

function clampStart(start: number, videoDuration: number): number {
  const maxStart = Math.max(0, videoDuration - CLIP_LENGTH);
  return Math.max(0, Math.min(start, maxStart));
}

function computeEnd(start: number, videoDuration: number): number {
  if (videoDuration > 0) {
    return Math.min(start + CLIP_LENGTH, videoDuration);
  }
  return start + CLIP_LENGTH;
}

interface TimelineSelectorProps {
  videoUrl: string;
  onRangeChange: (start: number, end: number) => void;
}

export function TimelineSelector({ videoUrl, onRangeChange }: TimelineSelectorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(CLIP_LENGTH);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewClip, setPreviewClip] = useState(false);
  const [startInput, setStartInput] = useState('00:00');

  const duration = videoInfo?.duration ?? 0;

  const applyStart = useCallback(
    (rawStart: number) => {
      const clamped = clampStart(rawStart, duration);
      const end = computeEnd(clamped, duration);
      setStartTime(clamped);
      setEndTime(end);
      setStartInput(formatTime(clamped));
      setPreviewClip(false);
    },
    [duration],
  );

  useEffect(() => {
    if (!videoUrl) return;

    setLoading(true);
    setError(null);
    setPreviewClip(false);

    void (async () => {
      try {
        const info = await adminApi.getVideoInfo(videoUrl);
        setVideoInfo(info);
        const id = info.id || extractYouTubeId(videoUrl);
        setVideoId(id);
        const start = 0;
        const end = computeEnd(start, info.duration || CLIP_LENGTH);
        setStartTime(start);
        setEndTime(end);
        setStartInput(formatTime(start));
      } catch (e) {
        const id = extractYouTubeId(videoUrl);
        if (id) {
          setVideoId(id);
          setVideoInfo({
            id,
            title: 'Vídeo de YouTube',
            duration: 600,
            thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
            url: videoUrl,
          });
          setStartTime(0);
          setEndTime(CLIP_LENGTH);
          setStartInput('00:00');
        } else {
          setError(e instanceof Error ? e.message : 'Error al cargar vídeo');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [videoUrl]);

  useEffect(() => {
    onRangeChange(startTime, endTime);
  }, [startTime, endTime, onRangeChange]);

  const timeToPercent = useCallback(
    (time: number) => (duration > 0 ? (time / duration) * 100 : 0),
    [duration],
  );

  const percentToTime = useCallback(
    (percent: number) => Math.max(0, Math.min(duration, (percent / 100) * duration)),
    [duration],
  );

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    applyStart(percentToTime(percent));
    setCurrentTime(percentToTime(percent));
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      applyStart(percentToTime(percent));
    },
    [dragging, applyStart, percentToTime],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  if (loading) return <p className="admin__message">Cargando vídeo...</p>;
  if (error) return <p className="admin__message admin__message--error">{error}</p>;
  if (!videoInfo || !videoId) return null;

  return (
    <div className="timeline">
      <p className="timeline__info">
        <strong>{videoInfo.title}</strong> — Duración: {formatTime(duration)}
      </p>

      <YouTubePlayer
        videoId={videoId}
        start={previewClip ? startTime : undefined}
        end={previewClip ? endTime : undefined}
        autoplay={previewClip}
      />

      <div
        ref={trackRef}
        className="timeline__track"
        onClick={handleTrackClick}
        role="slider"
        aria-label="Timeline del vídeo"
      >
        <div
          className="timeline__selection"
          style={{
            left: `${timeToPercent(startTime)}%`,
            width: `${timeToPercent(endTime) - timeToPercent(startTime)}%`,
          }}
        />
        <div
          className="timeline__playhead"
          style={{ left: `${timeToPercent(currentTime)}%` }}
        />
        <div
          className="timeline__handle"
          style={{ left: `${timeToPercent(startTime)}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging(true);
          }}
          role="slider"
          aria-label="Inicio del fragmento"
        />
      </div>

      <div className="timeline__controls">
        <div className="admin__field">
          <label className="admin__label">Desde</label>
          <input
            className="admin__input"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={() => applyStart(parseTimeInput(startInput))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyStart(parseTimeInput(startInput));
              }
            }}
          />
        </div>
        <div className="admin__field">
          <label className="admin__label">Hasta</label>
          <input
            className="admin__input admin__input--readonly"
            value={formatTime(endTime)}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>
        <div className="timeline__time-display">
          {CLIP_LENGTH} seg fijos
        </div>
        <TacticalButton onClick={() => setPreviewClip(true)}>
          Previsualizar fragmento
        </TacticalButton>
      </div>
    </div>
  );
}
