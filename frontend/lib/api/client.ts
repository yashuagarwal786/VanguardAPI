const API_ROOT = '/api/sentinel';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      cache: 'no-store',
      signal: init?.signal ?? AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') throw new Error('The request timed out. Check the backend and try again.');
    throw new Error('Cannot reach VanguardAPI scanner. Please try again.');
  }
  const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new Error(payload.error || payload.message || `VanguardAPI returned HTTP ${response.status}`);
  return payload as T;
}
