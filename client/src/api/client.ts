// Talks to the Verdict backend. Every screen will use this one helper.

const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000')

// The backend always sends errors as { error: { code, message, fields? } }
export class ApiError extends Error {
  status: number
  code: string
  fields?: unknown

  constructor(status: number, code: string, message: string, fields?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      // Sends the login cookie with every request
      credentials: 'include',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server. Is it running?')
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error
    throw new ApiError(
      res.status,
      err?.code ?? 'unknown_error',
      err?.message ?? 'Something went wrong.',
      err?.fields,
    )
  }

  return data as T
}