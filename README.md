# VanguardAPI — Autonomous Zero-Trust API Vulnerability Scanner & Threat Intelligence Engine

> **"Find the API authorization flaw before the breach headline does."**

[![License: ISC](https://img.shields.io/badge/License-ISC-brightgreen.svg)](https://opensource.org/licenses/ISC)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.3-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Python 3](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)](https://www.python.org/)
[![OWASP API Top 10](https://img.shields.io/badge/OWASP-API%20Top%2010-red.svg)](https://owasp.org/www-project-api-security/)

**VanguardAPI** is an autonomous, zero-trust API security testing and continuous threat intelligence platform designed for engineering and DevSecOps teams. It ingests OpenAPI 3.0/Swagger specifications, executes stateful non-destructive security probes against authorized endpoints, and detects Broken Object Level Authorization (**BOLA/IDOR**), excessive data exposure (unmasked payment cards via **Luhn validation**), Broken Function Level Authorization (**BFLA**), mass assignment, and missing rate limits with deterministic proof-of-concept evidence.

---

## 🏛️ System Architecture & Workflow

```
[ OpenAPI 3.0 / Swagger JSON / Postman Collection ]
                      │
                      ▼
       [ 1. Contract & Spec Ingestion Engine ]
       (Extracts routes, path parameters, query params, auth schemes)
                      │
                      ▼
     [ 2. Dual-Identity Token Exchange Matrix ]
     ┌───────────────────────────┬───────────────────────────┐
     │  Context A (Attacker)     │   Context B (Victim)      │
     │  Token_A, Tenant_ID_A     │   Token_B, Tenant_ID_B    │
     └───────────────────────────┴───────────────────────────┘
                      │
                      ▼
    [ 3. Cross-Tenant Differential Emulation Core ]
     (Substitute Object IDs: Injects Victim's ID with Attacker's Token)
                      │
                      ▼
         [ 4. Multi-Vector Vulnerability Probes ]
     ┌────────────────────────┬────────────────────────┬──────────────────────┐
     │  BOLA / IDOR Probing   │  PCI-DSS Luhn Checker  │ Rate-Limit Threshold │
     │  (Boundary violation)  │  (Mathematical Mod-10) │ (DDoS & Brute Force) │
     └────────────────────────┴────────────────────────┴──────────────────────┘
                      │
                      ▼
       [ 5. Topological Threat Graph Synthesizer ]
     (Maps Blast Radius: Identity ➔ Endpoint ➔ Object ➔ Asset)
                      │
                      ▼
    [ 6. Dual Output: Interactive Web Dashboard & CLI Stream ]
```

---

## 💎 The 5 Core Pillars of VanguardAPI

1. **🕸️ 5-Tier Hierarchical Threat Graph:**  
   Visualizes API topology from Principals down to Sensitive Assets, computing real-time attack blast radius and downstream compromise paths.
2. **🔄 24/7 Continuous Monitoring Loop:**  
   Autonomous regression testing daemon that tracks new vulnerabilities, resolved bugs, endpoint drift, and historic security trends over time.
3. **💳 PCI-DSS & Financial Data Defense:**  
   Deep payload inspection detecting unmasked payment card numbers validated mathematically via the **ISO/IEC 7812 Luhn Modulo-10 Checksum Algorithm**, eliminating false positives.
4. **🛡️ Bounded, Non-Destructive Probing:**  
   Strictly respects staging and production environments with non-mutating probes and bounded bursts, preventing service disruption, data pollution, or DoS.
5. **⚡ Zero External Dependencies Core:**  
   Scanner engine executes natively using Python standard libraries (`urllib.request`, `json`, `re`, `argparse`) with ultra-fast latency (<0.4s per scan run).

---

## 🧠 Core Innovation: Dual-Identity Differential Testing

Traditional scanners and WAFs fail to detect BOLA/IDOR because a broken authorization request returns an **HTTP 200 OK** with valid JSON—indistinguishable from a regular call without knowing user ownership.

VanguardAPI solves this with a **Dual-Identity Differential Matrix**:

```python
# The Core Differential Testing Condition:
IF Response_Status == 200 OK 
   AND Auth_Header == Bearer(User_A) 
   AND Requested_Resource_ID == Resource_ID(User_B) 
   AND Response_Payload contains Private_Attributes(User_B):
   
   ───► DETERMINISTIC VULNERABILITY CONFIRMED: BOLA (Severity: CRITICAL)
```

| Step | Action Taken by VanguardAPI | Expected Secure Behavior | Vulnerable Server Response | Result |
| :--- | :--- | :--- | :--- | :--- |
| **1. Baseline** | User B accesses `/api/orders/9981` with Token B | HTTP 200 OK (User B's data) | HTTP 200 OK | Baseline Verified |
| **2. Cross-Tenant Probe** | User A accesses `/api/orders/9981` with Token A | **HTTP 403 Forbidden** | **HTTP 200 OK** + User B's Data | 🚨 **BOLA Flaw Flagged!** |
| **3. Unauthenticated Probe**| Access `/api/orders/9981` with No Token | **HTTP 401 Unauthorized** | **HTTP 200 OK** | 🚨 **Broken Auth Flagged!** |

---

## 📁 Repository Structure

```
├── frontend/                   # Next.js 15 SOC-grade web console
│   ├── app/                    # 27 routes: dashboard, features, docs, pricing, etc.
│   ├── components/             # 3D canvas, Threat Graph, cyber UI components
│   └── site.config.ts          # Single source of truth for site branding (VanguardAPI)
├── backend/                    # TypeScript Express scanner service
│   ├── src/                    # Differential testing pipeline & SQLite storage
│   └── README.md               # Detailed backend documentation
├── sentinelapi/                # Lightweight native Python engine & local sandbox
│   ├── scanner/scanner.py      # Core scanner engine with --monitor daemon mode
│   ├── vulnerable-api/         # Intentionally flawed test API on port 4000
│   ├── dashboard/index.html    # Standalone HTML5 canvas trend dashboard
│   ├── run-monitor.bat         # 1-Click launcher for 24/7 continuous monitoring
│   └── history.json            # Historic audit records for trendline analysis
├── database/
│   └── schema.sql              # Supabase PostgreSQL schema with strict RLS
└── README.md                   # Project documentation
```

---

## 🚀 Quickstart: Running in 3 Steps

### Step 1: Start the Vulnerable Mock API
In your first terminal, launch the intentionally vulnerable target server (Zero dependencies required):

```bash
node sentinelapi/vulnerable-api/server.js
```
*Listens on `http://127.0.0.1:4000`. Exposes OpenAPI spec at `http://127.0.0.1:4000/openapi.json`.*

### Step 2: Run the Security Scanner
In your second terminal, run a one-time audit:

```bash
python sentinelapi/scanner/scanner.py --config sentinelapi/scanner/config.example.json --out sentinelapi/findings.json
```

Or start the **24/7 Continuous Monitoring Daemon** (scans automatically every hour and logs trends):

```bash
python sentinelapi/scanner/scanner.py --config sentinelapi/scanner/config.example.json --monitor --interval 3600
```
*(On Windows, you can simply double-click `sentinelapi/run-monitor.bat`)*

### Step 3: View the Interactive Visual Dashboard
Double-click or open `sentinelapi/dashboard/index.html` directly in any web browser:

```bash
# Windows
start sentinelapi/dashboard/index.html

# macOS
open sentinelapi/dashboard/index.html

# Linux
xdg-open sentinelapi/dashboard/index.html
```

---

## 🌐 Running the Full Next.js Web Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to explore the full Next.js 15 web application with dynamic 3D Three.js universe canvas, live telemetry, and interactive threat graph viewer.

---

## 📊 Competitive Benchmark Matrix

| Feature / Capability | Postman | OWASP ZAP | Burp Suite Pro | **VanguardAPI** |
| :--- | :---: | :---: | :---: | :---: |
| **API Contract Ingestion (OpenAPI/Swagger)** | Manual | Limited | Extension | **Native & Autonomous** |
| **Dual-Identity BOLA/IDOR Detection** | ❌ No | ❌ No | Semi-Manual | **✅ Automated Matrix** |
| **Mathematical Luhn Card Validation** | ❌ No | ❌ Regex Only | Regex Only | **✅ Modulo-10 Verified** |
| **5-Tier Blast Radius Threat Graph** | ❌ No | ❌ No | ❌ No | **✅ Real-time Topology** |
| **24/7 Automated Drift Monitoring** | ❌ No | ❌ No | ❌ No | **✅ Built-in Daemon** |
| **External Dependencies Required** | High | Java/Desktop | Java/Paid | **Zero (Native Python/Web)** |

---

## 🛡️ Finding Report Structure

Every finding generated by VanguardAPI includes:
1. **Unique Finding ID**: (e.g., `VANGUARD-BOLA-01`)
2. **Category & Classification**: Categorized by OWASP API Security Top 10 (2023).
3. **Severity**: `Critical`, `High`, `Medium`, or `Low`.
4. **Target Endpoint**: Parameterized route template (e.g., `GET /orders/{id}`).
5. **Impact Summary**: Plain-English synopsis for non-technical stakeholders and leadership.
6. **Masked Evidence**: Real payload responses with sensitive credentials and PANs redacted.
7. **Runnable cURL PoC**: Safe copy-paste command for engineering teams to reproduce the flaw.
8. **Actionable Remediation**: Exact code-level fix guidance (e.g. data access layer ownership validation, DTO filtering).

---

## ⚠️ Ethics & Safe Harbor

> **CRITICAL NOTICE**: VanguardAPI is developed strictly for authorized security auditing, defensive gap analysis, educational research, and internal CI/CD compliance testing. Testing APIs without explicit written permission from the system owner is illegal and unethical.
>
> **Built-in Guardrails:**
> - **Default Loopback Restriction**: Scans are strictly restricted to local loopback addresses (`localhost`, `127.0.0.1`) unless the `--i-am-authorized` flag is explicitly provided.
> - **Credential Redaction**: All tokens, passwords, and payment card numbers are automatically masked in reports and terminal output.
> - **Bounded Request Rate**: Burst tests strictly limit request rates to avoid denial-of-service.

---

## 📄 License

Copyright © 2026 VanguardAPI Technologies Inc. All rights reserved.  
Licensed under the [ISC License](LICENSE).
