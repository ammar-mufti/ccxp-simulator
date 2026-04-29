export interface LLMPayload {
  type: 'generate-questions' | 'generate-content' | 'study-plan'
  domain: string
  count?: number
  extra?: string
}

export async function callLLM(payload: LLMPayload, token: string): Promise<unknown> {
  const res = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Worker error: ${res.status}`)
  return res.json()
}
