/**
 * Lumicore Labs — Backend API Test Runner
 * ----------------------------------------
 * Plain Node.js (no extra deps). Requires Node 18+ for built-in fetch.
 *
 * Usage:
 *   node scripts/test-api.js
 *
 * Make sure the backend is running on http://localhost:3000 before running.
 */

const BASE = 'http://localhost:3000';

// ── ANSI colours ──────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
  blue: '\x1b[34m',
};

// ── State ─────────────────────────────────────────────────────────────────────
let adminToken = '';
let employeeToken = '';
let employeeId = null;
let bizId = null;
let callId = null;
let categoryId = null;
let recordId = null;
let todoId = null;

let passed = 0;
let failed = 0;
const failures = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

function section(title) {
  console.log(
    `\n${c.bold}${c.blue}── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}${c.reset}`,
  );
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${c.green}✓${c.reset} ${label}`);
    passed++;
  } else {
    console.log(
      `  ${c.red}✗${c.reset} ${label}${detail ? c.grey + '  (' + detail + ')' + c.reset : ''}`,
    );
    failed++;
    failures.push({ label, detail });
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

async function testHealth() {
  section('1. Health Check');
  const { status, data } = await req('GET', '/api/health');
  assert('GET /api/health → 200', status === 200, `got ${status}`);
  assert('body.status === "ok"', data?.status === 'ok', JSON.stringify(data));
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function testAuth() {
  section('2. Authentication');

  // 2.1 Valid admin login
  {
    const { status, data } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@lumicorelabs.com', password: 'admin123' },
    });
    assert('POST /login — valid admin → 200', status === 200, `got ${status}`);
    assert('Response contains token', typeof data?.token === 'string', JSON.stringify(data));
    assert('User role is admin', data?.user?.role === 'admin', data?.user?.role);
    adminToken = data?.token || '';
  }

  // 2.2 Wrong password
  {
    const { status } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@lumicorelabs.com', password: 'wrongpass' },
    });
    assert('POST /login — wrong password → 401', status === 401, `got ${status}`);
  }

  // 2.3 Unknown email
  {
    const { status } = await req('POST', '/api/auth/login', {
      body: { email: 'nobody@x.com', password: 'admin123' },
    });
    assert('POST /login — unknown email → 401', status === 401, `got ${status}`);
  }

  // 2.4 Missing password
  {
    const { status } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@lumicorelabs.com' },
    });
    assert('POST /login — missing password → 400', status === 400, `got ${status}`);
  }

  // 2.5 Empty body
  {
    const { status } = await req('POST', '/api/auth/login', { body: {} });
    assert('POST /login — empty body → 400', status === 400, `got ${status}`);
  }

  // 2.6 GET /me with valid token
  {
    const { status, data } = await req('GET', '/api/auth/me', { token: adminToken });
    assert('GET /me — valid token → 200', status === 200, `got ${status}`);
    assert(
      'GET /me — no password field in response',
      !('password' in (data || {})),
      'password exposed!',
    );
  }

  // 2.7 GET /me with no token
  {
    const { status } = await req('GET', '/api/auth/me');
    assert('GET /me — no token → 401', status === 401, `got ${status}`);
  }

  // 2.8 GET /me with invalid token
  {
    const { status } = await req('GET', '/api/auth/me', { token: 'bad.token.here' });
    assert('GET /me — invalid token → 401', status === 401, `got ${status}`);
  }
}

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────
async function testUsers() {
  section('3. User Management (Admin Only)');

  // 3.1 List users — admin
  {
    const { status, data } = await req('GET', '/api/users', { token: adminToken });
    assert('GET /users — admin → 200', status === 200, `got ${status}`);
    assert('GET /users — returns array', Array.isArray(data), typeof data);
  }

  // 3.2 List users — no token
  {
    const { status } = await req('GET', '/api/users');
    assert('GET /users — no token → 401', status === 401, `got ${status}`);
  }

  // 3.3 Create employee user (setup for later tests)
  {
    const { status, data } = await req('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Test Employee',
        email: 'testemployee@lumicorelabs.com',
        password: 'emp123',
        role: 'employee',
      },
    });
    assert(
      'POST /users — create employee → 201',
      status === 201,
      `got ${status} ${JSON.stringify(data)}`,
    );
    employeeId = data?.id;
  }

  // 3.4 Login as employee
  {
    const { status, data } = await req('POST', '/api/auth/login', {
      body: { email: 'testemployee@lumicorelabs.com', password: 'emp123' },
    });
    assert('Employee login → 200', status === 200, `got ${status}`);
    assert('Employee role correct', data?.user?.role === 'employee', data?.user?.role);
    employeeToken = data?.token || '';
  }

  // 3.5 Employee cannot list users → 403
  {
    const { status } = await req('GET', '/api/users', { token: employeeToken });
    assert('GET /users — employee token → 403', status === 403, `got ${status}`);
  }

  // 3.6 Duplicate email
  {
    const { status, data } = await req('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Dup',
        email: 'testemployee@lumicorelabs.com',
        password: 'abc',
        role: 'employee',
      },
    });
    assert('POST /users — duplicate email → 400', status === 400, `got ${status}`);
  }

  // 3.7 Missing required fields
  {
    const { status } = await req('POST', '/api/users', {
      token: adminToken,
      body: { name: 'No Email' },
    });
    assert('POST /users — missing fields → 400', status === 400, `got ${status}`);
  }

  // 3.8 Update user
  {
    const { status } = await req('PUT', `/api/users/${employeeId}`, {
      token: adminToken,
      body: { name: 'Updated Employee' },
    });
    assert('PUT /users/:id — admin → 200', status === 200, `got ${status}`);
  }

  // 3.9 Employee cannot create user
  {
    const { status } = await req('POST', '/api/users', {
      token: employeeToken,
      body: { name: 'X', email: 'x@x.com', password: 'x', role: 'employee' },
    });
    assert('POST /users — employee token → 403', status === 403, `got ${status}`);
  }
}

// ── BUSINESSES ────────────────────────────────────────────────────────────────
async function testBusinesses() {
  section('4. Business Prospecting');

  // 4.1 Get all — admin sees all
  {
    const { status, data } = await req('GET', '/api/businesses', { token: adminToken });
    assert('GET /businesses — admin → 200', status === 200, `got ${status}`);
    assert('GET /businesses — returns array', Array.isArray(data), typeof data);
  }

  // 4.2 No token
  {
    const { status } = await req('GET', '/api/businesses');
    assert('GET /businesses — no token → 401', status === 401, `got ${status}`);
  }

  // 4.3 Create business as employee
  {
    const { status, data } = await req('POST', '/api/businesses', {
      token: employeeToken,
      body: {
        name: 'Test Salon',
        type: 'saloon',
        phone: '0771234567',
        city: 'Colombo',
        status: 'new',
      },
    });
    assert(
      'POST /businesses — employee → 201',
      status === 201,
      `got ${status} ${JSON.stringify(data)}`,
    );
    bizId = data?.id;
  }

  // 4.4 Create business without name → 400
  {
    const { status } = await req('POST', '/api/businesses', {
      token: employeeToken,
      body: { type: 'saloon' },
    });
    assert('POST /businesses — missing name → 400', status === 400, `got ${status}`);
  }

  // 4.5 Get by ID
  {
    const { status, data } = await req('GET', `/api/businesses/${bizId}`, { token: employeeToken });
    assert('GET /businesses/:id → 200', status === 200, `got ${status}`);
    assert('Business name matches', data?.name === 'Test Salon', data?.name);
  }

  // 4.6 Get non-existent business
  {
    const { status } = await req('GET', '/api/businesses/99999', { token: adminToken });
    assert('GET /businesses/99999 → 404', status === 404, `got ${status}`);
  }

  // 4.7 Employee sees own business in list
  {
    const { status, data } = await req('GET', '/api/businesses', { token: employeeToken });
    assert('GET /businesses — employee → 200', status === 200, `got ${status}`);
    const found = Array.isArray(data) && data.some((b) => b.id === bizId);
    assert('Employee sees own business in list', found, 'not found');
  }

  // 4.8 Update business
  {
    const { status } = await req('PUT', `/api/businesses/${bizId}`, {
      token: employeeToken,
      body: { status: 'contacted', notes: 'Spoke to manager' },
    });
    assert('PUT /businesses/:id → 200', status === 200, `got ${status}`);
  }

  // 4.9 Employee cannot delete business → 403
  {
    const { status } = await req('DELETE', `/api/businesses/${bizId}`, { token: employeeToken });
    assert('DELETE /businesses/:id — employee → 403', status === 403, `got ${status}`);
  }
}

// ── COLD CALLS ────────────────────────────────────────────────────────────────
async function testColdCalls() {
  section('5. Cold Calls');

  // 5.1 Get calls for business (initially empty)
  {
    const { status, data } = await req('GET', `/api/businesses/${bizId}/calls`, {
      token: employeeToken,
    });
    assert('GET /businesses/:id/calls → 200', status === 200, `got ${status}`);
    assert('Returns array', Array.isArray(data), typeof data);
  }

  // 5.2 Log a call
  {
    const { status, data } = await req('POST', `/api/businesses/${bizId}/calls`, {
      token: employeeToken,
      body: {
        call_date: '2026-02-28',
        outcome: 'interested',
        notes: 'Very interested in a website',
        next_followup: '2026-03-07',
      },
    });
    assert(
      'POST /businesses/:id/calls → 201',
      status === 201,
      `got ${status} ${JSON.stringify(data)}`,
    );
    callId = data?.id;
  }

  // 5.3 Log call — no token
  {
    const { status } = await req('POST', `/api/businesses/${bizId}/calls`, {
      body: { call_date: '2026-02-28', outcome: 'no_answer' },
    });
    assert('POST /businesses/:id/calls — no token → 401', status === 401, `got ${status}`);
  }

  // 5.4 Update call
  {
    const { status } = await req('PUT', `/api/coldcalls/${callId}`, {
      token: employeeToken,
      body: { outcome: 'callback', notes: 'Changed to callback' },
    });
    assert('PUT /coldcalls/:id → 200', status === 200, `got ${status}`);
  }

  // 5.5 Verify call updated in list
  {
    const { data } = await req('GET', `/api/businesses/${bizId}/calls`, { token: employeeToken });
    const updated = Array.isArray(data) && data.find((c) => c.id === callId);
    assert('Call outcome updated to callback', updated?.outcome === 'callback', updated?.outcome);
  }
}

// ── FINANCE CATEGORIES ────────────────────────────────────────────────────────
async function testFinanceCategories() {
  section('6. Finance — Categories');

  // 6.1 List categories (initially empty for employee)
  {
    const { status, data } = await req('GET', '/api/finance/categories', { token: employeeToken });
    assert('GET /finance/categories → 200', status === 200, `got ${status}`);
    assert('Returns array', Array.isArray(data), typeof data);
  }

  // 6.2 No token
  {
    const { status } = await req('GET', '/api/finance/categories');
    assert('GET /finance/categories — no token → 401', status === 401, `got ${status}`);
  }

  // 6.3 Create income category
  {
    const { status, data } = await req('POST', '/api/finance/categories', {
      token: employeeToken,
      body: { name: 'Salary', type: 'income' },
    });
    assert(
      'POST /finance/categories — income → 201',
      status === 201,
      `got ${status} ${JSON.stringify(data)}`,
    );
    categoryId = data?.id;
  }

  // 6.4 Create expense category
  {
    const { status } = await req('POST', '/api/finance/categories', {
      token: employeeToken,
      body: { name: 'Food', type: 'expense' },
    });
    assert('POST /finance/categories — expense → 201', status === 201, `got ${status}`);
  }

  // 6.5 Missing type → 400
  {
    const { status } = await req('POST', '/api/finance/categories', {
      token: employeeToken,
      body: { name: 'NoType' },
    });
    assert('POST /finance/categories — missing type → 400', status === 400, `got ${status}`);
  }

  // 6.6 Missing name → 400
  {
    const { status } = await req('POST', '/api/finance/categories', {
      token: employeeToken,
      body: { type: 'income' },
    });
    assert('POST /finance/categories — missing name → 400', status === 400, `got ${status}`);
  }

  // 6.7 Admin categories are separate from employee categories
  {
    const { data: adminCats } = await req('GET', '/api/finance/categories', { token: adminToken });
    const { data: empCats } = await req('GET', '/api/finance/categories', { token: employeeToken });
    const adminHasEmpCat = Array.isArray(adminCats) && adminCats.some((c) => c.id === categoryId);
    assert(
      'Admin cannot see employee categories (data isolation)',
      !adminHasEmpCat,
      adminHasEmpCat ? 'leak detected!' : 'isolated',
    );
  }
}

// ── FINANCE RECORDS ───────────────────────────────────────────────────────────
async function testFinanceRecords() {
  section('7. Finance — Records');

  // 7.1 List records
  {
    const { status, data } = await req('GET', '/api/finance/records', { token: employeeToken });
    assert('GET /finance/records → 200', status === 200, `got ${status}`);
    assert('Returns array', Array.isArray(data), typeof data);
  }

  // 7.2 Add income record
  {
    const { status, data } = await req('POST', '/api/finance/records', {
      token: employeeToken,
      body: {
        type: 'income',
        amount: 50000,
        date: '2026-02-01',
        category_id: categoryId,
        description: 'February salary',
      },
    });
    assert(
      'POST /finance/records — income → 201',
      status === 201,
      `got ${status} ${JSON.stringify(data)}`,
    );
    recordId = data?.id;
  }

  // 7.3 Add expense record
  {
    const { status } = await req('POST', '/api/finance/records', {
      token: employeeToken,
      body: {
        type: 'expense',
        amount: 5000,
        date: '2026-02-10',
        description: 'Groceries',
      },
    });
    assert('POST /finance/records — expense → 201', status === 201, `got ${status}`);
  }

  // 7.4 Missing required fields → 400
  {
    const { status } = await req('POST', '/api/finance/records', {
      token: employeeToken,
      body: { type: 'income', date: '2026-02-01' }, // missing amount
    });
    assert('POST /finance/records — missing amount → 400', status === 400, `got ${status}`);
  }

  // 7.5 Filter by month
  {
    const { status, data } = await req('GET', '/api/finance/records?month=2026-02', {
      token: employeeToken,
    });
    assert('GET /finance/records?month=2026-02 → 200', status === 200, `got ${status}`);
    assert(
      'Records returned for month filter',
      Array.isArray(data) && data.length > 0,
      `${data?.length}`,
    );
  }

  // 7.6 Filter by type
  {
    const { status, data } = await req('GET', '/api/finance/records?type=expense', {
      token: employeeToken,
    });
    assert('GET /finance/records?type=expense → 200', status === 200, `got ${status}`);
    const allExpense = Array.isArray(data) && data.every((r) => r.type === 'expense');
    assert(
      'All returned records are expense type',
      allExpense,
      JSON.stringify(data?.map((r) => r.type)),
    );
  }

  // 7.7 Summary endpoint
  {
    const { status, data } = await req('GET', '/api/finance/summary?month=2026-02', {
      token: employeeToken,
    });
    assert('GET /finance/summary → 200', status === 200, `got ${status}`);
    assert('Summary has income field', 'income' in (data || {}), JSON.stringify(data));
    assert('Summary has expense field', 'expense' in (data || {}), JSON.stringify(data));
  }

  // 7.8 Admin cannot see employee's records
  {
    const { data: adminRecords } = await req('GET', '/api/finance/records', { token: adminToken });
    const leak = Array.isArray(adminRecords) && adminRecords.some((r) => r.id === recordId);
    assert(
      'Admin cannot see employee records (data isolation)',
      !leak,
      leak ? 'leak!' : 'isolated',
    );
  }

  // 7.9 Update record
  {
    const { status } = await req('PUT', `/api/finance/records/${recordId}`, {
      token: employeeToken,
      body: { amount: 55000, description: 'Updated salary' },
    });
    assert('PUT /finance/records/:id → 200', status === 200, `got ${status}`);
  }

  // 7.10 No token
  {
    const { status } = await req('GET', '/api/finance/records');
    assert('GET /finance/records — no token → 401', status === 401, `got ${status}`);
  }
}

// ── TODOS ─────────────────────────────────────────────────────────────────────
async function testTodos() {
  section('8. Todos');

  // 8.1 List todos — empty initially
  {
    const { status, data } = await req('GET', '/api/todos', { token: employeeToken });
    assert('GET /todos → 200', status === 200, `got ${status}`);
    assert('Returns array', Array.isArray(data), typeof data);
  }

  // 8.2 No token
  {
    const { status } = await req('GET', '/api/todos');
    assert('GET /todos — no token → 401', status === 401, `got ${status}`);
  }

  // 8.3 Create todo
  {
    const { status, data } = await req('POST', '/api/todos', {
      token: employeeToken,
      body: {
        title: 'Follow up Test Salon',
        description: 'Call back on Monday',
        priority: 'high',
        due_date: '2026-03-07',
      },
    });
    assert('POST /todos — valid → 201', status === 201, `got ${status} ${JSON.stringify(data)}`);
    todoId = data?.id;
  }

  // 8.4 Create todo without title → 400
  {
    const { status } = await req('POST', '/api/todos', {
      token: employeeToken,
      body: { priority: 'low' },
    });
    assert('POST /todos — missing title → 400', status === 400, `got ${status}`);
  }

  // 8.5 Filter by status
  {
    const { status, data } = await req('GET', '/api/todos?status=pending', {
      token: employeeToken,
    });
    assert('GET /todos?status=pending → 200', status === 200, `got ${status}`);
    const allPending = Array.isArray(data) && data.every((t) => t.status === 'pending');
    assert(
      'All returned todos are pending',
      allPending,
      JSON.stringify(data?.map((t) => t.status)),
    );
  }

  // 8.6 Update todo status to done
  {
    const { status } = await req('PUT', `/api/todos/${todoId}`, {
      token: employeeToken,
      body: { status: 'done' },
    });
    assert('PUT /todos/:id — mark done → 200', status === 200, `got ${status}`);
  }

  // 8.7 Verify status updated
  {
    const { data } = await req('GET', '/api/todos', { token: employeeToken });
    const todo = Array.isArray(data) && data.find((t) => t.id === todoId);
    assert("Todo status is 'done'", todo?.status === 'done', todo?.status);
  }

  // 8.8 Admin cannot see employee todos
  {
    const { data: adminTodos } = await req('GET', '/api/todos', { token: adminToken });
    const leak = Array.isArray(adminTodos) && adminTodos.some((t) => t.id === todoId);
    assert('Admin cannot see employee todos (data isolation)', !leak, leak ? 'leak!' : 'isolated');
  }

  // 8.9 Update todo title
  {
    const { status } = await req('PUT', `/api/todos/${todoId}`, {
      token: employeeToken,
      body: { title: 'Updated Follow-up', status: 'in_progress' },
    });
    assert('PUT /todos/:id — update title + status → 200', status === 200, `got ${status}`);
  }
}

// ── SECURITY CHECKS ───────────────────────────────────────────────────────────
async function testSecurity() {
  section('9. Security & Edge Cases');

  // 9.1 Employee cannot delete a business
  {
    const { status } = await req('DELETE', `/api/businesses/${bizId}`, { token: employeeToken });
    assert('Employee DELETE /businesses/:id → 403', status === 403, `got ${status}`);
  }

  // 9.2 Employee cannot access /api/users
  {
    const { status } = await req('GET', '/api/users', { token: employeeToken });
    assert('Employee GET /api/users → 403', status === 403, `got ${status}`);
  }

  // 9.3 Employee cannot POST to /api/users
  {
    const { status } = await req('POST', '/api/users', {
      token: employeeToken,
      body: { name: 'Hack', email: 'hack@x.com', password: 'hack' },
    });
    assert('Employee POST /api/users → 403', status === 403, `got ${status}`);
  }

  // 9.4 Delete non-existent todo → should not crash
  {
    const { status } = await req('DELETE', '/api/todos/99999', { token: employeeToken });
    assert(
      'DELETE /todos/99999 — not crash (200 or 404)',
      [200, 404].includes(status),
      `got ${status}`,
    );
  }

  // 9.5 Delete non-existent finance record
  {
    const { status } = await req('DELETE', '/api/finance/records/99999', { token: employeeToken });
    assert(
      'DELETE /finance/records/99999 — not crash',
      [200, 404].includes(status),
      `got ${status}`,
    );
  }
}

// ── CLEANUP ───────────────────────────────────────────────────────────────────
async function cleanup() {
  section('10. Cleanup');

  // Delete call
  if (callId) {
    const { status } = await req('DELETE', `/api/coldcalls/${callId}`, { token: employeeToken });
    assert(`DELETE /coldcalls/${callId} → 200`, status === 200, `got ${status}`);
  }

  // Delete business (admin)
  if (bizId) {
    const { status } = await req('DELETE', `/api/businesses/${bizId}`, { token: adminToken });
    assert(`DELETE /businesses/${bizId} (admin) → 200`, status === 200, `got ${status}`);
  }

  // Delete todo
  if (todoId) {
    const { status } = await req('DELETE', `/api/todos/${todoId}`, { token: employeeToken });
    assert(`DELETE /todos/${todoId} → 200`, status === 200, `got ${status}`);
  }

  // Delete finance record
  if (recordId) {
    const { status } = await req('DELETE', `/api/finance/records/${recordId}`, {
      token: employeeToken,
    });
    assert(`DELETE /finance/records/${recordId} → 200`, status === 200, `got ${status}`);
  }

  // Delete employee user (admin)
  if (employeeId) {
    const { status } = await req('DELETE', `/api/users/${employeeId}`, { token: adminToken });
    assert(`DELETE /users/${employeeId} (test employee) → 200`, status === 200, `got ${status}`);
  }
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
function printSummary() {
  const total = passed + failed;
  console.log('\n' + '═'.repeat(55));
  console.log(
    `${c.bold} Results: ${c.green}${passed} passed${c.reset}${c.bold}, ${failed > 0 ? c.red : c.grey}${failed} failed${c.reset}${c.bold} / ${total} total${c.reset}`,
  );
  if (failures.length) {
    console.log(`\n${c.red}${c.bold}Failed tests:${c.reset}`);
    failures.forEach((f, i) => {
      console.log(`  ${c.red}${i + 1}.${c.reset} ${f.label}`);
      if (f.detail) console.log(`     ${c.grey}→ ${f.detail}${c.reset}`);
    });
  }
  console.log('═'.repeat(55) + '\n');
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${c.bold}${c.cyan}Lumicore Labs — API Test Runner${c.reset}`);
  console.log(`${c.grey}Target: ${BASE}${c.reset}`);

  // Check server is up before proceeding
  try {
    await fetch(`${BASE}/api/health`);
  } catch {
    console.error(`\n${c.red}✗ Cannot reach ${BASE}. Is the backend running?${c.reset}\n`);
    process.exit(1);
  }

  await testHealth();
  await testAuth();
  await testUsers();
  await testBusinesses();
  await testColdCalls();
  await testFinanceCategories();
  await testFinanceRecords();
  await testTodos();
  await testSecurity();
  await cleanup();
  printSummary();

  process.exit(failed > 0 ? 1 : 0);
})();
