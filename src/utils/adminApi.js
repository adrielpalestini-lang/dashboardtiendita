import { getToken } from './authFetch';

// URL del API (sin /api al final). Si usas VITE_API_URL en tu proyecto, se toma de ahí.
// Si no, se usa esta (la de tu App Service). Si api.js apunta a otra, cámbiala aquí.
const FALLBACK = 'https://comapi-g6angqhqeud2feas.centralus-01.azurewebsites.net';
const BASE = String(import.meta.env?.VITE_API_URL || FALLBACK).replace(/\/+$/, '').replace(/\/api$/, '');

async function req(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

export const adminListUsers = () => req('GET', '/admin/users');
export const adminCreateUser = (b) => req('POST', '/admin/users', b);
export const adminUpdateUser = (id, b) => req('PUT', `/admin/users/${id}`, b);
export const adminListOrgs = () => req('GET', '/admin/organizations');
export const adminCreateOrg = (b) => req('POST', '/admin/organizations', b);
export const adminUpdateOrg = (id, b) => req('PUT', `/admin/organizations/${id}`, b);