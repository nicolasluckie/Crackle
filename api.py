"""Flask API backend for Crackle web interface."""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import os
from crackle import load_words, filter_words, rank_words, compute_feedback

app = Flask(__name__, static_folder="web/dist", static_url_path="")

# Configure CORS for production
# In production (Docker), frontend and backend are same-origin via nginx proxy
# CORS is only needed for local development when frontend (5173) calls backend (5000)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8080"
).split(",")

# If ALLOWED_ORIGINS is empty or just whitespace, disable CORS (same-origin setup)
if ALLOWED_ORIGINS and any(origin.strip() for origin in ALLOWED_ORIGINS):
    CORS(
        app,
        origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
        supports_credentials=True,
    )
else:
    # In production with nginx proxy, requests are same-origin, no CORS needed
    CORS(app)

# Load word list once at startup
WORD_LIST = load_words()

# Store active games in memory
# NOTE: This is in-memory storage and NOT shared between Gunicorn workers
# For multi-worker deployment, use Redis or a database instead
# Current deployment uses 1 worker with threads to allow memory sharing
games = {}


@app.route("/api/words", methods=["GET"])
def get_words():
    """Return the full word list."""
    return jsonify({"words": WORD_LIST, "count": len(WORD_LIST)})


@app.route("/api/filter", methods=["POST"])
def filter_candidates():
    """Filter words based on guess and result.

    Request body:
    {
        "possible_words": ["word1", "word2", ...],
        "guess": "slate",
        "result": "bgybb"
    }

    Returns:
    {
        "filtered": ["word1", "word2", ...],
        "ranked": ["word1", "word2", ...],
        "count": N
    }
    """
    data = request.json
    possible_words = data.get("possible_words", WORD_LIST)
    guess = data.get("guess", "").lower()
    result = data.get("result", "").lower()

    if not guess or not result:
        return jsonify({"error": "Missing guess or result"}), 400

    filtered = filter_words(possible_words, guess, result)
    ranked = rank_words(filtered)

    return jsonify({"filtered": filtered, "ranked": ranked, "count": len(filtered)})


@app.route("/api/play/new", methods=["POST"])
def new_game():
    """Start a new practice game.

    Returns:
    {
        "game_id": "abc123",
        "message": "Game started"
    }
    """
    game_id = str(random.randint(100000, 999999))
    target = random.choice(WORD_LIST)
    games[game_id] = {"target": target, "guesses": []}

    return jsonify({"game_id": game_id, "message": "Game started"})


@app.route("/api/play/guess", methods=["POST"])
def make_guess():
    """Submit a guess for a practice game.

    Request body:
    {
        "game_id": "abc123",
        "guess": "slate"
    }

    Returns:
    {
        "feedback": "🟩🟨⬛⬛⬛",
        "correct": false,
        "guesses": 1
    }
    """
    data = request.json
    game_id = data.get("game_id")
    guess = data.get("guess", "").lower()

    if not game_id or game_id not in games:
        return jsonify({"error": "Invalid game_id"}), 400

    if not guess or len(guess) != 5:
        return jsonify({"error": "Invalid guess"}), 400

    game = games[game_id]
    target = game["target"]
    feedback = compute_feedback(guess, target)
    game["guesses"].append({"guess": guess, "feedback": feedback})

    correct = guess == target

    return jsonify(
        {
            "feedback": feedback,
            "correct": correct,
            "guesses": len(game["guesses"]),
            "target": target if correct else None,
        }
    )


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "words_loaded": len(WORD_LIST)})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve the React frontend in production mode."""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
