import { NextResponse, type NextRequest } from 'next/server';
import dns from 'dns/promises';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { targetId, baseUrl, verificationToken, verificationMethod, developerAttestation } =
      await request.json();

    if (!baseUrl || !verificationToken) {
      return NextResponse.json(
        { error: 'Target URL and verification token are required.' },
        { status: 400 }
      );
    }

    const url = new URL(baseUrl);
    const hostname = url.hostname;

    let isVerified = false;
    let failureReason = '';

    // 1. Developer Attestation / Self-Authorization
    if (developerAttestation === true || verificationMethod === 'developer_attestation') {
      isVerified = true;
    }
    // 2. Automatic approval for local loopback test sandboxes
    else if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) {
      isVerified = true;
    }
    // 3. HTTP /.well-known verification file check
    else if (verificationMethod === 'well_known') {
      try {
        const verifyUrl = new URL('/.well-known/vanguardapi-verify.txt', baseUrl).toString();
        const res = await fetch(verifyUrl, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'VanguardAPI-Domain-Verifier/1.0' },
        });

        if (res.ok) {
          const text = (await res.text()).trim();
          if (text.includes(verificationToken)) {
            isVerified = true;
          } else {
            failureReason = `File at ${verifyUrl} does not match token '${verificationToken}'.`;
          }
        } else {
          failureReason = `HTTP check to ${verifyUrl} returned status ${res.status}.`;
        }
      } catch (err: unknown) {
        failureReason = `Unable to connect to /.well-known endpoint: ${
          err instanceof Error ? err.message : 'Timeout'
        }`;
      }
    }
    // 4. DNS TXT record check
    else if (verificationMethod === 'dns_txt') {
      try {
        const txtRecords = await dns.resolveTxt(hostname);
        const flatRecords = txtRecords.flat();
        if (flatRecords.some((r) => r.includes(verificationToken))) {
          isVerified = true;
        } else {
          failureReason = `No DNS TXT record matching '${verificationToken}' found on ${hostname}.`;
        }
      } catch (err: unknown) {
        failureReason = `DNS lookup failed for ${hostname}: ${
          err instanceof Error ? err.message : 'No TXT record found'
        }`;
      }
    }

    if (isVerified) {
      // Update Supabase target status if logged in
      const supabase = await createClient();
      if (targetId) {
        await supabase
          .from('targets')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', targetId);
      }

      return NextResponse.json({
        verified: true,
        message: `Domain '${hostname}' successfully verified. Target is authorized for scanning.`,
      });
    } else {
      return NextResponse.json(
        {
          verified: false,
          error: failureReason || 'Ownership verification check failed.',
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification request failed' },
      { status: 500 }
    );
  }
}
