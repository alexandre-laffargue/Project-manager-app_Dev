const API_BASE = import.meta.env.VITE_API_BASE || ''

let authToken = null

export function setAuthToken(token) {
  authToken = token
}

async function request(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const resp = await fetch(API_BASE + path, Object.assign({}, opts, { headers }))
  let payload
  try {
    payload = await resp.json()
  } catch {
    // no json
    payload = null
  }

  if (!resp.ok) {
    const message = (payload && (payload.error || payload.message)) || resp.statusText || 'Request failed'
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

export default { setAuthToken, post, get }
