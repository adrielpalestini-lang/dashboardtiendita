// Se importa una sola vez (desde AuthContext). Hace dos cosas con TODAS las llamadas al API:
//  1) agrega  Authorization: Bearer <token>  si hay sesión
//  2) si el servidor responde 401 teniendo sesión (token vencido/ inválido) => cierra sesión
// Así no hay que tocar api.js ni cada página.
const KEY = 'dashboard_user';

export const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')?.token || null;
  } catch {
    return null;
  }
};

const isApiUrl = (url) => /azurewebsites\.net|\/api\//.test(url);
const isLoginUrl = (url) => /\/auth\/login/.test(url);

if (typeof window !== 'undefined' && !window.__authFetchInstalled) {
  window.__authFetchInstalled = true;
  const orig = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || String(input);
    const api = isApiUrl(url) && !isLoginUrl(url);
    const token = api ? getToken() : null;

    if (token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }

    const res = await orig(input, init);

    if (res.status === 401 && token) {
      try { localStorage.removeItem(KEY); } catch {}
      window.dispatchEvent(new Event('auth:expired'));
    }
    return res;
  };
}