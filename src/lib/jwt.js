// Robust JWT helpers for storing token in localStorage
const TOKEN_KEY = 'jwt_token';

function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    if (token) ls.setItem(TOKEN_KEY, token);
    else ls.removeItem(TOKEN_KEY);
  } catch (e) { /* ignore write errors */ }
}

export function getToken() {
  const ls = safeLocalStorage();
  if (!ls) return null;
  try {
    return ls.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function removeToken() {
  setToken(null);
}

export function getAuthHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default {
  setToken,
  getToken,
  removeToken,
  getAuthHeader,
};
