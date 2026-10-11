import { getToken } from './authFetch';

// Misma URL del API que en adminApi.js (sin /api al final)
const FALLBACK = 'https://comapi-g6angqhqeud2feas.centralus-01.azurewebsites.net';
const BASE = String(import.meta.env?.VITE_API_URL || FALLBACK).replace(/\/+$/, '').replace(/\/api$/, '');

export async function getCartRemovalsByCashier(warehouseId = 1, from, to) {
  const qs = new URLSearchParams({ warehouse_id: warehouseId });
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const token = getToken();
  const res = await fetch(`${BASE}/api/reports/cart-removals/by-cashier?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}