/**
 * POST /api/auth/verify-email
 * Body: { token }
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  if (!body.token) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Token is required.' } },
      { status: 400 },
    );
  }

  const res = await fetch(
    `${BACKEND}/api/v1/auth/verify-email/${encodeURIComponent(body.token)}`,
    { method: 'POST', cache: 'no-store' },
  );
  if (!res.ok) {
    const upstream = await res.text();
    let detail = 'Verification failed.';
    try {
      detail = (JSON.parse(upstream) as { detail?: string }).detail ?? detail;
    } catch {
      /* non-JSON */
    }
    return NextResponse.json({ error: { code: 'VERIFY_FAILED', message: detail } }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
