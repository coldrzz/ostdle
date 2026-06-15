"""YouTube and audio processing utilities using yt-dlp and ffmpeg."""

import os
import re
import subprocess
import uuid
from typing import Any

import yt_dlp


def get_audio_output_dir() -> str:
    return os.environ.get("AUDIO_OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "..", "assets", "audio"))


def ensure_audio_dir() -> str:
    audio_dir = os.path.abspath(get_audio_output_dir())
    os.makedirs(audio_dir, exist_ok=True)
    return audio_dir


def _base_ydl_opts() -> dict[str, Any]:
    return {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }


def search_youtube(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    """Search YouTube for videos matching the query."""
    opts = {
        **_base_ydl_opts(),
        "extract_flat": True,
        "default_search": f"ytsearch{max_results}",
    }

    with yt_dlp.YoutubeDL(opts) as ydl:
        result = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)

    if not result or "entries" not in result:
        return []

    videos = []
    for entry in result["entries"]:
        if not entry:
            continue
        video_id = entry.get("id", "")
        videos.append({
            "id": video_id,
            "title": entry.get("title", "Unknown"),
            "thumbnail": entry.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
            "duration": entry.get("duration"),
            "url": f"https://www.youtube.com/watch?v={video_id}",
        })

    return videos


def get_video_info(url: str) -> dict[str, Any]:
    """Get detailed information about a YouTube video."""
    opts = {**_base_ydl_opts()}

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        raise ValueError("Could not extract video information")

    video_id = info.get("id", "")
    return {
        "id": video_id,
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        "url": url,
    }


def get_stream_url(url: str) -> str:
    """Get a direct stream URL for private admin playback."""
    opts = {
        **_base_ydl_opts(),
        "format": "best[height<=720]/best",
    }

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        raise ValueError("Could not extract stream URL")

    # Return the direct URL for the selected format
    if "url" in info:
        return info["url"]

    formats = info.get("formats", [])
    for fmt in reversed(formats):
        if fmt.get("url") and fmt.get("vcodec") != "none":
            return fmt["url"]

    raise ValueError("No streamable format found")


def extract_audio_fragment(
    video_url: str,
    start_time: float,
    end_time: float,
) -> str:
    """
    Download and extract only the selected audio fragment.
    Returns the filename of the saved audio file.
    """
    if end_time <= start_time:
        raise ValueError("endTime must be greater than startTime")

    duration = end_time - start_time
    audio_dir = ensure_audio_dir()
    temp_id = uuid.uuid4().hex[:12]
    temp_audio = os.path.join(audio_dir, f"temp_{temp_id}.webm")
    output_filename = f"level_{temp_id}.mp3"
    output_path = os.path.join(audio_dir, output_filename)

    # Download audio only with yt-dlp
    ydl_opts = {
        **_base_ydl_opts(),
        "format": "bestaudio/best",
        "outtmpl": temp_audio.replace(".webm", ".%(ext)s"),
        "postprocessors": [],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])

    # Find the downloaded temp file (extension may vary)
    downloaded_file = None
    for ext in [".webm", ".m4a", ".opus", ".mp3", ".ogg"]:
        candidate = temp_audio.replace(".webm", ext)
        if os.path.exists(candidate):
            downloaded_file = candidate
            break

    if not downloaded_file:
        # Try glob pattern
        base = temp_audio.replace(".webm", "")
        for f in os.listdir(audio_dir):
            if f.startswith(f"temp_{temp_id}"):
                downloaded_file = os.path.join(audio_dir, f)
                break

    if not downloaded_file or not os.path.exists(downloaded_file):
        raise RuntimeError("Failed to download audio from video")

    try:
        # Use ffmpeg to cut the exact fragment and convert to mp3
        cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(start_time),
            "-i", downloaded_file,
            "-t", str(duration),
            "-vn",
            "-acodec", "libmp3lame",
            "-ab", "192k",
            "-ar", "44100",
            output_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {result.stderr}")

        if not os.path.exists(output_path):
            raise RuntimeError("Output audio file was not created")

        return output_filename

    finally:
        # Clean up temp file
        if downloaded_file and os.path.exists(downloaded_file):
            try:
                os.remove(downloaded_file)
            except OSError:
                pass


def parse_time_string(time_str: str) -> float:
    """Parse time string like '01:23' or '1:02:03' to seconds."""
    parts = time_str.strip().split(":")
    parts = [float(p) for p in parts]

    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]

    raise ValueError(f"Invalid time format: {time_str}")


def format_time(seconds: float) -> str:
    """Format seconds as MM:SS or HH:MM:SS."""
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
