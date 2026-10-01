/**
 * API service for VeriText NLP User Authentication, Prediction History, and Saved Articles.
 * Communicates with the Flask backend running at http://127.0.0.1:5000.
 */

export const API_BASE_URL = "http://127.0.0.1:5000";
export const TOKEN_STORAGE_KEY = "veritext_auth_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch (_e) {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (_e) {}
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (_e) {}
}

function getAuthHeaders(token) {
  const t = token || getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  if (t) {
    headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
}

// =========================================================================
// Authentication Endpoints
// =========================================================================

export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Registration failed with HTTP ${res.status}`);
  }
  return data;
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Login failed with HTTP ${res.status}`);
  }
  return data;
}

export async function apiGetMe(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Auth check failed with HTTP ${res.status}`);
  }
  return data;
}

export async function apiLogout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders()
    });
  } catch (_e) {}
  clearStoredToken();
}

// =========================================================================
// Prediction History Endpoints
// =========================================================================

export async function apiGetHistory(token) {
  const res = await fetch(`${API_BASE_URL}/history`, {
    method: "GET",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch history (HTTP ${res.status})`);
  }
  return data.history || [];
}

export async function apiAddHistory(record, token) {
  const res = await fetch(`${API_BASE_URL}/history`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(record)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to save history (HTTP ${res.status})`);
  }
  return data.record;
}

export async function apiImportHistoryBatch(records, token) {
  const res = await fetch(`${API_BASE_URL}/history/batch`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ records })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to import history (HTTP ${res.status})`);
  }
  return data;
}

export async function apiDeleteHistory(recordId, token) {
  const res = await fetch(`${API_BASE_URL}/history/${recordId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to delete record (HTTP ${res.status})`);
  }
  return data;
}

export async function apiClearHistory(token) {
  const res = await fetch(`${API_BASE_URL}/history`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to clear history (HTTP ${res.status})`);
  }
  return data;
}

// =========================================================================
// Saved Articles Endpoints
// =========================================================================

export async function apiGetSaved(token) {
  const res = await fetch(`${API_BASE_URL}/saved`, {
    method: "GET",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch saved articles (HTTP ${res.status})`);
  }
  return data.saved || [];
}

export async function apiAddSaved(article, token) {
  const res = await fetch(`${API_BASE_URL}/saved`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(article)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to save article (HTTP ${res.status})`);
  }
  return data;
}

export async function apiImportSavedBatch(articles, token) {
  const res = await fetch(`${API_BASE_URL}/saved/batch`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ articles })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to import saved articles (HTTP ${res.status})`);
  }
  return data;
}

export async function apiDeleteSaved(articleId, token) {
  const res = await fetch(`${API_BASE_URL}/saved/${articleId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to remove saved article (HTTP ${res.status})`);
  }
  return data;
}

export async function apiClearSaved(token) {
  const res = await fetch(`${API_BASE_URL}/saved`, {
    method: "DELETE",
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to clear saved articles (HTTP ${res.status})`);
  }
  return data;
}
