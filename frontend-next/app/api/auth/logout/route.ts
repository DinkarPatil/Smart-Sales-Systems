/**
 * POST /api/auth/logout
 * Clears both auth cookies. The JWT is stateless so the backend has nothing to revoke.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('access_token');
  res.cookies.delete('user_role');
  return res;
}
