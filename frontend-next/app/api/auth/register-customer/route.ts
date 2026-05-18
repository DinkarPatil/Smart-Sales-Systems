/**
 * POST /api/auth/register-customer
 * Body: { email, password, full_name? }
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  let body: { email?: string; password?: string; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' } },
      { status: 400 },
    );
  }
  if (body.password.length < 8) {
    return NextResponse.json(
      { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' } },
      { status: 400 },
    );
  }

  const res = await fetch(`${BACKEND}/api/v1/auth/register/customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      full_name: body.full_name ?? null,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const upstream = await res.text();
    let detail = 'Registration failed.';
    try {
      detail = (JSON.parse(upstream) as { detail?: string }).detail ?? detail;
    } catch {
      /* non-JSON */
    }
    return NextResponse.json(
      { error: { code: 'REGISTER_FAILED', message: detail } },
      { status: res.status },
    );
  }

  // Do NOT set cookies — account is inactive until /verify-email is consumed.
  return NextResponse.json({ ok: true });
}
