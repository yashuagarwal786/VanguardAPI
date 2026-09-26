import { NextResponse } from 'next/server';

export async function GET() {
  const scannerUrl = (process.env.SCANNER_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
  try {
    const [scanner, demo] = await Promise.all([
      fetch(`${scannerUrl}/api/health`, { cache: 'no-store', signal: AbortSignal.timeout(1500) }),
      fetch('http://127.0.0.1:4000/openapi.json', { cache: 'no-store', signal: AbortSignal.timeout(1500) }),
    ]);
    if (!scanner.ok || !demo.ok) throw new Error('A required service is not ready');
    return NextResponse.json({ status: 'ok', service: 'vanguardapi', scanner: 'ok', demo: 'ok' });
  } catch {
    return NextResponse.json({ status: 'starting', service: 'vanguardapi' }, { status: 503 });
  }
}
