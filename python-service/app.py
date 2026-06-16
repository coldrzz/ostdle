"""OSTdle Python Media Service - YouTube search, streaming, and audio extraction."""

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, redirect
from flask_cors import CORS

# Load .env from project root and python-service/
_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env")
load_dotenv(_root / "backend" / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

from media_service import (
    extract_audio_fragment,
    get_stream_url,
    get_video_info,
    search_youtube,
)

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 5001))


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "python-media"})


@app.route("/api/youtube/search", methods=["POST"])
def youtube_search():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"error": "Bad Request", "message": "query is required"}), 400

    try:
        results = search_youtube(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": "Search Error", "message": str(e)}), 500


@app.route("/api/youtube/info", methods=["POST"])
def youtube_info():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "Bad Request", "message": "url is required"}), 400

    try:
        info = get_video_info(url)
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": "Info Error", "message": str(e)}), 500


@app.route("/api/youtube/stream", methods=["GET"])
def youtube_stream():
    """Private streaming endpoint for admin panel preview."""
    url = request.args.get("url", "").strip()

    if not url:
        return jsonify({"error": "Bad Request", "message": "url is required"}), 400

    try:
        stream_url = get_stream_url(url)
        return redirect(stream_url)
    except Exception as e:
        return jsonify({"error": "Stream Error", "message": str(e)}), 500


@app.route("/api/audio/extract", methods=["POST"])
def audio_extract():
    data = request.get_json(silent=True) or {}
    video_url = data.get("videoUrl", "").strip()
    start_time = data.get("startTime")
    end_time = data.get("endTime")

    if not video_url:
        return jsonify({"error": "Bad Request", "message": "videoUrl is required"}), 400

    if start_time is None or end_time is None:
        return jsonify({"error": "Bad Request", "message": "startTime and endTime are required"}), 400

    try:
        start_time = float(start_time)
        end_time = float(end_time)
    except (TypeError, ValueError):
        return jsonify({"error": "Bad Request", "message": "startTime and endTime must be numbers"}), 400

    if end_time <= start_time:
        return jsonify({"error": "Bad Request", "message": "endTime must be greater than startTime"}), 400

    try:
        audio_file = extract_audio_fragment(video_url, start_time, end_time)
        return jsonify({"audioFile": audio_file, "success": True})
    except Exception as e:
        return jsonify({"error": "Extraction Error", "message": str(e)}), 500


if __name__ == "__main__":
    import shutil

    from media_service import _find_ffmpeg, _js_runtime_opts

    cookies_browser = os.environ.get("YTDLP_COOKIES_FROM_BROWSER", "")
    cookies_file = os.environ.get("YTDLP_COOKIES_FILE", "")
    print(f"[Python Service] Starting on port {PORT}")
    try:
        print(f"[Python Service] ffmpeg: {_find_ffmpeg()}")
    except RuntimeError as e:
        print(f"[Python Service] WARNING: {e}")
    js_opts = _js_runtime_opts()
    if js_opts:
        runtime = next(iter(js_opts.get("js_runtimes", {})))
        path = js_opts["js_runtimes"][runtime].get("path") or shutil.which(runtime)
        print(f"[Python Service] JS runtime: {runtime} ({path})")
    else:
        print("[Python Service] WARNING: No JS runtime for YouTube (install Node.js 22+)")
    try:
        import yt_dlp_ejs  # noqa: F401
        print("[Python Service] yt-dlp-ejs: OK")
    except ImportError:
        print("[Python Service] WARNING: yt-dlp-ejs missing. Run: pip install -U \"yt-dlp[default]\"")
    if cookies_browser:
        print(f"[Python Service] YouTube cookies from browser: {cookies_browser}")
    elif cookies_file:
        print(f"[Python Service] YouTube cookies file: {cookies_file}")
    else:
        print("[Python Service] WARNING: No YouTube cookies configured.")
        print("  Set YTDLP_COOKIES_FROM_BROWSER=chrome (or edge) in .env")
    app.run(host="0.0.0.0", port=PORT, debug=os.environ.get("FLASK_DEBUG") == "1")
