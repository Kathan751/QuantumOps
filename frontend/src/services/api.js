const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getToken() {
  return localStorage.getItem('assetflow_token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem('assetflow_token');
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const authApi = {
  login: (body) => api('/auth/login', { method: 'POST', body }),
  signup: (body) => api('/auth/signup', { method: 'POST', body }),
  me: () => api('/auth/me'),
  forgot: (body) => api('/auth/forgot-password', { method: 'POST', body })
};

export const orgApi = {
  departments: () => api('/org/departments'),
  saveDepartment: (body, id) => api(`/org/departments${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body }),
  categories: () => api('/org/categories'),
  saveCategory: (body, id) => api(`/org/categories${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body }),
  users: () => api('/org/users'),
  updateUser: (id, body) => api(`/org/users/${id}/role`, { method: 'PATCH', body })
};

export const assetApi = {
  list: (query = '') => api(`/assets${query}`),
  detail: (id) => api(`/assets/${id}`),
  create: (body) => api('/assets', { method: 'POST', body }),
  allocations: () => api('/allocations'),
  allocate: (body) => api('/allocations', { method: 'POST', body }),
  returnAllocation: (id, body) => api(`/allocations/${id}/return`, { method: 'POST', body }),
  transfers: () => api('/transfers'),
  requestTransfer: (body) => api('/transfers', { method: 'POST', body }),
  approveTransfer: (id) => api(`/transfers/${id}/approve`, { method: 'PATCH' }),
  rejectTransfer: (id, body) => api(`/transfers/${id}/reject`, { method: 'PATCH', body })
};

export const workflowApi = {
  resources: () => api('/resources'),
  book: (body) => api('/bookings', { method: 'POST', body }),
  updateBooking: (id, body) => api(`/bookings/${id}`, { method: 'PATCH', body }),
  maintenance: () => api('/maintenance'),
  createMaintenance: (body) => api('/maintenance', { method: 'POST', body }),
  transitionMaintenance: (id, action, body = {}) => api(`/maintenance/${id}/${action}`, { method: 'PATCH', body }),
  audits: () => api('/audits'),
  createAudit: (body) => api('/audits', { method: 'POST', body }),
  markAuditItem: (id, body) => api(`/audits/items/${id}`, { method: 'PATCH', body }),
  closeAudit: (id) => api(`/audits/${id}/close`, { method: 'PATCH' })
};

export const insightApi = {
  dashboard: () => api('/dashboard'),
  reports: () => api('/reports'),
  exportReport: (type) => `${API_URL}/reports/export?type=${encodeURIComponent(type)}`,
  notifications: () => api('/notifications'),
  markRead: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  logs: () => api('/activity-logs')
};
