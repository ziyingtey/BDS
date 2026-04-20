/** API base: set VITE_API_BASE_URL at build time, or override in the dashboard header (saved to localStorage). */
const STORAGE_API = 'bds_staff_api_base'

export function getStoredApiBase() {
  try {
    return localStorage.getItem(STORAGE_API)?.trim() || ''
  } catch {
    return ''
  }
}

export function setStoredApiBase(url) {
  const u = url?.trim() || ''
  try {
    if (u) localStorage.setItem(STORAGE_API, u.replace(/\/$/, ''))
    else localStorage.removeItem(STORAGE_API)
  } catch {
    /* ignore */
  }
}

export function apiBase() {
  const fromStorage = getStoredApiBase()
  if (fromStorage) return fromStorage.replace(/\/$/, '')
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:5062'
}

async function api(path, opts = {}) {
  const { headers = {}, ...rest } = opts
  const res = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  })
  const text = await res.text()
  if (!res.ok) {
    let msg = text
    try {
      const j = JSON.parse(text)
      msg = j.message || j.title || text
    } catch {
      /* plain text */
    }
    throw new Error(msg || res.statusText)
  }
  if (!text) return null
  return JSON.parse(text)
}

export const staffApi = {
  listBranches: () => api('/api/branches'),
  listSlots: (branchId) => api(`/api/branches/${branchId}/slots`),
  dashboard: (branchId) => api(`/api/staff/branches/${branchId}/dashboard`),
  callNext: (branchId) =>
    api(`/api/staff/branches/${branchId}/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }),
  updateCounter: (branchId, counterId, body) =>
    api(`/api/staff/branches/${branchId}/counters/${counterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  patchPolicy: (branchId, body) =>
    api(`/api/staff/branches/${branchId}/policy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  simulatorJoin: (branchId, body) =>
    api(`/api/staff/branches/${branchId}/simulator/join-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}
