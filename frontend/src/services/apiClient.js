// Simple API client wrapper using fetch with base URL and Authorization header support.
const BASE = import.meta.env.VITE_API_BASE_URL || '';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}

function getAuthHeader() {
  const token = localStorage.getItem('sms_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function post(path, body, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    body: JSON.stringify(body),
    ...opts.fetchOptions,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function get(path, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    ...opts.fetchOptions,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function getBlob(path, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    ...opts.fetchOptions,
  });

  const data = await res.blob().catch(() => null);
  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function put(path, body, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    body: JSON.stringify(body),
    ...opts.fetchOptions,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function patch(path, body, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    body: JSON.stringify(body),
    ...opts.fetchOptions,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function del(path, opts = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
      ...(opts.headers || {}),
    },
    ...opts.fetchOptions,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default { post, get, getBlob, put, patch, del };
