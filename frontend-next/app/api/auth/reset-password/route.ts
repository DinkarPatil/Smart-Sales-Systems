/**
 * POST /api/auth/reset-password
 * Body: { token, new_password }
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  let body: { token?: string; new_password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  if (!body.token || !body.new_password) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Token and new password are required.' } },
      { status: 400 },
    );
  }
  if (body.new_password.length < 8) {
    return NextResponse.json(
      { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' } },
      { status: 400 },
    );
  }

  const res = await fetch(`${BACKEND}/api/v1/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: body.token, new_password: body.new_password }),
    cache: 'no-store',
  });
  const upstream = await res.text();
  if (!res.ok) {
    let detail = 'Reset failed.';
    try {
      detail = (JSON.parse(upstream) as { detail?: string }).detail ?? detail;
    } catch {
      /* non-JSON */
    }
    return NextResponse.json({ error: { code: 'RESET_FAILED', message: detail } }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
