const API_BASE = import.meta.env.VITE_API_BASE || ''

let authToken = null
let refreshToken = null
let isRefreshing = false
let refreshSubscribers = []

export function setAuthToken(token) {
  authToken = token
}

export function setRefreshToken(token) {
  refreshToken = token
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token')

  const resp = await fetch(API_BASE + '/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!resp.ok) throw new Error('Refresh failed')

  const data = await resp.json()
  return data.token
}

async function request(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const resp = await fetch(API_BASE + path, Object.assign({}, opts, { headers }))

  // Gestion du token expiré
  if (resp.status === 401 && authToken && refreshToken && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        authToken = newToken
        setAuthToken(newToken)

        // Stocker le nouveau token
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('auth_token', newToken)

        isRefreshing = false
        onRefreshed(newToken)

        // Réessayer la requête originale
        return request(path, opts)
      } catch (err) {
        isRefreshing = false
        // Le refresh a échoué, déconnecter l'utilisateur
        authToken = null
        refreshToken = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('refresh_token')
        window.location.href = '/login'
        throw err
      }
    } else {
      // Un refresh est déjà en cours, attendre qu'il se termine
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          opts.headers = opts.headers || {}
          opts.headers['Authorization'] = `Bearer ${newToken}`
          resolve(request(path, opts))
        })
      })
    }
  }

  let payload
  try {
    payload = await resp.json()
  } catch {
    // no json
    payload = null
  }

  if (!resp.ok) {
    const message =
      (payload && (payload.error || payload.message)) || resp.statusText || 'Request failed'
    const err = new Error(message)
    err.status = resp.status
    err.payload = payload
    throw err
  }

  return payload
}

export async function post(path, body, opts = {}) {
  return request(path, Object.assign({ method: 'POST', body: JSON.stringify(body) }, opts))
}

export async function get(path, opts = {}) {
  return request(path, Object.assign({ method: 'GET' }, opts))
}

export async function patch(path, body, opts = {}) {
  return request(path, Object.assign({ method: 'PATCH', body: JSON.stringify(body) }, opts))
}

export async function del(path, opts = {}) {
  return request(path, Object.assign({ method: 'DELETE' }, opts))
}

export default { setAuthToken, setRefreshToken, post, get }
