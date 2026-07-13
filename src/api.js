export const API_URL = 'https://comapi-g6angqhqeud2feas.centralus-01.azurewebsites.net';

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}


export const getCafeTopProducts = (warehouseId = 1, from, to) => {
  const params = new URLSearchParams({ warehouse_id: warehouseId });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch(`/api/reports/cafe-top-products?${params}`);
};


// ---- Auth ----
export const login = (email, password) =>
  apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// ---- Organizations ----
export const getOrganizations = () => apiFetch('/api/organizations');

// ---- Cash cuts ----
export const getCashCutsHistory = (warehouseId = 1, page = 1, limit = 15) =>
  apiFetch(`/api/cash-cuts?warehouse_id=${warehouseId}&page=${page}&limit=${limit}`);
export const getCashCutSales = (cutId) => apiFetch(`/api/cash-cuts/${cutId}/sales`);
export const getCashCutSummary = (warehouseId = 1) =>
  apiFetch(`/api/cash-cuts/summary?warehouse_id=${warehouseId}`);

// ---- Reports ----
export const getSalesDaily = (warehouseId = 1, from, to) => {
  const params = new URLSearchParams({ warehouse_id: warehouseId });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch(`/api/reports/sales-daily?${params}`);
};
export const getSalesLive = (warehouseId = 1, minutes = 240) =>
  apiFetch(`/api/reports/sales-live?warehouse_id=${warehouseId}&minutes=${minutes}`);

// ---- Products (tienda, org 1) ----
export const getProductsList = (orgId, page = 1, limit = 20, q = '') => {
  const params = new URLSearchParams({ org_id: orgId, page, limit });
  if (q) params.append('q', q);
  return apiFetch(`/api/products/list?${params}`);
};
export const createProduct = (payload) =>
  apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
export const updateProduct = (id, payload) =>
  apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const toggleProductActive = (id, orgId, isActive) =>
  apiFetch(`/api/products/${id}/toggle-active`, {
    method: 'PUT',
    body: JSON.stringify({ org_id: orgId, is_active: isActive }),
  });

// ---- Cafe products (org 2) ----
export const getCafeProductsList = (orgId = 2) => apiFetch(`/api/cafe/products/list?org_id=${orgId}`);
export const createCafeProduct = (payload) =>
  apiFetch('/api/cafe/products', { method: 'POST', body: JSON.stringify(payload) });
export const updateCafeProduct = (id, payload) =>
  apiFetch(`/api/cafe/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

// ---- Cafe modifier groups ----
export const getCafeModifierGroups = (orgId = 2) => apiFetch(`/api/cafe/modifier-groups?org_id=${orgId}`);
export const createCafeModifierGroup = (payload) =>
  apiFetch('/api/cafe/modifier-groups', { method: 'POST', body: JSON.stringify(payload) });
export const updateCafeModifierGroup = (id, payload) =>
  apiFetch(`/api/cafe/modifier-groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

// ---- Cafe modifier options ----
export const getCafeModifierOptions = (groupId) => apiFetch(`/api/cafe/modifier-groups/${groupId}/options`);
export const createCafeModifierOption = (payload) =>
  apiFetch('/api/cafe/modifier-options', { method: 'POST', body: JSON.stringify(payload) });
export const updateCafeModifierOption = (id, payload) =>
  apiFetch(`/api/cafe/modifier-options/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

// ---- Link modifier groups to cafe products ----
export const getCafeProductModifiers = (productId) => apiFetch(`/api/cafe/products/${productId}/modifiers`);
export const linkModifierGroup = (productId, groupId, sortOrder) =>
  apiFetch(`/api/cafe/products/${productId}/modifier-groups`, {
    method: 'POST',
    body: JSON.stringify({ group_id: groupId, sort_order: sortOrder }),
  });
export const unlinkModifierGroup = (productId, groupId) =>
  apiFetch(`/api/cafe/products/${productId}/modifier-groups/${groupId}`, { method: 'DELETE' });
