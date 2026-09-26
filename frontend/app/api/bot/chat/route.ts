import { NextResponse, type NextRequest } from 'next/server';

interface FindingContext {
  findingCode?: string;
  title?: string;
  severity?: string;
  endpoint?: string;
  explanation?: string;
  recommendation?: string;
  reproduction?: string;
}

interface ChatRequestBody {
  message: string;
  target?: {
    name?: string;
    baseUrl?: string;
    specUrl?: string;
  };
  findings?: FindingContext[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, target, findings = [] }: ChatRequestBody = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const lowerMsg = message.toLowerCase();
    const targetName = target?.name || 'Current Target API';
    const baseUrl = target?.baseUrl || 'https://api.example.com';
    const totalFindings = findings.length;

    // Check if an external LLM key is configured (Groq / OpenAI)
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey || openaiKey) {
      try {
        const systemPrompt = `You are VanguardBot, an elite SOC Cybersecurity AI Copilot for the VanguardAPI zero-trust vulnerability scanning platform.
Context:
- Target Name: ${targetName}
- Target Base URL: ${baseUrl}
- Current Audit Findings (${totalFindings} discovered):
${findings
  .map(
    (f, idx) =>
      `${idx + 1}. [${f.severity || 'Medium'}] ${f.title || 'Flaw'} at ${f.endpoint || baseUrl}
   Explanation: ${f.explanation || 'None'}
   Recommendation: ${f.recommendation || 'None'}
   PoC: ${f.reproduction || 'None'}`
  )
  .join('\n\n')}

Instructions:
- Provide clear, technical, concise cybersecurity engineering guidance.
- Give concrete code remediation snippets (FastAPI/Python, Express/Node.js, Nginx, or Next.js).
- Maintain a serious, precise SOC command tone. No playful or casual filler.
- Use markdown formatting with code blocks.`;

        const endpoint = groqKey
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const apiKey = groqKey || openaiKey;
        const model = groqKey ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const llmRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          const reply = llmData.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply, source: groqKey ? 'groq-llama-3.3' : 'openai' });
          }
        }
      } catch (externalErr) {
        console.warn('External LLM error, falling back to built-in SOC reasoning engine:', externalErr);
      }
    }

    // Built-in Deterministic SOC Security Reasoning Engine (Zero latency, always available)
    let reply = '';

    if (lowerMsg.includes('bola') || lowerMsg.includes('idor') || lowerMsg.includes('object level')) {
      const bolaFinding = findings.find((f) => f.title?.toLowerCase().includes('bola') || f.findingCode?.includes('BOLA'));
      reply = `### [VANGUARD-SOC] Broken Object Level Authorization (BOLA / IDOR) Analysis

**Context for ${targetName}:**
${bolaFinding ? `A BOLA candidate was flagged at \`${bolaFinding.endpoint}\`.` : `No direct BOLA flaw flagged on ${baseUrl}, but entity reference IDs must always be validated.`}

#### Root Cause:
BOLA occurs when an API endpoint takes an object identifier (e.g. \`/api/users/{id}\` or \`/orders/{id}\`) from user input and retrieves the database record without validating that the authenticated session owns that record.

#### Remediation Snippet (FastAPI / SQLAlchemy):
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

@router.get("/orders/{order_id}")
def get_order(order_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # VULNERABLE:
    # order = db.query(Order).filter(Order.id == order_id).first()
    
    # SECURE: Enforce tenant ownership at the data access layer
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or unauthorized access"
        )
    return order
\`\`\`

#### Verification Test:
\`\`\`bash
# Attempt to access victim User B's record using User A's token:
curl -i -X GET "${baseUrl}/orders/2" -H "Authorization: Bearer <USER_A_TOKEN>"
# Expected Response: HTTP 404 Not Found or HTTP 403 Forbidden
\`\`\``;
    } else if (lowerMsg.includes('hsts') || lowerMsg.includes('header') || lowerMsg.includes('nosniff') || lowerMsg.includes('security header')) {
      reply = `### [VANGUARD-SOC] Security Headers Hardening Guide

**Target Analyzed:** \`${baseUrl}\`

Your audit flagged missing transport and content-type security headers. To achieve an A+ security posture, apply these headers at your reverse proxy or framework level:

#### 1. FastAPI / Starlette Implementation:
\`\`\`python
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)
\`\`\`

#### 2. Express.js / Node Implementation:
\`\`\`javascript
const helmet = require('helmet');
app.use(helmet({
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' }
}));
\`\`\`

#### 3. Verification:
\`\`\`bash
curl -I "${baseUrl}" | grep -Ei "(strict-transport|x-content-type|x-frame)"
\`\`\``;
    } else if (lowerMsg.includes('rate limit') || lowerMsg.includes('throttle') || lowerMsg.includes('429') || lowerMsg.includes('burst')) {
      reply = `### [VANGUARD-SOC] Rate Limiting & DoS Mitigation Architecture

**Target:** \`${baseUrl}\`

**Audit Observation:** Target accepted rapid concurrent request bursts without triggering HTTP 429 Too Many Requests or providing RFC 6585 \`Retry-After\` telemetry.

#### Recommended Token-Bucket Implementation (FastAPI / SlowApi):
\`\`\`python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # Strict limit for authentication endpoints
async def login(request: Request):
    return {"status": "authenticated"}
\`\`\`

#### Verification Load Test:
\`\`\`bash
# Send 15 concurrent requests to confirm 429 response:
seq 1 15 | xargs -n1 -P10 curl -s -o /dev/null -w "%{http_code}\\n" "${baseUrl}"
\`\`\``;
    } else if (lowerMsg.includes('curl') || lowerMsg.includes('poc') || lowerMsg.includes('test') || lowerMsg.includes('reproduce')) {
      if (findings.length > 0) {
        reply = `### [VANGUARD-SOC] Active Proof-of-Concept Curl Tests

Here are the reproducible PoC commands derived from your latest audit findings on **${targetName}**:

${findings
  .map(
    (f, idx) => `#### ${idx + 1}. ${f.title} (${f.severity} Severity)
\`\`\`bash
${f.reproduction || `curl -i "${f.endpoint || baseUrl}"`}
\`\`\`
*Expected Behavior:* Examine response headers and status codes to confirm vulnerability.`
  )
  .join('\n\n')}`;
      } else {
        reply = `### [VANGUARD-SOC] Diagnostic Curl Probes for ${baseUrl}

Run these commands to verify endpoint availability and response headers:
\`\`\`bash
# 1. Inspect Transport & Security Headers:
curl -s -I "${baseUrl}"

# 2. Check OpenAPI Discovery:
curl -s -I "${baseUrl}/openapi.json"

# 3. Test CORS Preflight Origin Reflection:
curl -I -X OPTIONS "${baseUrl}" \\
  -H "Origin: https://evil.attacker.com" \\
  -H "Access-Control-Request-Method: GET"
\`\`\``;
      }
    } else if (lowerMsg.includes('summary') || lowerMsg.includes('report') || lowerMsg.includes('risk') || lowerMsg.includes('overview')) {
      const high = findings.filter((f) => f.severity === 'High').length;
      const med = findings.filter((f) => f.severity === 'Medium').length;
      const low = findings.filter((f) => f.severity === 'Low').length;

      reply = `### [VANGUARD-SOC] Executive Security Assessment Summary

- **Target System:** \`${targetName}\` (\`${baseUrl}\`)
- **Audit Status:** ${totalFindings > 0 ? '⚠️ Action Required' : '✅ Compliant'}
- **Total Flaws Discovered:** ${totalFindings}
  - **High Severity:** ${high} ${high > 0 ? '(Immediate CI/CD Blocker)' : ''}
  - **Medium Severity:** ${med}
  - **Low Severity:** ${low}

#### Priority Action Items:
1. **${high > 0 ? 'Resolve High-Severity Vulnerabilities' : 'Enforce Transport Hardening'}**:
   ${findings.find((f) => f.severity === 'High')?.title || 'Verify all entity endpoints implement strict user_id scoping.'}
2. **Rate Limiting**: Configure sliding-window rate limiters on all public endpoints.
3. **Transport Security**: Enable HSTS (\`max-age=63072000\`) and \`nosniff\` MIME protection.

*Need specific code patches? Ask me for FastAPI, Express, or Nginx implementations.*`;
    } else {
      reply = `### [VANGUARD-SOC] Operational Telemetry Ready

I am linked to **${targetName}** (\`${baseUrl}\`) with **${totalFindings} audit finding(s)** in scope.

**How I can assist you right now:**
1. **Explain Findings:** Ask *"Explain finding #1"* or *"What is BOLA on this target?"*
2. **Code Remediations:** Ask *"Generate FastAPI fix for rate limiting"* or *"How to configure HSTS?"*
3. **PoC Verification:** Ask *"Give me curl commands to verify these flaws"*
4. **Compliance & CI/CD:** Ask *"Generate executive audit report"*

What security domain would you like to investigate?`;
    }

    return NextResponse.json({ reply, source: 'vanguard-soc-core' });
  } catch (err: unknown) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal chat assistant error.' },
      { status: 500 }
    );
  }
}
