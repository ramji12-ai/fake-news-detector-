# Fake News Detection Using Natural Language Processing

An end-to-end full-stack **Natural Language Processing (NLP)** and **Machine Learning** web application that classifies news articles as **FAKE** or **REAL** based on linguistic patterns in the headline and article body.

> **Important Disclaimer:** This is a supervised machine-learning text classification system. Predictions reflect statistical and linguistic patterns learned from the training corpus and should not be treated as definitive fact-checking or truth verification.

---

## 1. Project Title
**Fake News Detection Using Natural Language Processing**

---

## 2. Project Overview
The rapid spread of misinformation across digital media makes automated linguistic screening an important tool for information literacy. This project provides a complete, reproducible machine-learning pipeline and full-stack web application:
- **Shared NLP Preprocessing Pipeline** (`backend/model_utils.py`) used identically during model training and real-time inference.
- **TF-IDF Feature Extraction** capturing both single words (unigrams) and two-word phrases (bigrams) with sublinear term-frequency scaling.
- **Logistic Regression Classifier** outputting binary predictions (`FAKE` or `REAL`) along with calibrated probability confidence scores via `predict_proba()`.
- **Flask REST API** (`backend/app.py`) serving predictions with input validation and CORS support.
- **Modern Dark-UI Frontend** (`frontend/`) built with semantic HTML5, CSS3, and Vanilla JavaScript.

---

## 3. Problem Statement
Online platforms publish thousands of news stories every minute, making purely manual verification slow and unscalable. Deceptive and fabricated news articles often exhibit distinct stylistic, lexical, and structural patterns compared to standard journalistic reporting. The goal of this project is to design and deploy a supervised NLP classification pipeline capable of analyzing raw news headlines and article text and estimating the probability that an article belongs to the **FAKE** or **REAL** class.

---

## 4. Objectives
1. Combine and clean labeled news datasets (`Fake.csv` and `True.csv`), handling missing values and removing duplicate articles safely.
2. Build a unified, reusable NLP text preprocessing pipeline (`clean_text`) shared between model training and API inference to eliminate training-serving skew.
3. Extract high-dimensional n-gram features using **TF-IDF Vectorization** (`max_features=30000`, `ngram_range=(1, 2)`, `min_df=2`, `sublinear_tf=True`, `stop_words="english"`).
4. Train and evaluate a **Logistic Regression** classifier (`max_iter=2000`) on a stratified 80/20 train-test split.
5. Expose the trained pipeline via a **Flask REST API** (`GET /` and `POST /predict`).
6. Build a responsive, professional **Frontend Web Application** that communicates with the backend API in real time.

---

## 5. Features
- **Zero Training-Serving Skew:** Both `train_model.py` and `backend/app.py` import the exact same `clean_text()` and `combine_title_and_text()` functions from `backend/model_utils.py`.
- **Real-Time Classification & Confidence Score:** Computes calibrated class probabilities (`0.00%` – `100.00%`) using `predict_proba()` and renders an animated confidence bar.
- **Interactive Analyzer Workspace:**
  - Headline input and full article content textarea
  - Live character and word counter
  - **Example Article** loader for quick demonstration
  - **Clear / Reset** button
  - Loading state and comprehensive error handling (empty input, short text, missing model files, or offline backend)
- **Live API & Model Health Indicator:** Automatically checks `GET http://127.0.0.1:5000/` and displays whether the backend and `.pkl` artifacts are loaded.
- **Jupyter Notebooks for Research & Viva:** Dedicated notebooks for Exploratory Data Analysis (`01_eda.ipynb`), NLP Preprocessing (`02_preprocessing.ipynb`), and Model Evaluation (`03_model_evaluation.ipynb`).

---

## 6. Technologies Used
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Programming Language** | Python 3.10+ | Core ML pipeline and backend development |
| **Data Manipulation** | Pandas, NumPy | Dataset loading, deduplication, shuffling, and cleaning |
| **NLP & Machine Learning** | Scikit-Learn (`TfidfVectorizer`, `LogisticRegression`) | Feature extraction, classification, and evaluation metrics |
| **Model Serialization** | Joblib | Saving and loading `.pkl` model and vectorizer artifacts |
| **Backend API** | Flask, Flask-CORS | REST API endpoints (`GET /`, `POST /predict`) |
| **Frontend UI** | HTML5, CSS3, Vanilla JavaScript (`fetch` API) | Responsive dark-themed web interface |
| **Analysis & Visualization** | Jupyter Notebook, Matplotlib, Seaborn | EDA, preprocessing demos, and confusion matrix plots |

---

## 7. Dataset
The training script expects two CSV files inside the `dataset/` directory:
- `dataset/Fake.csv` &rarr; Assigned label `0` (**FAKE**)
- `dataset/True.csv` &rarr; Assigned label `1` (**REAL**)

### Expected Columns
Each CSV file contains:
- `title`: The headline of the news article
- `text`: The body content of the news article
- `subject`: Article category/topic
- `date`: Publication date

### Dataset Preparation Steps
1. Assign `label = 0` to `Fake.csv` and `label = 1` to `True.csv`.
2. Concatenate both datasets into a single DataFrame.
3. Safely handle missing `title` and `text` values (`fillna("")`) and drop blank rows.
4. Remove duplicate articles based on `(title, text)`.
5. Shuffle the combined dataset using `random_state=42`.
6. Create the unified feature column: `content = title + " " + text`.
7. Save the cleaned dataset to `dataset/final_dataset.csv`.

---

## 8. NLP Pipeline
All text passes through `clean_text()` in `backend/model_utils.py`:
1. **Lowercase Conversion:** Converts all characters to lowercase.
2. **URL Removal:** Strips `http://`, `https://`, and `www.` links using regular expressions.
3. **HTML Tag Removal:** Removes embedded HTML tags (`<...>`).
4. **Non-Alphabetic Filtering:** Removes numbers, punctuation, and special symbols (`[^a-z\s]`).
5. **Whitespace Normalization:** Collapses multiple spaces/newlines into a single space.
6. **Boundary Stripping:** Removes leading and trailing whitespace.

```text
Article (Title + Text) ──► Text Cleaning ──► TF-IDF Vectorizer ──► Logistic Regression ──► Prediction (FAKE / REAL)
```

---

## 9. Machine Learning Model
### Feature Extraction: `TfidfVectorizer`
```python
TfidfVectorizer(
    max_features=30000,
    ngram_range=(1, 2),
    min_df=2,
    sublinear_tf=True,
    stop_words="english"
)
```
### Classifier: `LogisticRegression`
```python
LogisticRegression(max_iter=2000, random_state=42)
```
- **Train / Test Split:** 80% Training, 20% Testing (`random_state=42`, `stratify=y`)
- **Saved Artifacts:**
  - `models/fake_news_model.pkl`
  - `models/tfidf_vectorizer.pkl`

---

## 10. System Architecture
```text
┌──────────────────────────────────────────────────────────────┐
│                 Frontend (HTML / CSS / JS)                   │
│   Headline + Article Input  ───►  fetch POST /predict        │
└──────────────────────────────┬───────────────────────────────┘
                               │ JSON { "title", "text" }
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Flask Backend API (backend/app.py)           │
│   1. Input Validation                                        │
│   2. Combine title + " " + text                              │
│   3. NLP Preprocessing (backend/model_utils.py: clean_text)  │
│   4. TF-IDF Transformation (models/tfidf_vectorizer.pkl)     │
│   5. Logistic Regression (models/fake_news_model.pkl)        │
└──────────────────────────────┬───────────────────────────────┘
                               │ JSON { "prediction", "confidence" }
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Classification Result UI                     │
│   Displays REAL / FAKE badge + Confidence % Progress Bar     │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Project Structure
```text
Fake-News-Detection/
│
├── dataset/
│   ├── Fake.csv                  # Raw fake news dataset (place here before training)
│   ├── True.csv                  # Raw real news dataset (place here before training)
│   └── final_dataset.csv         # Generated automatically by train_model.py
│
├── models/
│   ├── fake_news_model.pkl       # Trained Logistic Regression model (generated by train_model.py)
│   └── tfidf_vectorizer.pkl      # Fitted TF-IDF vectorizer (generated by train_model.py)
│
├── notebooks/
│   ├── 01_eda.ipynb              # Exploratory Data Analysis & visualizations
│   ├── 02_preprocessing.ipynb    # Step-by-step NLP cleaning & TF-IDF demonstration
│   └── 03_model_evaluation.ipynb # Model training, metrics & confusion matrix heatmap
│
├── backend/
│   ├── app.py                    # Flask REST API server (GET /, POST /predict)
│   └── model_utils.py            # Shared NLP preprocessing & model inference service
│
├── frontend/
│   ├── index.html                # Main web application interface
│   ├── style.css                 # Modern dark UI styling & responsive layout
│   └── script.js                 # Frontend logic & fetch() API integration
│
├── train_model.py                # End-to-end model training & evaluation script
├── requirements.txt              # Python package dependencies
├── README.md                     # Project documentation
└── .gitignore                    # Git ignore rules
```

---

## 12. Installation
1. Clone or open the project root folder in your terminal.
2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # macOS / Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 13. Training Instructions
1. Place `Fake.csv` and `True.csv` inside the `dataset/` directory:
   - `dataset/Fake.csv`
   - `dataset/True.csv`
2. Run the training script from the project root:
   ```bash
   python train_model.py
   ```
3. The script will execute the 6-stage pipeline (`[1/6]` through `[6/6]`), print the evaluation metrics (Accuracy, Precision, Recall, F1 Score, Classification Report, and Confusion Matrix), and save:
   - `models/fake_news_model.pkl`
   - `models/tfidf_vectorizer.pkl`
   - `dataset/final_dataset.csv`

---

## 14. Backend Instructions
Start the Flask API server from the project root:
```bash
python backend/app.py
```
The backend will start on `http://127.0.0.1:5000`.

---

## 15. Frontend Instructions
1. Ensure the Flask backend is running (`python backend/app.py`).
2. Open `frontend/index.html` directly in any modern web browser (Chrome, Edge, Firefox), or serve it via a local static server such as:
   ```bash
   python -m http.server 8080 --directory frontend
   ```
   and visit `http://127.0.0.1:8080`.

---

## 16. API Documentation

### 1. Health Check
- **Endpoint:** `GET /`
- **Response (`200 OK`):**
  ```json
  {
      "message": "Fake News Detection API is running",
      "model_loaded": true,
      "model_info": {
          "classes": "Fake / Real",
          "feature_extraction": "TF-IDF",
          "max_features": 30000,
          "model": "Logistic Regression",
          "model_loaded": true,
          "ngrams": "Unigram + Bigram",
          "testing_split": "20%",
          "training_split": "80%"
      }
  }
  ```

### 2. Predict News Classification
- **Endpoint:** `POST /predict`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
      "title": "News headline",
      "text": "News article content"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
      "prediction": "REAL",
      "confidence": 94.32
  }
  ```
- **Error Responses:**
### 3. AI News Assistant (Google Search Grounding)
- **Endpoint:** `POST /chat`
- **Headers:** `Content-Type: application/json`
- **Environment Variable Required:** `GEMINI_API_KEY` (set in `.env` at the project root; see `.env.example`)
- **Request Body:**
  ```json
  {
      "message": "What are the latest AI news today?",
      "history": []
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
      "answer": "Here are the latest AI developments...",
      "sources": [
          {
              "title": "Source Article Headline",
              "url": "https://...",
              "domain": "reuters.com",
              "snippet": "Grounded citation excerpt..."
          }
      ],
      "search_queries": ["latest AI news today"],
      "search_used": true,
      "temporal_context": "current"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Empty message or invalid JSON payload.
  - `503 Service Unavailable`: `GEMINI_API_KEY` is not set in `.env` or environment variables.
  - `502 Bad Gateway`: Upstream Gemini API or network failure.

---

## 17. Results
Evaluated on the 20% stratified hold-out test set (**7,820 test articles** out of **39,100 unique cleaned articles**; **31,280 training articles**, **30,000 TF-IDF features**):

| Metric | Score |
| :--- | :--- |
| **Accuracy** | **99.02%** |
| **Precision** | **98.51%** |
| **Recall** | **99.69%** |
| **F1 Score** | **99.10%** |

### Confusion Matrix (Test Set)
| | Predicted FAKE (0) | Predicted REAL (1) |
| :--- | :---: | :---: |
| **Actual FAKE (0)** | 3,517 | 64 |
| **Actual REAL (1)** | 13 | 4,226 |

---

## 18. Limitations
- **Statistical Pattern Recognition Only:** The model evaluates lexical and stylistic patterns rather than performing real-time external fact-checking against live knowledge bases.
- **Domain & Temporal Drift:** Models trained on historical political or world news corpora may experience reduced accuracy on emerging topics, satire, or non-English articles.
- **Short Input Sensitivity:** Very short snippets (e.g., 1–2 words) lack sufficient n-gram context for reliable classification.

---

## 19. Future Scope
- Incorporate transformer-based contextual embeddings (e.g., DistilBERT / RoBERTa) alongside TF-IDF baselines.
- Add explainable AI (XAI) token-level highlighting (e.g., LIME or SHAP) to show which specific words or bigrams contributed most to a `FAKE` or `REAL` classification.
- Integrate source credibility metadata and cross-reference claims with verified fact-checking APIs.
