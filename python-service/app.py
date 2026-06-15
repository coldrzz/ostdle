"""OSTdle Python Media Service - YouTube search, streaming, and audio extraction."""

import os
import sys

from flask import Flask, jsonify, request, redirect
from flask_cors import CORS

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
    print(f"[Python Service] Starting on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=os.environ.get("FLASK_DEBUG") == "1")
