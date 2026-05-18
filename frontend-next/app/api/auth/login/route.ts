/**
 * POST /api/auth/login
 *
 * Accepts JSON { email, password } from the login form, forwards as
 * application/x-www-form-urlencoded to the FastAPI OAuth2 password endpoint,
 * sets HttpOnly `access_token` and a companion `user_role` cookie, and
 * returns { ok: true, role } so the client can router.push() the right place.
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  let payload: { email?: string; password?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  const email = (payload.email ?? '').trim();
  const password = payload.password ?? '';
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' } },
      { status: 400 },
    );
  }

  // 1. Exchange credentials for a JWT.
  const form = new URLSearchParams({ username: email, password });
  const loginRes = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    cache: 'no-store',
  });

  if (!loginRes.ok) {
    const errBody = await loginRes.text();
    let detail = 'Login failed';
    try {
      detail = (JSON.parse(errBody) as { detail?: string }).detail ?? detail;
    } catch {
      /* non-JSON body */
    }
    return NextResponse.json({ error: { code: 'LOGIN_FAILED', message: detail } }, { status: loginRes.status });
  }

  const { access_token } = (await loginRes.json()) as { access_token: string; token_type: string };

  // 2. Resolve the user's role via /auth/me (the JWT itself doesn't carry it today).
  const meRes = await fetch(`${BACKEND}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: 'no-store',
  });
  if (!meRes.ok) {
    return NextResponse.json(
      { error: { code: 'ME_FAILED', message: 'Logged in but could not resolve user profile.' } },
      { status: 500 },
    );
  }
  const me = (await meRes.json()) as { role: string };

  // 3. Set cookies and return role.
  const res = NextResponse.json({ ok: true, role: me.role });
  res.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN,
    maxAge: ONE_WEEK,
  });
  // Companion cookie — readable by middleware (Edge runtime can't easily reach the backend).
  // NOT HttpOnly because middleware needs it; server-side enforcement still happens via /auth/me.
  res.cookies.set('user_role', me.role, {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN,
    maxAge: ONE_WEEK,
  });
  return res;
}
