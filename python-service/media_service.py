"""YouTube and audio processing utilities using yt-dlp and ffmpeg."""

import glob
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import uuid
from typing import Any

import yt_dlp

CLIP_LENGTH_SECONDS = 10
FORMAT_AUDIO = "ba/b/bestaudio/best/worst"

# web first — works best with the YouTube JS challenge solver (EJS)
YOUTUBE_CLIENTS = [
    ["web"],
    ["mweb"],
    ["android"],
    ["ios"],
]


class _QuietLogger:
    def debug(self, msg: str) -> None:
        pass

    def info(self, msg: str) -> None:
        pass

    def warning(self, msg: str) -> None:
        pass

    def error(self, msg: str) -> None:
        pass


_QUIET_LOGGER = _QuietLogger()


def _strip_ansi(text: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*m", "", text)


def _is_browser_cookie_error(exc: BaseException) -> bool:
    msg = _strip_ansi(str(exc)).lower()
    return "cookie" in msg and (
        "could not copy" in msg
        or "cookie database" in msg
        or "failed to load cookies" in msg
    )


def _friendly_browser_cookie_error() -> str:
    browser = os.environ.get("YTDLP_COOKIES_FROM_BROWSER", "chrome")
    return (
        f"No se pudieron leer las cookies de {browser}. "
        "Cierra el navegador por completo y vuelve a intentar, "
        "o exporta las cookies a un archivo .txt y define YTDLP_COOKIES_FILE en .env"
    )


def _friendly_ejs_error() -> str:
    return (
        "YouTube requiere Node.js para descargar audio. "
        "Instala Node.js 22+ y en python-service ejecuta: pip install -U \"yt-dlp[default]\". "
        "Luego reinicia el servicio Python."
    )


def _js_runtime_opts() -> dict[str, Any]:
    """Enable Node (or Deno) so yt-dlp can solve YouTube JS challenges."""
    configured = os.environ.get("YTDLP_JS_RUNTIME", "node").strip().lower()
    if configured in ("none", "off"):
        return {}

    raw = os.environ.get("YTDLP_JS_RUNTIME", "node").strip()
    if ":" in raw:
        runtime, path = raw.split(":", 1)
        return {"js_runtimes": {runtime.strip().lower(): {"path": path.strip()}}}

    if configured == "node":
        node_path = shutil.which("node")
        if node_path:
            return {"js_runtimes": {"node": {"path": node_path}}}
        return {}

    if configured == "deno":
        return {"js_runtimes": {"deno": {}}}

    return {"js_runtimes": {configured: {}}}


def _js_runtime_cli_args() -> list[str]:
    configured = os.environ.get("YTDLP_JS_RUNTIME", "node").strip()
    if configured.lower() in ("none", "off"):
        return []
    if ":" in configured:
        return ["--js-runtimes", configured]
    if configured.lower() == "node":
        node_path = shutil.which("node")
        if node_path:
            return ["--js-runtimes", f"node:{node_path}"]
        return ["--js-runtimes", "node"]
    return ["--js-runtimes", configured]


def _resolve_cookies_file(path: str) -> str:
    if os.path.isabs(path):
        return path
    service_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(service_dir, path))


def get_audio_output_dir() -> str:
    return os.environ.get("AUDIO_OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "..", "assets", "audio"))


def ensure_audio_dir() -> str:
    audio_dir = os.path.abspath(get_audio_output_dir())
    os.makedirs(audio_dir, exist_ok=True)
    return audio_dir


def _find_ffmpeg() -> str:
    """Resolve ffmpeg binary — required for audio extraction."""
    custom = os.environ.get("FFMPEG_LOCATION", "").strip()
    if custom:
        if os.path.isfile(custom):
            return custom
        candidate = os.path.join(custom, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if os.path.isfile(candidate):
            return candidate

    found = shutil.which("ffmpeg")
    if found:
        return found

    if os.name == "nt":
        for candidate in [
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe"),
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        ]:
            if os.path.isfile(candidate):
                return candidate

        winget_matches = glob.glob(
            os.path.expandvars(
                r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\**\ffmpeg.exe"
            ),
            recursive=True,
        )
        if winget_matches:
            return winget_matches[0]

    raise RuntimeError(
        "ffmpeg no está instalado o no está en el PATH. "
        "Instálalo con: winget install Gyan.FFmpeg "
        "y reinicia la terminal. También puedes definir FFMPEG_LOCATION en .env"
    )


def _ffmpeg_dir() -> str:
    return os.path.dirname(os.path.abspath(_find_ffmpeg()))


def _cookie_opts() -> dict[str, Any]:
    opts: dict[str, Any] = {}
    cookies_file = os.environ.get("YTDLP_COOKIES_FILE", "").strip()
    cookies_browser = os.environ.get("YTDLP_COOKIES_FROM_BROWSER", "").strip()

    if cookies_file:
        resolved = _resolve_cookies_file(cookies_file)
        if os.path.isfile(resolved):
            opts["cookiefile"] = resolved
    elif cookies_browser:
        if ":" in cookies_browser:
            browser, profile = cookies_browser.split(":", 1)
            opts["cookiesfrombrowser"] = (browser.strip(), profile.strip(), None, None)
        else:
            opts["cookiesfrombrowser"] = (cookies_browser, None, None, None)

    return opts


def _ffmpeg_dir_optional() -> str | None:
    try:
        return _ffmpeg_dir()
    except RuntimeError:
        return None


def _base_opts(player_client: list[str] | None = None, use_cookies: bool = False) -> dict[str, Any]:
    opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
        "logger": _QUIET_LOGGER,
    }
    if use_cookies:
        opts.update(_cookie_opts())
    opts.update(_js_runtime_opts())
    ffmpeg_dir = _ffmpeg_dir_optional()
    if ffmpeg_dir:
        opts["ffmpeg_location"] = ffmpeg_dir
    if player_client:
        opts["extractor_args"] = {"youtube": {"player_client": player_client}}
    return opts


def _metadata_opts(player_client: list[str], use_cookies: bool = False) -> dict[str, Any]:
    return {**_base_opts(player_client, use_cookies=use_cookies), "skip_download": True}


def _download_opts_for_client(
    player_client: list[str],
    format_str: str | None = None,
    use_cookies: bool = False,
) -> dict[str, Any]:
    opts: dict[str, Any] = {
        **_base_opts(player_client, use_cookies=use_cookies),
        "ignore_no_formats_error": True,
    }
    if format_str:
        opts["format"] = format_str
    return opts


def _cleanup_temp_files(audio_dir: str, temp_id: str) -> None:
    for f in os.listdir(audio_dir):
        if f.startswith(f"temp_{temp_id}"):
            try:
                os.remove(os.path.join(audio_dir, f))
            except OSError:
                pass


def _make_download_ranges(start_time: float, end_time: float):
    def _ranges(_info: dict[str, Any], _ydl: Any) -> list[dict[str, float]]:
        return [{"start_time": start_time, "end_time": end_time}]

    return _ranges


def _move_to_output(src: str, output_path: str) -> None:
    if os.path.abspath(src) == os.path.abspath(output_path):
        return
    if os.path.exists(output_path):
        os.remove(output_path)
    os.rename(src, output_path)


def append_ost_to_query(query: str) -> str:
    query = query.strip()
    if not query:
        return query
    if re.search(r"\bost\b", query, re.IGNORECASE):
        return query
    if re.search(r"\bsoundtrack\b", query, re.IGNORECASE):
        return query
    return f"{query} ost"


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
        r"youtube\.com/shorts/([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _build_video_info(info: dict[str, Any], url: str) -> dict[str, Any]:
    video_id = info.get("id", "") or extract_video_id(url) or ""
    return {
        "id": video_id,
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration") or 0,
        "thumbnail": info.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        "url": url,
        "embedUrl": f"https://www.youtube.com/embed/{video_id}" if video_id else None,
    }


def _oembed_fallback(video_id: str, url: str) -> dict[str, Any]:
    title = "Unknown"
    thumbnail = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"

    try:
        oembed_url = (
            f"https://www.youtube.com/oembed"
            f"?url=https://www.youtube.com/watch?v={video_id}&format=json"
        )
        req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        title = data.get("title", title)
        thumbnail = data.get("thumbnail_url", thumbnail)
    except Exception:
        pass

    return {
        "id": video_id,
        "title": title,
        "duration": 0,
        "thumbnail": thumbnail,
        "url": url,
        "embedUrl": f"https://www.youtube.com/embed/{video_id}",
    }


def _fetch_duration_only(url: str) -> int | None:
    """Lightweight duration lookup for search results."""
    for client in YOUTUBE_CLIENTS:
        try:
            with yt_dlp.YoutubeDL(_metadata_opts(client)) as ydl:
                info = ydl.extract_info(url, download=False)
            if info and info.get("duration"):
                return int(info["duration"])
        except Exception:
            continue
    return None


def search_youtube(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    search_query = append_ost_to_query(query)
    opts = {**_metadata_opts(["web"], use_cookies=False), "extract_flat": True}

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            result = ydl.extract_info(f"ytsearch{max_results}:{search_query}", download=False)
    except Exception as e:
        raise ValueError(_strip_ansi(str(e))) from e

    if not result or "entries" not in result:
        return []

    videos = []
    for entry in result["entries"]:
        if not entry:
            continue
        video_id = entry.get("id", "")
        url = f"https://www.youtube.com/watch?v={video_id}"
        duration = entry.get("duration")

        if not duration:
            duration = _fetch_duration_only(url)

        videos.append({
            "id": video_id,
            "title": entry.get("title", "Unknown"),
            "thumbnail": entry.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
            "duration": duration,
            "url": url,
        })

    return videos


def get_video_info(url: str) -> dict[str, Any]:
    video_id = extract_video_id(url)
    last_error: Exception | None = None

    for client in YOUTUBE_CLIENTS:
        try:
            with yt_dlp.YoutubeDL(_metadata_opts(client)) as ydl:
                info = ydl.extract_info(url, download=False)
            if info and info.get("title"):
                return _build_video_info(info, url)
        except Exception as e:
            last_error = e
            continue

    if video_id:
        return _oembed_fallback(video_id, url)

    raise ValueError(str(last_error) if last_error else "Could not extract video information")


def get_stream_url(url: str) -> str:
    """Resolve a direct media URL for admin stream redirect."""
    last_error: Exception | None = None
    format_chain = "b/bv*+ba/ba/b/worst"

    for client in YOUTUBE_CLIENTS:
        try:
            opts = _download_opts_for_client(client, format_chain, use_cookies=False)
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)

            if not info:
                continue

            if info.get("url"):
                return str(info["url"])

            for fmt in info.get("requested_formats") or []:
                if fmt.get("url"):
                    return str(fmt["url"])

            audio_fmt = _pick_best_audio_format(info.get("formats") or [])
            if audio_fmt and audio_fmt.get("url"):
                return str(audio_fmt["url"])

            for fmt in info.get("formats") or []:
                if fmt.get("url") and fmt.get("vcodec", "none") != "none":
                    return str(fmt["url"])
        except Exception as e:
            last_error = e
            continue

    if _cookie_opts():
        for client in YOUTUBE_CLIENTS:
            try:
                opts = _download_opts_for_client(client, format_chain, use_cookies=True)
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)

                if not info:
                    continue

                if info.get("url"):
                    return str(info["url"])

                for fmt in info.get("requested_formats") or []:
                    if fmt.get("url"):
                        return str(fmt["url"])

                audio_fmt = _pick_best_audio_format(info.get("formats") or [])
                if audio_fmt and audio_fmt.get("url"):
                    return str(audio_fmt["url"])
            except Exception as e:
                if _is_browser_cookie_error(e):
                    raise ValueError(_friendly_browser_cookie_error()) from e
                last_error = e
                continue

    raise ValueError(_strip_ansi(str(last_error)) if last_error else "No stream URL available")


def extract_audio_fragment(
    video_url: str,
    start_time: float,
    end_time: float,
) -> str:
    """Extract only the selected audio fragment — never keeps the full track."""
    if end_time <= start_time:
        raise ValueError("endTime must be greater than startTime")

    if not _cookie_opts():
        raise RuntimeError(
            "Falta YTDLP_COOKIES_FROM_BROWSER en .env (ej: chrome). "
            "Reinicia el servicio Python tras añadirlo."
        )

    ffmpeg_bin = _find_ffmpeg()
    duration = end_time - start_time
    audio_dir = ensure_audio_dir()
    temp_id = uuid.uuid4().hex[:12]
    temp_base = os.path.join(audio_dir, f"temp_{temp_id}")
    output_filename = f"level_{temp_id}.mp3"
    output_path = os.path.join(audio_dir, output_filename)
    last_error: Exception | None = None

    print(f"[Extract] Fragmento {start_time:.1f}s -> {end_time:.1f}s ({duration:.1f}s)")

    # Strategy 1: stream solo el fragmento vía ffmpeg (sin descargar el vídeo/audio completo)
    print("[Extract] Intento 1: recorte directo por URL de audio...")
    for client in YOUTUBE_CLIENTS:
        try:
            with yt_dlp.YoutubeDL(_metadata_opts(client, use_cookies=True)) as ydl:
                info = ydl.extract_info(video_url, download=False)

            if not info:
                continue

            audio_fmt = _pick_best_audio_format(info.get("formats") or [])
            if audio_fmt and audio_fmt.get("url"):
                _ffmpeg_extract_segment(
                    ffmpeg_bin,
                    audio_fmt["url"],
                    start_time,
                    duration,
                    output_path,
                    audio_fmt.get("http_headers"),
                )
                if os.path.exists(output_path):
                    print(f"[Extract] OK - {output_filename} (recorte directo)")
                    return output_filename
        except Exception as e:
            if _is_browser_cookie_error(e):
                raise RuntimeError(_friendly_browser_cookie_error()) from e
            last_error = e
            continue

    # Strategy 2: yt-dlp descarga SOLO el tramo seleccionado (download_ranges)
    print("[Extract] Intento 2: descarga parcial del fragmento...")
    for client in YOUTUBE_CLIENTS:
        try:
            with yt_dlp.YoutubeDL(_metadata_opts(client, use_cookies=True)) as ydl:
                info = ydl.extract_info(video_url, download=False)

            if not info:
                continue

            audio_fmt = _pick_best_audio_format(info.get("formats") or [])
            if not audio_fmt or not audio_fmt.get("format_id"):
                continue

            _cleanup_temp_files(audio_dir, temp_id)
            opts = _download_opts_for_client(client, str(audio_fmt["format_id"]), use_cookies=True)
            opts.update({
                "outtmpl": f"{temp_base}.%(ext)s",
                "download_ranges": _make_download_ranges(start_time, end_time),
                "force_keyframes_at_cuts": True,
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }],
            })

            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([video_url])

            downloaded = _find_any_temp_file(audio_dir, temp_id)
            if downloaded:
                if downloaded.endswith(".mp3"):
                    _move_to_output(downloaded, output_path)
                else:
                    _ffmpeg_extract_segment(ffmpeg_bin, downloaded, 0, duration, output_path)
                _cleanup_temp_files(audio_dir, temp_id)
                if os.path.exists(output_path):
                    print(f"[Extract] OK - {output_filename} (descarga parcial)")
                    return output_filename
        except Exception as e:
            if _is_browser_cookie_error(e):
                raise RuntimeError(_friendly_browser_cookie_error()) from e
            last_error = e
            _cleanup_temp_files(audio_dir, temp_id)
            continue

    # Strategy 3: CLI con --download-sections (solo el fragmento)
    print("[Extract] Intento 3: CLI con sección...")
    _cleanup_temp_files(audio_dir, temp_id)
    try:
        cli_file = _extract_section_via_cli(
            video_url, temp_base, ffmpeg_bin, start_time, end_time,
        )
        if cli_file and os.path.exists(cli_file):
            _move_to_output(cli_file, output_path)
            _cleanup_temp_files(audio_dir, temp_id)
            if os.path.exists(output_path):
                print(f"[Extract] OK - {output_filename} (CLI seccion)")
                return output_filename
    except Exception as e:
        if _is_browser_cookie_error(e):
            raise RuntimeError(_friendly_browser_cookie_error()) from e
        last_error = e
        _cleanup_temp_files(audio_dir, temp_id)

    # Strategy 4: descarga audio completo y recorta con ffmpeg (fallback fiable)
    print("[Extract] Intento 4: descarga completa + recorte automático...")
    _cleanup_temp_files(audio_dir, temp_id)
    try:
        if _extract_via_full_download(
            video_url, temp_base, audio_dir, temp_id,
            ffmpeg_bin, start_time, duration, output_path,
        ):
            print(f"[Extract] OK - {output_filename} (descarga completa + recorte)")
            return output_filename
    except Exception as e:
        if _is_browser_cookie_error(e):
            raise RuntimeError(_friendly_browser_cookie_error()) from e
        last_error = e
        _cleanup_temp_files(audio_dir, temp_id)

    msg = _strip_ansi(str(last_error)) if last_error else "No se pudo extraer el fragmento de audio"
    if last_error and _is_browser_cookie_error(last_error):
        raise RuntimeError(_friendly_browser_cookie_error()) from last_error
    if (
        "challenge" in msg.lower()
        or "only images are available" in msg.lower()
        or "javascript runtime" in msg.lower()
    ):
        raise RuntimeError(_friendly_ejs_error()) from last_error
    if "ffmpeg" in msg.lower() or "ffprobe" in msg.lower():
        raise RuntimeError(
            "ffmpeg no encontrado. Reinicia la terminal o define FFMPEG_LOCATION en .env"
        ) from last_error
    if "403" in msg or "bot" in msg.lower():
        raise RuntimeError(
            "YouTube bloqueó la descarga. Añade YTDLP_COOKIES_FROM_BROWSER=chrome en .env "
            "y reinicia el servicio Python (cierra Chrome antes de generar)."
        ) from last_error

    raise RuntimeError(msg)


def _pick_best_audio_format(formats: list[dict[str, Any]]) -> dict[str, Any] | None:
    audio_only = [
        f for f in formats
        if f.get("url")
        and f.get("acodec", "none") != "none"
        and f.get("vcodec", "none") == "none"
    ]
    if audio_only:
        return max(audio_only, key=lambda f: f.get("abr") or 0)

    with_audio = [
        f for f in formats
        if f.get("url") and f.get("acodec", "none") != "none"
    ]
    if with_audio:
        return max(with_audio, key=lambda f: (f.get("abr") or 0, f.get("tbr") or 0))

    return None


def _find_any_temp_file(audio_dir: str, temp_id: str) -> str | None:
    for f in os.listdir(audio_dir):
        if f.startswith(f"temp_{temp_id}"):
            return os.path.join(audio_dir, f)
    return None


def _extract_via_full_download(
    video_url: str,
    temp_base: str,
    audio_dir: str,
    temp_id: str,
    ffmpeg_bin: str,
    start_time: float,
    duration: float,
    output_path: str,
) -> bool:
    """Fallback: download the full audio track, trim with ffmpeg, delete temp files."""
    last_error: Exception | None = None

    for client in YOUTUBE_CLIENTS:
        try:
            _cleanup_temp_files(audio_dir, temp_id)
            opts = _download_opts_for_client(client, FORMAT_AUDIO, use_cookies=True)
            opts.update({
                "outtmpl": f"{temp_base}.%(ext)s",
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }],
            })

            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([video_url])

            downloaded = _find_any_temp_file(audio_dir, temp_id)
            if not downloaded:
                continue

            source = downloaded
            if not downloaded.endswith(".mp3"):
                converted = f"{temp_base}.mp3"
                _ffmpeg_extract_segment(ffmpeg_bin, downloaded, 0, 86400, converted)
                source = converted

            _ffmpeg_extract_segment(ffmpeg_bin, source, start_time, duration, output_path)
            _cleanup_temp_files(audio_dir, temp_id)
            return os.path.exists(output_path)
        except Exception as e:
            last_error = e
            _cleanup_temp_files(audio_dir, temp_id)
            continue

    if last_error:
        raise last_error
    return False


def _ffmpeg_extract_segment(
    ffmpeg_bin: str,
    source: str,
    start_time: float,
    duration: float,
    output_path: str,
    http_headers: dict[str, str] | None = None,
) -> None:
    cmd = [ffmpeg_bin, "-y", "-ss", str(start_time)]
    if http_headers:
        header_lines = "".join(f"{k}: {v}\r\n" for k, v in http_headers.items())
        cmd.extend(["-headers", header_lines])
    cmd.extend([
        "-i", source,
        "-t", str(duration),
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "192k",
        "-ar", "44100",
        output_path,
    ])
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")


def _extract_section_via_cli(
    video_url: str,
    temp_base: str,
    ffmpeg_bin: str,
    start_time: float,
    end_time: float,
) -> str | None:
    """Download ONLY the selected section via yt-dlp CLI."""
    cookies_browser = os.environ.get("YTDLP_COOKIES_FROM_BROWSER", "").strip()
    cookies_file = os.environ.get("YTDLP_COOKIES_FILE", "").strip()
    ffmpeg_dir = os.path.dirname(ffmpeg_bin)
    section = f"*{start_time}-{end_time}"
    last_stderr = ""

    for client in ("web", "mweb", "android", "ios"):
        cmd = [
            sys.executable, "-m", "yt_dlp",
            "--no-playlist", "--no-warnings", "--quiet", "--no-progress",
            "--ffmpeg-location", ffmpeg_dir,
            * _js_runtime_cli_args(),
        ]
        if cookies_file:
            resolved = _resolve_cookies_file(cookies_file)
            if os.path.isfile(resolved):
                cmd.extend(["--cookies", resolved])
            else:
                return None
        elif cookies_browser:
            cmd.extend(["--cookies-from-browser", cookies_browser.split(":")[0]])
        else:
            return None

        cmd.extend([
            "--extractor-args", f"youtube:player_client={client}",
            "--download-sections", section,
            "--force-keyframes-at-cuts",
            "-x", "--audio-format", "mp3",
            "--audio-quality", "192K",
            "-o", f"{temp_base}.%(ext)s",
            video_url,
        ])

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode == 0:
            base_name = os.path.basename(temp_base)
            for f in os.listdir(os.path.dirname(temp_base)):
                if f.startswith(base_name):
                    return os.path.join(os.path.dirname(temp_base), f)
        last_stderr = _strip_ansi(result.stderr)
        if _is_browser_cookie_error(RuntimeError(last_stderr)):
            raise RuntimeError(_friendly_browser_cookie_error())

    if last_stderr:
        raise RuntimeError(last_stderr.strip())
    return None


def parse_time_string(time_str: str) -> float:
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
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
