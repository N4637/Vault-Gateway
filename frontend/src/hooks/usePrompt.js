import { useState, useCallback } from 'react'
import { sendPrompt } from '../api/prompt'

/**
 * Manages the full prompt → response cycle.
 * Keeps a conversation history array so ChatPage can render all messages.
 */
export function usePrompt() {
  const [messages, setMessages] = useState([])   // { role, content, meta? }
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const submit = useCallback(async (text) => {
    if (!text.trim() || loading) return

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    setError(null)

    try {
      const data = await sendPrompt(text)

      // Assistant message carries full metadata for MaskViewer
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.llm_response,
          meta: {
            maskedPrompt:      data.masked_prompt,
            detectedEntities:  data.detected_entities,
            entitySummary:     data.entity_summary,
            piiDetected:       data.pii_detected,
            unresolved:        data.unresolved_placeholders,
          },
        },
      ])
    } catch (e) {
      setError(e.message)
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clearHistory = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, submit, clearHistory }
}
