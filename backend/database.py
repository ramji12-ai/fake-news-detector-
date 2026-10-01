"""
Database layer for VeriText NLP user authentication, prediction history, and saved articles.
Uses SQLite for zero-configuration, lightweight, reliable local data storage.
"""

import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

CURRENT_DIR = Path(__file__).resolve().parent
DB_PATH = os.environ.get("VERITEXT_DB_PATH", str(CURRENT_DIR / "veritext.db"))


def get_db_connection():
    """Create a new SQLite database connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def get_db():
    """Context manager for database transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize database tables, foreign keys, and indexes if they do not exist."""
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                avatar TEXT,
                created_at TEXT NOT NULL
            );
        """)

        # 2. Prediction History Table (tied to user_id)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                text TEXT,
                prediction TEXT NOT NULL,
                confidence REAL NOT NULL,
                model TEXT DEFAULT 'Logistic Regression',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. Saved Articles Table (tied to user_id)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                text TEXT,
                source TEXT,
                url TEXT,
                image TEXT,
                prediction TEXT,
                confidence REAL,
                saved_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # Performance Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_user ON prediction_history(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_articles(user_id);")

        conn.commit()


# Run schema initialization when database module loads
init_db()
