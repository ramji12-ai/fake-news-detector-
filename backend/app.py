"""
Flask REST API for Fake News Detection Using Natural Language Processing.

Endpoints:
    GET  /           -> Health check, model status, and model configuration metadata
    GET  /model-info -> Detailed model configuration and evaluation metrics (if available)
    POST /predict    -> Classify news headline + article content as FAKE or REAL
    POST /chat       -> AI News Assistant powered by Gemini API with Google Search grounding
"""

import os
import sys
import datetime
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure backend directory is on sys.path whether run via `python backend/app.py`
# from project root or `python app.py` from inside `backend/`
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from chat_service import (  # noqa: E402
    GeminiConfigurationError,
    GeminiUpstreamError,
    NewsAssistantService,
    is_gemini_configured,
)
from model_utils import FakeNewsModelService  # noqa: E402
from news_service import get_all_news  # noqa: E402
from database import get_db, init_db  # noqa: E402
from auth_service import (  # noqa: E402
    register_user,
    authenticate_user,
    login_required,
    get_user_profile_stats,
)

app = Flask(__name__)
CORS(app)

# Initialize database schema on startup
init_db()

# Initialize the ML model service and AI News Assistant service
model_service = FakeNewsModelService()
news_assistant = NewsAssistantService()


@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint returning API status, ML model status, and Gemini chat status."""
    is_loaded = model_service.is_loaded()
    gemini_ready = is_gemini_configured()
    response = {
        "message": "Fake News Detection API is running",
        "model_loaded": is_loaded,
        "chat_configured": True,
        "gemini_key_configured": gemini_ready,
        "model_info": model_service.get_model_info(),
    }
    if not is_loaded:
        response["notice"] = (
            "Model files are not found in 'models/'. "
            "Place Fake.csv and True.csv in 'dataset/' and run 'python train_model.py' to train the model."
        )
    return jsonify(response), 200


@app.route("/model-info", methods=["GET"])
def model_info():
    """Return model architecture and training split details for the frontend dashboard."""
    return jsonify(model_service.get_model_info()), 200


@app.route("/predict", methods=["POST"])
def predict_news():
    """
    Classify a news article as FAKE or REAL using the trained TF-IDF + Logistic Regression pipeline.

    Expected JSON body:
    {
        "title": "News headline",
        "text": "News article content"
    }
    """
    # 1. Validate request JSON payload
    if not request.is_json:
        return (
            jsonify(
                {
                    "error": "Invalid request format. Content-Type must be 'application/json'."
                }
            ),
            400,
        )

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return (
            jsonify(
                {
                    "error": "Invalid JSON body. Expected a JSON object with 'title' and 'text' fields."
                }
            ),
            400,
        )

    title = data.get("title", "")
    text = data.get("text", "")

    if not isinstance(title, str) or not isinstance(text, str):
        return (
            jsonify(
                {
                    "error": "Invalid field types. Both 'title' and 'text' must be strings."
                }
            ),
            400,
        )

    title_stripped = title.strip()
    text_stripped = text.strip()

    if not title_stripped and not text_stripped:
        return (
            jsonify(
                {
                    "error": "Empty input. Please provide a news headline and/or article content to analyze."
                }
            ),
            400,
        )

    # Check overly large input for safety
    if len(title_stripped) + len(text_stripped) > 200_000:
        return (
            jsonify(
                {
                    "error": "Input text exceeds maximum allowed length (200,000 characters)."
                }
            ),
            400,
        )

    # 2. Check model availability and run prediction
    try:
        result = model_service.predict(title=title_stripped, text=text_stripped)
        return (
            jsonify(
                {
                    "prediction": result["prediction"],
                    "confidence": result["confidence"],
                }
            ),
            200,
        )
    except FileNotFoundError as fnf_err:
        return (
            jsonify(
                {
                    "error": str(fnf_err),
                    "model_loaded": False,
                }
            ),
            503,
        )
    except ValueError as val_err:
        return (
            jsonify(
                {
                    "error": str(val_err),
                }
            ),
            400,
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "error": f"An unexpected error occurred during prediction: {str(exc)}"
                }
            ),
            500,
        )


@app.route("/chat", methods=["POST"])
def chat_news_assistant():
    """
    AI News Assistant endpoint powered by Google Gemini API with Google Search grounding.

    Expected JSON body:
    {
        "message": "What are the latest AI news today?",
        "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    }
    """
    if not request.is_json:
        return (
            jsonify(
                {
                    "error": "Invalid request format. Content-Type must be 'application/json'."
                }
            ),
            400,
        )

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return (
            jsonify(
                {
                    "error": "Invalid JSON body. Expected a JSON object with a 'message' field."
                }
            ),
            400,
        )

    message = data.get("message", "")
    history = data.get("history", [])

    if not isinstance(message, str):
        return (
            jsonify({"error": "Invalid field type. 'message' must be a string."}),
            400,
        )

    message_stripped = message.strip()
    if not message_stripped:
        return (
            jsonify(
                {
                    "error": "Empty message. Please enter a news question or topic to search."
                }
            ),
            400,
        )

    if len(message_stripped) > 4000:
        return (
            jsonify(
                {
                    "error": "Message is too long (maximum 4,000 characters). Please shorten your question."
                }
            ),
            400,
        )

    if history is not None and not isinstance(history, list):
        return (
            jsonify({"error": "Invalid field type. 'history' must be a list if provided."}),
            400,
        )

    try:
        result = news_assistant.ask_news_assistant(
            message=message_stripped,
            history=history,
        )
        return (
            jsonify(
                {
                    "answer": result["answer"],
                    "sources": result["sources"],
                    "search_queries": result.get("search_queries", []),
                    "search_used": result["search_used"],
                    "temporal_context": result.get("temporal_context", "Web-Grounded News Search"),
                }
            ),
            200,
        )
    except GeminiConfigurationError as cfg_err:
        return (
            jsonify(
                {
                    "error": str(cfg_err),
                    "code": "MISSING_API_KEY",
                    "search_used": False,
                }
            ),
            503,
        )
    except GeminiUpstreamError as up_err:
        return (
            jsonify(
                {
                    "error": str(up_err),
                    "code": "GEMINI_API_ERROR",
                    "search_used": False,
                }
            ),
            up_err.status_code,
        )
    except ValueError as val_err:
        return (
            jsonify(
                {
                    "error": str(val_err),
                    "search_used": False,
                }
            ),
            400,
        )
    except Exception:
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred while processing your news query. Please try again.",
                    "search_used": False,
                }
            ),
            500,
        )


@app.route("/news", methods=["GET"])
def get_live_news():
    """
    Get live aggregated news articles from permitted news RSS feeds
    (The Indian Express, NDTV, The Hindu, The Times of India, ESPNcricinfo).
    Supports optional ?source=... and ?category=... and ?limit=... query parameters.
    """
    source = request.args.get("source")
    category = request.args.get("category")
    refresh = request.args.get("refresh", "").lower() in ("true", "1", "yes")
    limit_str = request.args.get("limit")

    try:
        articles = get_all_news(force_refresh=refresh, source_filter=source, category_filter=category)
        if limit_str and limit_str.isdigit():
            articles = articles[:int(limit_str)]
        return jsonify({
            "status": "success",
            "count": len(articles),
            "articles": articles
        }), 200
    except Exception as exc:
        return jsonify({
            "status": "error",
            "error": f"Failed to retrieve news feed: {str(exc)}",
            "articles": []
        }), 500



# =====================================================================
# AUTHENTICATION ENDPOINTS
# =====================================================================

@app.route("/auth/register", methods=["POST"])
def auth_register():
    """Register a new user account."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}
    res, status_code = register_user(
        name=data.get("name", ""),
        email=data.get("email", ""),
        password=data.get("password", ""),
    )
    return jsonify(res), status_code


@app.route("/auth/login", methods=["POST"])
def auth_login():
    """Authenticate a user and return JWT session token."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}
    res, status_code = authenticate_user(
        email=data.get("email", ""),
        password=data.get("password", ""),
    )
    return jsonify(res), status_code


@app.route("/auth/me", methods=["GET"])
@login_required
def auth_me(current_user):
    """Return authenticated user profile and actual activity statistics."""
    stats = get_user_profile_stats(current_user["id"])
    return jsonify({
        "user": current_user,
        "stats": stats,
    }), 200


@app.route("/auth/logout", methods=["POST"])
def auth_logout():
    """Client-side logout endpoint."""
    return jsonify({"message": "Signed out successfully."}), 200


# =====================================================================
# PREDICTION HISTORY ENDPOINTS (Authenticated, user-isolated)
# =====================================================================

@app.route("/history", methods=["GET"])
@login_required
def get_user_history(current_user):
    """Retrieve the prediction history exclusively for the authenticated user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, user_id, title, text, prediction, confidence, model, created_at
            FROM prediction_history
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (current_user["id"],),
        )
        rows = cursor.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r["id"],
                "title": r["title"] or "Untitled News Article",
                "text": r["text"] or "",
                "prediction": r["prediction"],
                "confidence": float(r["confidence"]),
                "model": r["model"] or "Logistic Regression",
                "timestamp": r["created_at"],
            })
    return jsonify({"status": "success", "count": len(items), "history": items}), 200


@app.route("/history", methods=["POST"])
@login_required
def add_user_history(current_user):
    """Add a new prediction analysis to the authenticated user's account."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    text = (data.get("text") or "").strip()
    prediction = (data.get("prediction") or "REAL").strip().upper()
    try:
        confidence = float(data.get("confidence") or 0.0)
    except (ValueError, TypeError):
        confidence = 0.0
    model = (data.get("model") or "Logistic Regression").strip()
    timestamp = data.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, title, text, prediction, confidence, model, created_at
            FROM prediction_history
            WHERE user_id = ? AND title = ? AND prediction = ?
            ORDER BY id DESC LIMIT 1
            """,
            (current_user["id"], title, prediction),
        )
        existing = cursor.fetchone()
        if existing:
            return jsonify({
                "status": "exists",
                "message": "Prediction is already saved in your history.",
                "record": {
                    "id": existing["id"],
                    "title": existing["title"] or "Untitled News Article",
                    "text": existing["text"] or "",
                    "prediction": existing["prediction"],
                    "confidence": float(existing["confidence"]) if existing["confidence"] is not None else 0.0,
                    "model": existing["model"] or "Logistic Regression",
                    "timestamp": existing["created_at"],
                }
            }), 200

        cursor.execute(
            """
            INSERT INTO prediction_history (user_id, title, text, prediction, confidence, model, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (current_user["id"], title, text, prediction, confidence, model, timestamp),
        )
        record_id = cursor.lastrowid

    record = {
        "id": record_id,
        "title": title or "Untitled News Article",
        "text": text,
        "prediction": prediction,
        "confidence": confidence,
        "model": model,
        "timestamp": timestamp,
    }
    return jsonify({"status": "success", "record": record}), 201


@app.route("/history/batch", methods=["POST"])
@login_required
def import_user_history_batch(current_user):
    """Batch-import guest predictions into the authenticated user's account."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}
    records = data.get("records") or []
    if not isinstance(records, list):
        return jsonify({"error": "'records' must be a list."}), 400

    imported_count = 0
    with get_db() as conn:
        cursor = conn.cursor()
        for item in records:
            if not isinstance(item, dict):
                continue
            title = (item.get("title") or "").strip()
            text = (item.get("text") or "").strip()
            prediction = (item.get("prediction") or "REAL").strip().upper()
            try:
                confidence = float(item.get("confidence") or 0.0)
            except (ValueError, TypeError):
                confidence = 0.0
            model = (item.get("model") or "Logistic Regression").strip()
            timestamp = item.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute(
                """
                INSERT INTO prediction_history (user_id, title, text, prediction, confidence, model, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (current_user["id"], title, text, prediction, confidence, model, timestamp),
            )
            imported_count += 1

    return jsonify({"status": "success", "imported": imported_count}), 201


@app.route("/history/<int:record_id>", methods=["DELETE"])
@login_required
def delete_user_history_record(current_user, record_id):
    """Delete a single prediction record belonging exclusively to the current user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM prediction_history WHERE id = ? AND user_id = ?",
            (record_id, current_user["id"]),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Record not found or not owned by user."}), 404
    return jsonify({"status": "success", "message": "Record deleted from history."}), 200


@app.route("/history", methods=["DELETE"])
@login_required
def clear_user_history(current_user):
    """Clear all prediction history records for the current user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM prediction_history WHERE user_id = ?", (current_user["id"],))
    return jsonify({"status": "success", "message": "All prediction history cleared."}), 200


# =====================================================================
# SAVED ARTICLES ENDPOINTS (Authenticated, user-isolated)
# =====================================================================

@app.route("/saved", methods=["GET"])
@login_required
def get_user_saved_articles(current_user):
    """Retrieve saved articles exclusively for the authenticated user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, user_id, title, text, source, url, image, prediction, confidence, saved_at
            FROM saved_articles
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (current_user["id"],),
        )
        rows = cursor.fetchall()
        articles = []
        for r in rows:
            articles.append({
                "id": r["id"],
                "title": r["title"],
                "text": r["text"] or "",
                "source": r["source"] or "VeriText",
                "url": r["url"] or "",
                "image": r["image"] or "",
                "prediction": r["prediction"],
                "confidence": float(r["confidence"]) if r["confidence"] is not None else None,
                "savedAt": r["saved_at"],
            })
    return jsonify({"status": "success", "count": len(articles), "saved": articles}), 200


@app.route("/saved", methods=["POST"])
@login_required
def add_user_saved_article(current_user):
    """Save an article to the user's account."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Article title is required."}), 400

    text = (data.get("text") or "").strip()
    source = (data.get("source") or "VeriText").strip()
    url = (data.get("url") or "").strip()
    image = (data.get("image") or "").strip()
    prediction = data.get("prediction")
    confidence = data.get("confidence")
    if confidence is not None:
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = None

    saved_at = data.get("savedAt") or datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        # Check duplicate
        cursor.execute(
            """
            SELECT id, title, text, source, url, image, prediction, confidence, saved_at
            FROM saved_articles
            WHERE user_id = ? AND (title = ? OR (url != '' AND url = ?))
            LIMIT 1
            """,
            (current_user["id"], title, url),
        )
        existing = cursor.fetchone()
        if existing:
            return jsonify({
                "status": "exists",
                "message": "Article is already saved in your account.",
                "id": existing["id"],
                "article": {
                    "id": existing["id"],
                    "title": existing["title"],
                    "text": existing["text"] or "",
                    "source": existing["source"] or "VeriText",
                    "url": existing["url"] or "",
                    "image": existing["image"] or "",
                    "prediction": existing["prediction"],
                    "confidence": float(existing["confidence"]) if existing["confidence"] is not None else None,
                    "savedAt": existing["saved_at"],
                }
            }), 200

        cursor.execute(
            """
            INSERT INTO saved_articles (user_id, title, text, source, url, image, prediction, confidence, saved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (current_user["id"], title, text, source, url, image, prediction, confidence, saved_at),
        )
        article_id = cursor.lastrowid

    article = {
        "id": article_id,
        "title": title,
        "text": text,
        "source": source,
        "url": url,
        "image": image,
        "prediction": prediction,
        "confidence": confidence,
        "savedAt": saved_at,
    }
    return jsonify({"status": "success", "article": article}), 201


@app.route("/saved/batch", methods=["POST"])
@login_required
def import_user_saved_batch(current_user):
    """Batch-import guest saved articles into the user's account."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be 'application/json'"}), 400
    data = request.get_json(silent=True) or {}
    articles = data.get("articles") or []
    if not isinstance(articles, list):
        return jsonify({"error": "'articles' must be a list."}), 400

    imported_count = 0
    with get_db() as conn:
        cursor = conn.cursor()
        for item in articles:
            if not isinstance(item, dict):
                continue
            title = (item.get("title") or "").strip()
            if not title:
                continue
            text = (item.get("text") or "").strip()
            source = (item.get("source") or "VeriText").strip()
            url = (item.get("url") or "").strip()
            image = (item.get("image") or "").strip()
            prediction = item.get("prediction")
            conf = item.get("confidence")
            try:
                conf = float(conf) if conf is not None else None
            except (ValueError, TypeError):
                conf = None
            saved_at = item.get("savedAt") or datetime.datetime.now(datetime.timezone.utc).isoformat()

            cursor.execute(
                """
                INSERT INTO saved_articles (user_id, title, text, source, url, image, prediction, confidence, saved_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (current_user["id"], title, text, source, url, image, prediction, conf, saved_at),
            )
            imported_count += 1

    return jsonify({"status": "success", "imported": imported_count}), 201


@app.route("/saved/<int:article_id>", methods=["DELETE"])
@login_required
def delete_user_saved_article(current_user, article_id):
    """Remove a saved article belonging to the current user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM saved_articles WHERE id = ? AND user_id = ?",
            (article_id, current_user["id"]),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Article not found or not owned by user."}), 404
    return jsonify({"status": "success", "message": "Article removed from saved."}), 200


@app.route("/saved", methods=["DELETE"])
@login_required
def clear_user_saved(current_user):
    """Remove all saved articles for the current user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_articles WHERE user_id = ?", (current_user["id"],))
    return jsonify({"status": "success", "message": "All saved articles removed."}), 200


@app.errorhandler(404)
def not_found(_error):
    return (
        jsonify(
            {
                "error": "Endpoint not found. Available endpoints: GET /, GET /model-info, GET /news, POST /predict, POST /chat, /auth/*, /history, /saved"
            }
        ),
        404,
    )


@app.errorhandler(405)
def method_not_allowed(_error):
    return jsonify({"error": "HTTP method not allowed for this endpoint."}), 405


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print("  Fake News Detection & AI News Assistant API Server")
    print(f"  Running on:      http://127.0.0.1:{port}")
    print(f"  ML Model Loaded: {model_service.is_loaded()}")
    print(f"  Gemini Key Set:  {is_gemini_configured()}")
    if not model_service.is_loaded():
        print(
            "  [WARNING] Trained model files not found in 'models/'.\n"
            "            Run 'python train_model.py' after placing Fake.csv and True.csv in 'dataset/'."
        )
    if not is_gemini_configured():
        print(
            "  [NOTICE]  GEMINI_API_KEY not found in environment or '.env'.\n"
            "            Copy '.env.example' to '.env' and set GEMINI_API_KEY to enable /chat."
        )
    print("=" * 60)
    app.run(host="127.0.0.1", port=port, debug=False)
