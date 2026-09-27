/**
 * SentinelAPI Vulnerable Target API (Demo Sandbox)
 * Intentionally contains BOLA/IDOR, Excessive Data Exposure, and Missing Rate Limiting.
 * Built strictly with Node.js built-in modules (Zero external dependencies).
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = 'sentinelapi-demo-insecure-secret-key-2026';

// In-memory mock database
const users = {
  1: {
    id: 1,
    username: 'alice',
    password: 'alice123', // VULNERABILITY: Plaintext password stored and returned
    email: 'alice@example.com',
    role: 'customer',
    bio: 'Senior developer and coffee enthusiast'
  },
  2: {
    id: 2,
    username: 'bob',
    password: 'bob123', // VULNERABILITY: Plaintext password stored and returned
    email: 'bob@example.com',
    role: 'customer',
    bio: 'DevOps engineer and automation geek'
  }
};

const orders = {
  1: {
    id: 1,
    user_id: 1,
    items: ['Mechanical Keyboard', 'USB-C Hub'],
    amount: 189.99,
    status: 'completed',
    card_number: '4532015698741235', // VULNERABILITY: Unmasked Luhn-valid credit card number
    created_at: '2026-09-20T10:15:00Z'
  },
  2: {
    id: 2,
    user_id: 1,
    items: ['Ergonomic Mouse'],
    amount: 79.50,
    status: 'processing',
    card_number: '4532015698741235', // VULNERABILITY: Unmasked Luhn-valid credit card number
    created_at: '2026-09-21T14:30:00Z'
  },
  3: {
    id: 3,
    user_id: 2,
    items: ['4K UltraWide Monitor'],
    amount: 649.00,
    status: 'shipped',
    card_number: '4242424242424242', // VULNERABILITY: Unmasked Luhn-valid credit card number
    created_at: '2026-09-22T09:12:00Z'
  },
  4: {
    id: 4,
    user_id: 2,
    items: ['Noise Cancelling Headphones'],
    amount: 299.99,
    status: 'completed',
    card_number: '4242424242424242', // VULNERABILITY: Unmasked Luhn-valid credit card number
    created_at: '2026-09-23T16:45:00Z'
  }
};

/**
 * Creates a lightweight JWT-formatted token using HMAC SHA-256
 */
function createToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * Validates and decodes a JWT token
 */
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts and verifies bearer token from HTTP Authorization header
 */
function authenticate(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return verifyToken(parts[1]);
}

/**
 * Helper to send JSON responses with CORS headers
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Reads request body helper
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Root endpoint
  if (pathname === '/' && method === 'GET') {
    return sendJson(res, 200, {
      name: 'SentinelAPI Vulnerable Target API',
      status: 'online',
      version: '1.0.0',
      description: 'Educational vulnerable test sandbox. Do NOT expose to public networks.',
      documentation: '/openapi.json',
      endpoints: [
        'POST /login',
        'GET /orders/{id}',
        'GET /users/{id}',
        'GET /me/orders',
        'GET /openapi.json'
      ]
    });
  }

  // Domain ownership verification endpoint
  if (pathname === '/.well-known/sentinelapi-verify.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end('sentinel_verify_sandbox_token');
    return;
  }

  // OpenAPI Specification endpoint
  if (pathname === '/openapi.json' && method === 'GET') {
    try {
      const specPath = path.join(__dirname, 'openapi.json');
      const content = fs.readFileSync(specPath, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
      return;
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to read openapi.json' });
    }
  }

  // POST /login: Authenticate user (VULNERABILITY: No rate limiting implemented)
  if (pathname === '/login' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { username, password } = body;

      const user = Object.values(users).find(
        u => u.username === username && u.password === password
      );

      if (!user) {
        return sendJson(res, 401, {
          error: 'Invalid credentials',
          status: 401
        });
      }

      const token = createToken(user);
      return sendJson(res, 200, {
        token: token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message, status: 400 });
    }
  }

  // Restore the in-memory sandbox state for repeatable demonstrations.
  if (pathname === '/__demo/reset' && method === 'POST') {
    users[1].role = 'customer'; users[1].is_admin = false;
    users[2].role = 'customer'; users[2].is_admin = false;
    return sendJson(res, 200, { status: 'reset', message: 'Demo sandbox state restored' });
  }

  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // GET /orders/:id (VULNERABILITY: BOLA & Excessive Data Exposure)
  const orderMatch = cleanPath.match(/^\/orders\/(\d+)$/);
  if (orderMatch) {
    if (method !== 'GET') {
      return sendJson(res, 405, { error: 'Method Not Allowed. Please change Postman method from ' + method + ' to GET.', status: 405 });
    }

    const authUser = authenticate(req);
    if (!authUser) {
      return sendJson(res, 401, {
        error: 'Unauthorized: missing or invalid Bearer token. Please add Header: Authorization = Bearer <token>',
        status: 401
      });
    }

    const orderId = parseInt(orderMatch[1], 10);
    const order = orders[orderId];
    if (!order) {
      return sendJson(res, 404, { error: `Order ${orderId} not found`, status: 404 });
    }

    // BOLA VULNERABILITY: Does NOT check if order.user_id === authUser.sub
    // Excessive Data Exposure: Returns plaintext credit card number
    return sendJson(res, 200, order);
  }

  // GET /orders/:id/payment (VULNERABILITY: Exposes payment data without ownership check)
  const orderPaymentMatch = cleanPath.match(/^\/orders\/(\d+)\/payment$/);
  if (orderPaymentMatch && method === 'GET') {
    const authUser = authenticate(req);
    if (!authUser) return sendJson(res, 401, { error: 'Unauthorized', status: 401 });
    const orderId = parseInt(orderPaymentMatch[1], 10);
    const order = orders[orderId];
    if (!order) return sendJson(res, 404, { error: 'Order not found', status: 404 });
    return sendJson(res, 200, { id: orderId, order_id: orderId, user_id: order.user_id, card_number: order.card_number, payment_token: 'tok_' + orderId + '_live', amount: order.amount });
  }

  // GET /orders/:id/invoice (VULNERABILITY: Returns billing data without ownership check)
  const orderInvoiceMatch = cleanPath.match(/^\/orders\/(\d+)\/invoice$/);
  if (orderInvoiceMatch && method === 'GET') {
    const authUser = authenticate(req);
    if (!authUser) return sendJson(res, 401, { error: 'Unauthorized', status: 401 });
    const orderId = parseInt(orderInvoiceMatch[1], 10);
    const order = orders[orderId];
    if (!order) return sendJson(res, 404, { error: 'Order not found', status: 404 });
    return sendJson(res, 200, { id: orderId, order_id: orderId, user_id: order.user_id, billing_address: '123 Victim St, Anytown', internal_metadata: 'invoice-ref-' + orderId + '-INTERNAL' });
  }

  // GET /orders/:id/shipment (VULNERABILITY: Returns shipment data without ownership check)
  const orderShipmentMatch = cleanPath.match(/^\/orders\/(\d+)\/shipment$/);
  if (orderShipmentMatch && method === 'GET') {
    const authUser = authenticate(req);
    if (!authUser) return sendJson(res, 401, { error: 'Unauthorized', status: 401 });
    const orderId = parseInt(orderShipmentMatch[1], 10);
    const order = orders[orderId];
    if (!order) return sendJson(res, 404, { error: 'Order not found', status: 404 });
    return sendJson(res, 200, { id: orderId, order_id: orderId, user_id: order.user_id, tracking_number: 'TRK-' + orderId + '-2026', destination_address: '456 Victim Ave, Springfield' });
  }

  // GET /users/:id (VULNERABILITY: BOLA & Plaintext Password Exposure) or PATCH /users/:id (Mass Assignment)
  const userMatch = cleanPath.match(/^\/users\/(\d+)$/);
  if (userMatch && (method === 'GET' || method === 'PATCH')) {
    const authUser = authenticate(req);
    if (!authUser) {
      return sendJson(res, 401, { error: 'Unauthorized: missing or invalid Bearer token', status: 401 });
    }

    const userId = parseInt(userMatch[1], 10);
    const userProfile = users[userId];
    if (!userProfile) {
      return sendJson(res, 404, { error: `User ${userId} not found`, status: 404 });
    }

    if (method === 'PATCH') {
      const body = await parseRequestBody(req);
      Object.assign(userProfile, body);
      return sendJson(res, 200, userProfile);
    }

    return sendJson(res, 200, userProfile);
  }

  // POST /admin/users/:id/role (VULNERABILITY: BFLA - Unprotected admin role change)
  const adminRoleMatch = cleanPath.match(/^\/admin\/users\/(\d+)\/role$/);
  if (adminRoleMatch && method === 'POST') {
    const authUser = authenticate(req);
    if (!authUser) {
      return sendJson(res, 401, { error: 'Unauthorized: missing or invalid Bearer token', status: 401 });
    }
    const userId = parseInt(adminRoleMatch[1], 10);
    const userProfile = users[userId];
    if (!userProfile) {
      return sendJson(res, 404, { error: `User ${userId} not found`, status: 404 });
    }
    const body = await parseRequestBody(req);
    if (body.role) {
      userProfile.role = String(body.role);
    }
    return sendJson(res, 200, { success: true, user: userProfile, message: 'Role updated successfully' });
  }

  // GET /me/orders (SECURE PATTERN: Enforces ownership through token identity)
  if (pathname === '/me/orders' && method === 'GET') {
    const authUser = authenticate(req);
    if (!authUser) {
      return sendJson(res, 401, { error: 'Unauthorized: missing or invalid Bearer token', status: 401 });
    }

    // Correct pattern: filter orders strictly by requester's user ID and sanitize data
    const userOrders = Object.values(orders)
      .filter(o => o.user_id === authUser.sub)
      .map(o => ({
        id: o.id,
        user_id: o.user_id,
        items: o.items,
        amount: o.amount,
        status: o.status,
        masked_card: `****-****-****-${o.card_number.slice(-4)}`,
        created_at: o.created_at
      }));

    return sendJson(res, 200, userOrders);
  }

  // Fallback 404
  return sendJson(res, 404, { error: 'Not Found', path: pathname, status: 404 });
});

server.listen(PORT, () => {
  console.log(`[SentinelAPI] Vulnerable Sandbox Target running at http://localhost:${PORT}`);
  console.log(`[SentinelAPI] OpenAPI Spec available at http://localhost:${PORT}/openapi.json`);
  console.log(`[SentinelAPI] Demo Accounts: alice:alice123, bob:bob123`);
});
