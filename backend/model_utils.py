"""
Reusable NLP preprocessing and model utility functions for Fake News Detection.

IMPORTANT:
The `clean_text` and `combine_title_and_text` functions defined here are shared
across both `train_model.py` (training pipeline) and `backend/app.py` (inference API)
to guarantee zero training-serving skew.
"""

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib

# Resolve project root directory (Fake-News-Detection/)
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BASE_DIR / "models"

MODEL_PATH = MODELS_DIR / "fake_news_model.pkl"
VECTORIZER_PATH = MODELS_DIR / "tfidf_vectorizer.pkl"
METRICS_PATH = MODELS_DIR / "model_metrics.json"


def combine_title_and_text(title: Any, text: Any) -> str:
    """
    Safely combine news headline (title) and article body (text) into a single
    content string: content = title + " " + text.
    """
    safe_title = "" if title is None else str(title).strip()
    safe_text = "" if text is None else str(text).strip()

    if safe_title.lower() == "nan":
        safe_title = ""
    if safe_text.lower() == "nan":
        safe_text = ""

    return f"{safe_title} {safe_text}".strip()


def clean_text(text: Any) -> str:
    """
    Reusable NLP text preprocessing pipeline used identically during model
    training and API prediction.

    Steps:
    1. Convert text to lowercase
    2. Remove URLs (http, https, www)
    3. Remove HTML tags
    4. Remove non-alphabetic characters
    5. Remove extra whitespace
    6. Strip leading/trailing spaces
    """
    if text is None:
        return ""

    if not isinstance(text, str):
        text = str(text)
        if text.lower() == "nan":
            return ""

    # 1. Convert text to lowercase
    text = text.lower()

    # 2. Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # 3. Remove HTML tags
    text = re.sub(r"<.*?>+", " ", text)

    # 4. Remove non-alphabetic characters (keep only a-z and whitespace)
    text = re.sub(r"[^a-z\s]", " ", text)

    # 5. Remove extra whitespace & 6. Strip leading/trailing spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


class FakeNewsModelService:
    """
    Manages loading the trained TF-IDF vectorizer and Logistic Regression model,
    checking availability, and running predictions with confidence scores.
    """

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        vectorizer_path: Path = VECTORIZER_PATH,
        metrics_path: Path = METRICS_PATH,
    ) -> None:
        self.model_path = Path(model_path)
        self.vectorizer_path = Path(vectorizer_path)
        self.metrics_path = Path(metrics_path)
        self.model = None
        self.vectorizer = None
        self._model_mtime: Optional[float] = None
        self._vectorizer_mtime: Optional[float] = None
        self.load_artifacts()

    def artifacts_exist(self) -> bool:
        """Return True if both the model and TF-IDF vectorizer files exist."""
        return self.model_path.is_file() and self.vectorizer_path.is_file()

    def load_artifacts(self) -> bool:
        """
        Load (or reload if updated on disk) the trained model and TF-IDF vectorizer.
        Returns True if loaded successfully, False otherwise.
        """
        if not self.artifacts_exist():
            self.model = None
            self.vectorizer = None
            self._model_mtime = None
            self._vectorizer_mtime = None
            return False

        try:
            current_model_mtime = os.path.getmtime(self.model_path)
            current_vec_mtime = os.path.getmtime(self.vectorizer_path)

            if (
                self.model is None
                or self.vectorizer is None
                or current_model_mtime != self._model_mtime
                or current_vec_mtime != self._vectorizer_mtime
            ):
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
                self._model_mtime = current_model_mtime
                self._vectorizer_mtime = current_vec_mtime
            return True
        except Exception as exc:
            print(f"[ERROR] Failed to load model artifacts: {exc}")
            self.model = None
            self.vectorizer = None
            return False

    def is_loaded(self) -> bool:
        """
        Check whether the model is currently loaded, attempting a lazy reload
        if the model files were created after the server started.
        """
        if self.model is not None and self.vectorizer is not None:
            # Also verify files haven't been removed or updated
            return self.load_artifacts()
        return self.load_artifacts()

    def get_model_info(self) -> Dict[str, Any]:
        """Return model configuration and any saved evaluation metrics."""
        info: Dict[str, Any] = {
            "model": "Logistic Regression",
            "feature_extraction": "TF-IDF",
            "ngrams": "Unigram + Bigram",
            "max_features": 30000,
            "training_split": "80%",
            "testing_split": "20%",
            "classes": "Fake / Real",
            "model_loaded": self.is_loaded(),
        }

        if self.metrics_path.is_file():
            try:
                with open(self.metrics_path, "r", encoding="utf-8") as f:
                    metrics_data = json.load(f)
                info["evaluation_metrics"] = metrics_data
            except Exception:
                pass

        return info

    def predict(self, title: str, text: str) -> Dict[str, Any]:
        """
        Run the complete NLP preprocessing + TF-IDF + Logistic Regression pipeline.

        Returns:
            dict with keys:
                - prediction: "FAKE" or "REAL"
                - confidence: float percentage rounded to 2 decimal places (e.g. 94.32)
        """
        if not self.is_loaded():
            raise FileNotFoundError(
                "Trained model files ('models/fake_news_model.pkl' and "
                "'models/tfidf_vectorizer.pkl') were not found. "
                "Please place Fake.csv and True.csv inside dataset/ and run "
                "'python train_model.py' first."
            )

        combined = combine_title_and_text(title, text)
        cleaned = clean_text(combined)

        if not cleaned:
            raise ValueError(
                "The provided input contains no valid alphabetic words after text cleaning."
            )

        words = cleaned.split()
        if len(words) < 3 or len(cleaned) < 12:
            raise ValueError(
                "The provided text is too short for reliable analysis. "
                "Please enter a complete news headline and/or article content (at least 3 words)."
            )

        # Transform cleaned text into TF-IDF feature vector
        features = self.vectorizer.transform([cleaned])

        # Predict class (0 = FAKE, 1 = REAL) and probabilities
        pred_label = int(self.model.predict(features)[0])
        probabilities = self.model.predict_proba(features)[0]

        # Confidence for the predicted class as a percentage
        confidence = round(float(probabilities[pred_label]) * 100.0, 2)
        prediction_str = "REAL" if pred_label == 1 else "FAKE"

        return {
            "prediction": prediction_str,
            "confidence": confidence,
        }
