"""
Model Training Script for Fake News Detection Using Natural Language Processing.

Usage (from project root):
    python train_model.py

Pipeline:
    [1/6] Loading dataset (dataset/Fake.csv and dataset/True.csv)
    [2/6] Cleaning text (combining title + text, deduplicating, shuffling, NLP cleaning)
    [3/6] Creating TF-IDF features (unigrams + bigrams, max_features=30000, sublinear_tf=True)
    [4/6] Training model (LogisticRegression(max_iter=2000))
    [5/6] Evaluating model (Accuracy, Precision, Recall, F1, Classification Report, Confusion Matrix)
    [6/6] Saving model & artifacts (models/fake_news_model.pkl, models/tfidf_vectorizer.pkl, dataset/final_dataset.csv)
"""

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

# Resolve paths relative to project root
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.model_utils import (  # noqa: E402
    DATASET_DIR,
    METRICS_PATH,
    MODEL_PATH,
    MODELS_DIR,
    VECTORIZER_PATH,
    clean_text,
)

FAKE_CSV_PATH = DATASET_DIR / "Fake.csv"
TRUE_CSV_PATH = DATASET_DIR / "True.csv"
FINAL_DATASET_PATH = DATASET_DIR / "final_dataset.csv"


def load_csv_safely(csv_path: Path) -> pd.DataFrame:
    """Load a CSV file safely with encoding fallbacks and error handling."""
    if not csv_path.is_file():
        raise FileNotFoundError(f"Required dataset file not found: {csv_path}")

    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            df = pd.read_csv(csv_path, encoding=encoding)
            if df.empty:
                raise ValueError(f"Dataset file '{csv_path.name}' is empty.")
            return df
        except UnicodeDecodeError:
            continue
        except pd.errors.EmptyDataError as exc:
            raise ValueError(f"Dataset file '{csv_path.name}' contains no data.") from exc
        except pd.errors.ParserError as exc:
            raise ValueError(
                f"Failed to parse CSV file '{csv_path.name}': {exc}"
            ) from exc

    raise ValueError(f"Could not decode CSV file '{csv_path.name}' with standard encodings.")


def normalize_columns(df: pd.DataFrame, filename: str) -> pd.DataFrame:
    """
    Verify and normalize column names so 'title' and 'text' are guaranteed present.
    Adapts automatically if column names have whitespace or different casing.
    """
    col_map = {col: col.strip().lower() for col in df.columns}
    df = df.rename(columns=col_map)

    # Check if 'title' and 'text' exist; handle common aliases if needed
    if "title" not in df.columns and "headline" in df.columns:
        df = df.rename(columns={"headline": "title"})
    if "text" not in df.columns and "article" in df.columns:
        df = df.rename(columns={"article": "text"})

    missing = [req for req in ("title", "text") if req not in df.columns]
    if missing:
        raise KeyError(
            f"File '{filename}' is missing required column(s): {missing}. "
            f"Found columns: {list(df.columns)}"
        )
    return df


def main() -> int:
    print("=" * 65)
    print("  FAKE NEWS DETECTION - NLP MODEL TRAINING PIPELINE")
    print("=" * 65)

    # Ensure directories exist
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # [1/6] Loading dataset...
    # ------------------------------------------------------------------
    print("\n[1/6] Loading dataset...")
    if not FAKE_CSV_PATH.is_file() or not TRUE_CSV_PATH.is_file():
        missing_files = []
        if not FAKE_CSV_PATH.is_file():
            missing_files.append("dataset/Fake.csv")
        if not TRUE_CSV_PATH.is_file():
            missing_files.append("dataset/True.csv")

        print("\n[ERROR] Dataset files are missing!")
        print(f"        Missing: {', '.join(missing_files)}")
        print("\nPlease place both 'Fake.csv' and 'True.csv' inside the 'dataset/' directory:")
        print(f"  - {FAKE_CSV_PATH}")
        print(f"  - {TRUE_CSV_PATH}")
        print("\nThen re-run:")
        print("  python train_model.py")
        return 1

    try:
        fake_df = load_csv_safely(FAKE_CSV_PATH)
        true_df = load_csv_safely(TRUE_CSV_PATH)
        fake_df = normalize_columns(fake_df, "Fake.csv")
        true_df = normalize_columns(true_df, "True.csv")
    except Exception as exc:
        print(f"\n[ERROR] Failed to load dataset: {exc}")
        return 1

    print(f"      Loaded Fake.csv: {fake_df.shape[0]:,} rows, columns={list(fake_df.columns)}")
    print(f"      Loaded True.csv: {true_df.shape[0]:,} rows, columns={list(true_df.columns)}")

    # Assign labels: Fake.csv -> 0, True.csv -> 1
    fake_df["label"] = 0
    true_df["label"] = 1

    # Combine both datasets into one dataframe
    df = pd.concat([fake_df, true_df], axis=0, ignore_index=True)
    initial_total = len(df)
    print(f"      Combined dataset size: {initial_total:,} articles")

    # ------------------------------------------------------------------
    # [2/6] Cleaning text...
    # ------------------------------------------------------------------
    print("\n[2/6] Cleaning text...")

    # Handle missing title/text values safely
    df["title"] = df["title"].fillna("").astype(str)
    df["text"] = df["text"].fillna("").astype(str)

    # Drop rows where both title and text are completely blank
    non_empty_mask = (df["title"].str.strip() != "") | (df["text"].str.strip() != "")
    df = df[non_empty_mask].reset_index(drop=True)

    # Remove duplicate articles
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["title", "text"], keep="first").reset_index(drop=True)
    duplicates_removed = before_dedup - len(df)
    print(f"      Removed {duplicates_removed:,} duplicate articles ({len(df):,} remaining)")

    # Shuffle the dataset using random_state=42
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    # Create content = title + " " + text
    df["content"] = (df["title"] + " " + df["text"]).str.strip()

    # Apply the shared NLP preprocessing function
    df["content"] = df["content"].apply(clean_text)

    # Drop any rows that became empty after removing non-alphabetic characters
    df = df[df["content"].str.len() > 0].reset_index(drop=True)
    print(f"      Final cleaned dataset size: {len(df):,} articles")
    print(
        f"      Class distribution: FAKE (0) = {int((df['label'] == 0).sum()):,}, "
        f"REAL (1) = {int((df['label'] == 1).sum()):,}"
    )

    # ------------------------------------------------------------------
    # [3/6] Creating TF-IDF features...
    # ------------------------------------------------------------------
    print("\n[3/6] Creating TF-IDF features...")
    X = df["content"]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )
    print(f"      Training set: {len(X_train):,} samples (80%)")
    print(f"      Testing set:  {len(X_test):,} samples (20%)")

    vectorizer = TfidfVectorizer(
        max_features=30000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
        stop_words="english",
    )

    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    print(f"      TF-IDF feature matrix shape (train): {X_train_tfidf.shape}")
    print(f"      TF-IDF feature matrix shape (test):  {X_test_tfidf.shape}")

    # ------------------------------------------------------------------
    # [4/6] Training model...
    # ------------------------------------------------------------------
    print("\n[4/6] Training model...")
    model = LogisticRegression(max_iter=2000, random_state=42)
    model.fit(X_train_tfidf, y_train)
    print("      LogisticRegression(max_iter=2000) training complete.")

    # ------------------------------------------------------------------
    # [5/6] Evaluating model...
    # ------------------------------------------------------------------
    print("\n[5/6] Evaluating model...")
    y_pred = model.predict(X_test_tfidf)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(
        y_test, y_pred, target_names=["FAKE (0)", "REAL (1)"], digits=4
    )

    print("\n" + "-" * 65)
    print("  MODEL EVALUATION RESULTS (20% Hold-out Test Set)")
    print("-" * 65)
    print(f"  Accuracy  : {acc * 100:.2f}% ({acc:.4f})")
    print(f"  Precision : {prec * 100:.2f}% ({prec:.4f})")
    print(f"  Recall    : {rec * 100:.2f}% ({rec:.4f})")
    print(f"  F1 Score  : {f1 * 100:.2f}% ({f1:.4f})")
    print("\n  Confusion Matrix:")
    print("                  Predicted FAKE (0)   Predicted REAL (1)")
    print(f"  Actual FAKE (0)     {cm[0][0]:>10}           {cm[0][1]:>10}")
    print(f"  Actual REAL (1)     {cm[1][0]:>10}           {cm[1][1]:>10}")
    print("\n  Classification Report:")
    print(report)
    print("-" * 65)

    # ------------------------------------------------------------------
    # [6/6] Saving model...
    # ------------------------------------------------------------------
    print("\n[6/6] Saving model...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"      Saved trained model to:      {MODEL_PATH}")
    print(f"      Saved TF-IDF vectorizer to:  {VECTORIZER_PATH}")

    # Save final_dataset.csv
    df.to_csv(FINAL_DATASET_PATH, index=False, encoding="utf-8")
    print(f"      Saved processed dataset to:  {FINAL_DATASET_PATH}")

    # Save actual evaluation metrics JSON for reference by API/dashboard
    metrics_payload = {
        "accuracy": round(float(acc) * 100, 2),
        "precision": round(float(prec) * 100, 2),
        "recall": round(float(rec) * 100, 2),
        "f1_score": round(float(f1) * 100, 2),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "total_samples": int(len(df)),
        "vocabulary_size": int(len(vectorizer.vocabulary_)),
        "confusion_matrix": cm.tolist(),
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print("\nTraining pipeline completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
