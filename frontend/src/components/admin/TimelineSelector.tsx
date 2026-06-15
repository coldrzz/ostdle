import { useCallback, useEffect, useRef, useState } from 'react';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { adminApi } from '@/services/adminApi';
import type { YouTubeVideoInfo } from '@/types';
import './TimelineSelector.css';

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

interface TimelineSelectorProps {
  videoUrl: string;
  onRangeChange: (start: number, end: number) => void;
}

export function TimelineSelector({ videoUrl, onRangeChange }: TimelineSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(15);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startInput, setStartInput] = useState('00:00');
  const [endInput, setEndInput] = useState('00:15');

  const duration = videoInfo?.duration ?? 0;

  useEffect(() => {
    if (!videoUrl) return;

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const info = await adminApi.getVideoInfo(videoUrl);
        setVideoInfo(info);
        const end = Math.min(15, info.duration);
        setEndTime(end);
        setEndInput(formatTime(end));

        const stream = await adminApi.getStreamUrl(videoUrl);
        setStreamUrl(stream.streamUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar vídeo');
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
    if (!trackRef.current || !videoRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const time = percentToTime(percent);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const time = percentToTime(percent);

      if (dragging === 'start') {
        const newStart = Math.min(time, endTime - 1);
        setStartTime(newStart);
        setStartInput(formatTime(newStart));
      } else {
        const newEnd = Math.max(time, startTime + 1);
        setEndTime(newEnd);
        setEndInput(formatTime(newEnd));
      }
    },
    [dragging, endTime, startTime, percentToTime],
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

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

  const previewSelection = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    void videoRef.current.play();
    const clipDuration = (endTime - startTime) * 1000;
    setTimeout(() => videoRef.current?.pause(), clipDuration);
  };

  if (loading) return <p className="admin__message">Cargando vídeo...</p>;
  if (error) return <p className="admin__message admin__message--error">{error}</p>;
  if (!videoInfo) return null;

  return (
    <div className="timeline">
      <p className="timeline__info">
        <strong>{videoInfo.title}</strong> — Duración: {formatTime(duration)}
      </p>

      {streamUrl && (
        <video
          ref={videoRef}
          className="timeline__video"
          src={streamUrl}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
          controls
        />
      )}

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
            setDragging('start');
          }}
          role="slider"
          aria-label="Inicio del fragmento"
        />
        <div
          className="timeline__handle"
          style={{ left: `${timeToPercent(endTime)}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging('end');
          }}
          role="slider"
          aria-label="Fin del fragmento"
        />
      </div>

      <div className="timeline__controls">
        <div className="admin__field">
          <label className="admin__label">Desde</label>
          <input
            className="admin__input"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={() => {
              const t = parseTimeInput(startInput);
              if (t < endTime) {
                setStartTime(t);
                setStartInput(formatTime(t));
              }
            }}
          />
        </div>
        <div className="admin__field">
          <label className="admin__label">Hasta</label>
          <input
            className="admin__input"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onBlur={() => {
              const t = parseTimeInput(endInput);
              if (t > startTime && t <= duration) {
                setEndTime(t);
                setEndInput(formatTime(t));
              }
            }}
          />
        </div>
        <div className="timeline__time-display">
          {formatTime(endTime - startTime)} seleccionados
        </div>
        <TacticalButton onClick={previewSelection}>Previsualizar</TacticalButton>
      </div>
    </div>
  );
}
