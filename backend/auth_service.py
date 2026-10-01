"""
Authentication and Authorization service for VeriText NLP.
Handles user registration, password hashing (scrypt/pbkdf2), JWT issuance,
token verification, and endpoint access control.
"""

import os
import re
import datetime
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

from database import get_db

SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or os.environ.get("SECRET_KEY") or "veritext-nlp-secure-jwt-secret-key-2026"
TOKEN_ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 14

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$")


def validate_email_format(email: str) -> bool:
    """Validate email address format."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def generate_auth_token(user_id: int, email: str) -> str:
    """Generate a signed JWT token valid for TOKEN_EXPIRY_DAYS."""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email.strip().lower(),
        "iat": now,
        "exp": now + datetime.timedelta(days=TOKEN_EXPIRY_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=TOKEN_ALGORITHM)


def decode_auth_token(token: str) -> dict | None:
    """Verify and decode a JWT auth token. Returns dict payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[TOKEN_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_current_user_from_request():
    """Extract authenticated user from request header (Authorization: Bearer <token>) or cookie."""
    auth_header = request.headers.get("Authorization", "")
    token = None

    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif "veritext_token" in request.cookies:
        token = request.cookies.get("veritext_token")

    if not token:
        return None

    payload = decode_auth_token(token)
    if not payload or "user_id" not in payload:
        return None

    user_id = payload["user_id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, avatar, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)


def login_required(f):
    """
    Decorator for protected routes.
    Ensures valid user identity is attached to request; returns HTTP 401 if missing or invalid.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user_from_request()
        if not current_user:
            return (
                jsonify({
                    "error": "Unauthorized. Please sign in to access this resource.",
                    "code": "UNAUTHORIZED"
                }),
                401,
            )
        return f(current_user, *args, **kwargs)

    return decorated_function


def register_user(name: str, email: str, password: str):
    """
    Register a new user account.
    Returns (result_dict, status_code).
    """
    name_clean = (name or "").strip()
    email_clean = (email or "").strip().lower()
    password_clean = password or ""

    if not name_clean:
        return {"error": "Name is required."}, 400

    if not email_clean or not validate_email_format(email_clean):
        return {"error": "Please enter a valid email address."}, 400

    if len(password_clean) < 8:
        return {"error": "Password must contain at least 8 characters."}, 400

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    password_hash = generate_password_hash(password_clean)

    with get_db() as conn:
        cursor = conn.cursor()
        # Check if email is already taken
        cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        if cursor.fetchone():
            return {"error": "An account with this email address already exists. Please sign in."}, 409

        # Generate default initial avatar letter or color
        avatar = name_clean[0].upper() if name_clean else "U"

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, avatar, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name_clean, email_clean, password_hash, avatar, now_iso),
        )
        user_id = cursor.lastrowid

    token = generate_auth_token(user_id, email_clean)
    user_data = {
        "id": user_id,
        "name": name_clean,
        "email": email_clean,
        "avatar": avatar,
        "created_at": now_iso,
    }

    return {"token": token, "user": user_data, "message": "Account created successfully."}, 201


def authenticate_user(email: str, password: str):
    """
    Authenticate user with email and password.
    Returns (result_dict, status_code).
    """
    email_clean = (email or "").strip().lower()
    password_clean = password or ""

    if not email_clean:
        return {"error": "Please enter your email."}, 400

    if not password_clean:
        return {"error": "Please enter your password."}, 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, email, password_hash, avatar, created_at FROM users WHERE email = ?",
            (email_clean,),
        )
        user_row = cursor.fetchone()

        if not user_row:
            return {"error": "Email or password is incorrect."}, 401

        if not check_password_hash(user_row["password_hash"], password_clean):
            return {"error": "Email or password is incorrect."}, 401

        user_id = user_row["id"]
        token = generate_auth_token(user_id, user_row["email"])
        user_data = {
            "id": user_id,
            "name": user_row["name"],
            "email": user_row["email"],
            "avatar": user_row["avatar"] or user_row["name"][:1].upper(),
            "created_at": user_row["created_at"],
        }

    return {"token": token, "user": user_data, "message": "Signed in successfully."}, 200


def get_user_profile_stats(user_id: int):
    """Calculate real, verified user statistics from database records."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Total predictions analyzed
        cursor.execute("SELECT COUNT(*) as count FROM prediction_history WHERE user_id = ?", (user_id,))
        total_predictions = cursor.fetchone()["count"]

        # Fake predictions
        cursor.execute(
            "SELECT COUNT(*) as count FROM prediction_history WHERE user_id = ? AND UPPER(prediction) = 'FAKE'",
            (user_id,),
        )
        fake_predictions = cursor.fetchone()["count"]

        # Real predictions
        cursor.execute(
            "SELECT COUNT(*) as count FROM prediction_history WHERE user_id = ? AND UPPER(prediction) = 'REAL'",
            (user_id,),
        )
        real_predictions = cursor.fetchone()["count"]

        # Total saved articles
        cursor.execute("SELECT COUNT(*) as count FROM saved_articles WHERE user_id = ?", (user_id,))
        total_saved = cursor.fetchone()["count"]

    return {
        "total_predictions": total_predictions,
        "fake_predictions": fake_predictions,
        "real_predictions": real_predictions,
        "total_saved": total_saved,
        "saved_articles": total_saved,
    }
