const BASE = '/api'

export async function fetchStats() {
  const res = await fetch(`${BASE}/dashboard/stats`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
