// src/utils/api.js
// Centralized API helper — JSON by default, supports FormData, timeouts, and JWT auth.

// ✅ Use relative base by default so CRA/Vite proxy forwards to http://localhost:5000
// If you want to bypass the proxy, set REACT_APP_API_BASE (e.g., http://localhost:5000)
export const API_BASE = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");

// --- token helpers ---
export function setToken(token) {
  try { 
    localStorage.setItem("token", token); 
    console.log('Token stored:', token);
  } catch (e) {
    console.error('Failed to store token:', e);
  }
}
export function getToken() {
  try { 
    const token = localStorage.getItem("token");
    // Only log if debugging is needed - reduces console noise
    // console.log('Token retrieved:', token ? 'present' : 'missing');
    return token;
  } catch (e) {
    console.error('Failed to retrieve token:', e);
    return null;
  }
}
export function clearToken() {
  try { localStorage.removeItem("token"); } catch {}
}

// Build a full URL from a path
export function buildUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * api(path, options)
 * - method: HTTP method (default "GET")
 * - body: object for JSON or FormData for uploads
 * - headers: additional headers (Content-Type set automatically for JSON)
 * - timeoutMs: request timeout (default 12000ms)
 * - withCredentials: include cookies (default false)
 * - skipAuth: don't attach Authorization header (default false)
 * - redirectOn401: auto-redirect to /login on 401 (default false)
 */
export async function api(
  path,
  {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 12000,
    withCredentials = false,
    skipAuth = false,
    redirectOn401 = false,
  } = {}
) {
  const token = skipAuth ? null : getToken();
  // Only log API calls if debugging is needed - reduces console noise
  // console.log('API call to:', path, 'with token:', token ? 'present' : 'missing');
  const url = buildUrl(path);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  // If sending FormData, don't set Content-Type; the browser will add the boundary
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(withCredentials ? { credentials: "include" } : {}),
    signal: ctrl.signal,
  };

  if (body != null) {
    init.body = isForm ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch {
    clearTimeout(timer);
    throw new Error(
      "Network error: API unreachable. Ensure backend is running, dev proxy is set, or REACT_APP_API_BASE is correct."
    );
  }
  clearTimeout(timer);

  // Handle empty responses (e.g., 204 No Content)
  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { data = null; }
  }

  if (!res.ok) {
    if (res.status === 401 && redirectOn401) {
      clearToken();
      if (typeof window !== "undefined") window.location.assign("/login");
    }
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data ?? {};
}

// Convenience wrappers
export const get  = (p, o)          => api(p, { ...o, method: "GET" });
export const post = (p, body, o)     => api(p, { ...o, method: "POST", body });
export const put  = (p, body, o)     => api(p, { ...o, method: "PUT", body });
export const del  = (p, o)           => api(p, { ...o, method: "DELETE" });
