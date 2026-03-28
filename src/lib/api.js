import { getToken, removeToken } from './jwt';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function apiFetch(input, init = {}) {
  const url = /^https?:\/\//.test(input) ? input : `${API_BASE}${input}`;
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (init.body && !headers.has('Content-Type') && typeof init.body === 'object') {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(init.body);
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('jwt:unauthorized', { detail: { url } }));
  }
  return res;
}

export async function apiJson(input, init = {}) {
  const res = await apiFetch(input, init);
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : null;
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error('JSON parse error for URL:', input, 'Response text:', text);
    return { ok: res.ok, status: res.status, data: text };
  }
}

export default {
  apiFetch,
  apiJson,
};
