/**
 * POST /api/auth/register
 *
 * Staff self-register. Body: { email, password, full_name?, admin_secret_key }.
 * The backend creates an active Admin if admin_secret_key matches; otherwise it creates an
 * inactive SalesRep which we explicitly reject from this UI (the Customer path covers
 * the only "self-signup that needs verification" flow).
 *
 * On success we immediately log the new account in and set the same cookies the
 * /api/auth/login proxy does, so the user lands on their dashboard in one step.
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  let body: {
    email?: string;
    password?: string;
    full_name?: string | null;
    admin_secret_key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' } },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' } },
      { status: 400 },
    );
  }
  if (!body.admin_secret_key) {
    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_KEY_REQUIRED',
          message:
            'Staff sign-up requires the admin secret key. If you are a customer, use /register/customer instead.',
        },
      },
      { status: 400 },
    );
  }

  // 1. Create the account on the backend.
  const regRes = await fetch(`${BACKEND}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: body.full_name ?? null,
      admin_secret_key: body.admin_secret_key,
    }),
    cache: 'no-store',
  });
  if (!regRes.ok) {
    const upstream = await regRes.text();
    let detail = 'Registration failed.';
    try {
      detail = (JSON.parse(upstream) as { detail?: string }).detail ?? detail;
    } catch {
      /* non-JSON */
    }
    return NextResponse.json(
      { error: { code: 'REGISTER_FAILED', message: detail } },
      { status: regRes.status },
    );
  }
  const created = (await regRes.json()) as { role: string; is_active: boolean };

  // The backend only flips is_active=true when admin_secret_key matched. Refuse to proceed
  // if it created an inactive non-admin (that means the secret key was wrong but the email
  // was novel — block it as a clearer error).
  if (!created.is_active || created.role !== 'Admin') {
    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_KEY_INVALID',
          message:
            'The admin secret key did not match. Your account was created in an inactive state — contact an existing admin or delete it.',
        },
      },
      { status: 403 },
    );
  }

  // 2. Immediately log them in — admins are active on creation, no verification needed.
  const form = new URLSearchParams({ username: email, password });
  const loginRes = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    cache: 'no-store',
  });
  if (!loginRes.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTOLOGIN_FAILED',
          message: 'Account created, but auto-login failed. Try signing in manually.',
        },
      },
      { status: 502 },
    );
  }
  const { access_token } = (await loginRes.json()) as { access_token: string };

  const res = NextResponse.json({ ok: true, role: created.role });
  res.cookies.set('access_token', access_token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN,
    maxAge: ONE_WEEK,
  });
  res.cookies.set('user_role', created.role, {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    domain: COOKIE_DOMAIN,
    maxAge: ONE_WEEK,
  });
  return res;
}
