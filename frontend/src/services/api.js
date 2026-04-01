const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, { ...options, headers })

  if (res.status === 401) {
    // try refresh
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      const r = await fetch(BASE + '/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (r.ok) {
        const d = await r.json()
        localStorage.setItem('access_token', d.access)
        headers['Authorization'] = `Bearer ${d.access}`
        const retry = await fetch(BASE + path, { ...options, headers })
        return retry.ok ? retry.json() : Promise.reject(await retry.json())
      }
    }
    localStorage.clear()
    window.location.href = '/login'
    return
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return Promise.reject(data)
  return data
}

export const api = {
  login: (email, password) =>
    fetch(BASE + '/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  me: () => request('/users/me/'),

  // Dashboard
  summary: (params = '') => request(`/dashboard/summary/${params}`),
  categories: () => request('/dashboard/categories/'),
  recent: (limit = 8) => request(`/dashboard/recent/?limit=${limit}`),
  monthly: () => request('/dashboard/trends/monthly/'),
  weekly: () => request('/dashboard/trends/weekly/'),

  // Records
  records: (qs = '') => request(`/records/${qs}`),
  createRecord: (body) => request('/records/', { method: 'POST', body: JSON.stringify(body) }),
  updateRecord: (id, body) => request(`/records/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRecord: (id) => request(`/records/${id}/`, { method: 'DELETE' }),

  // Users
  users: () => request('/users/'),
  createUser: (body) => request('/users/', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}/`, { method: 'DELETE' }),
}
