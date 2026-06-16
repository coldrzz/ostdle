import { buildYouTubeEmbedUrl } from '@/utils/youtube';
import './YouTubePlayer.css';

interface YouTubePlayerProps {
  videoId: string;
  start?: number;
  end?: number;
  autoplay?: boolean;
}

export function YouTubePlayer({ videoId, start, end, autoplay }: YouTubePlayerProps) {
  const src = buildYouTubeEmbedUrl(videoId, { start, end, autoplay });

  return (
    <div className="youtube-player">
      <iframe
        src={src}
        title="YouTube preview"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
