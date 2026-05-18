/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Returns: { ok: true } regardless of whether the email exists (prevents user enumeration).
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_BODY', message: 'Invalid JSON' } }, { status: 400 });
  }
  const email = (body.email ?? '').trim();
  if (!email) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: 'Email is required.' } },
      { status: 400 },
    );
  }

  // Fire-and-forget; never echo the backend's 404 to the client.
  const res = await fetch(`${BACKEND}/api/v1/auth/password-recovery/${encodeURIComponent(email)}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (res.status >= 500) {
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'Something went wrong. Try again later.' } },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
