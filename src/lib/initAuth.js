import { getToken } from './jwt';

export function initAuth({ onUnauthorized } = {}) {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const token = getToken();
    const headers = new Headers((init && init.headers) || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await originalFetch(input, { ...init, headers });
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('jwt:unauthorized', { detail: { url: input } }));
      if (typeof onUnauthorized === 'function') onUnauthorized(res);
    }
    return res;
  };

  if (typeof onUnauthorized === 'function') {
    window.addEventListener('jwt:unauthorized', (e) => onUnauthorized(e.detail));
  }
}

export default initAuth;
