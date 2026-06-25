const BASE_URL = 'http://localhost:3000/api'

async function request(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`
  const options = {
    method,
    headers: { ...headers }
  }

  if (body && !(body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  } else if (body) {
    options.body = body
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export function get(path) {
  return request('GET', path)
}

export function patch(path, body) {
  return request('PATCH', path, body)
}

export function post(path, body) {
  return request('POST', path, body)
}

export function del(path) {
  return request('DELETE', path)
}

export function postFile(path, fields) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  }
  return request('POST', path, formData)
}
