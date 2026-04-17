const BASE = '/api'

/**
 * Send a raw prompt to Vault backend.
 * Returns the full PromptResponse object.
 */
export async function sendPrompt(prompt, systemMessage = null) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      system_message: systemMessage,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}
