import { NextResponse, type NextRequest } from 'next/server';
import { requireOperator } from '@/lib/api/require-operator';

export async function POST(request: NextRequest) {
  try {
    const denied = await requireOperator();
    if (denied) return denied;
    const payload = await request.json();
    const backendUrl = (process.env.SCANNER_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
    const response = await fetch(`${backendUrl}/api/scans`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(() => ({ error: 'Backend returned an invalid response' }));
    return NextResponse.json(body, { status: response.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error && err.name === 'TimeoutError' ? 'VanguardAPI backend request timed out' : err instanceof Error ? err.message : 'VanguardAPI backend is unavailable' },
      { status: err instanceof Error && err.name === 'TimeoutError' ? 504 : 503 }
    );
  }
}
