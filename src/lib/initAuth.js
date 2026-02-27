import { getToken, removeToken } from './jwt';

export default function initAuth({ onUnauthorized } = {}) {
  if (typeof window === 'undefined') return;
  if (window._jwt_init_done) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init = {}) {
    const token = getToken();
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await originalFetch(input, { ...init, headers });
    if (res.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('jwt:unauthorized', { detail: { url: input } }));
      if (typeof onUnauthorized === 'function') onUnauthorized(res);
    }
    return res;
  };

  if (typeof onUnauthorized === 'function') {
    window.addEventListener('jwt:unauthorized', (e) => onUnauthorized(e.detail));
  }

  window._jwt_init_done = true;
}
