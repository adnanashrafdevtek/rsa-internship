// src/lib/jwt.js
const TOKEN_KEY = 'jwt_token';

function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  if (!token) return;
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(TOKEN_KEY, token);
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
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(TOKEN_KEY);
  } catch (e) { /* ignore */ }
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