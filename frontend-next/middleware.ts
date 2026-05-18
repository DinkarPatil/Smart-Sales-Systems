import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ROLE_PREFIXES } from '@/lib/role-redirect';

const secret = new TextEncoder().encode(process.env.SECRET_KEY ?? 'your-super-secret-key-change-me');

/**
 * Verify the access_token JWT only. The backend issues HS256-signed tokens whose payload
 * currently carries { sub: email, exp } — no role claim. We therefore read the role from a
 * companion non-HttpOnly `user_role` cookie set by the /api/auth/login proxy. That cookie is
 * a hint, not a secret; tamper-proof role enforcement still happens server-side on every API call.
 *
 * 🟡 Divergence from 00-single-login.md §6 — the prompt assumed the JWT itself carries the role.
 *    Documented in PR description.
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value;
  const role = req.cookies.get('user_role')?.value;

  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Cheap signature check (no DB roundtrip). Bad/expired token → re-login + clear cookies.
  if (!(await verifyToken(token))) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    url.searchParams.set('error', 'session_expired');
    const res = NextResponse.redirect(url);
    res.cookies.delete('access_token');
    res.cookies.delete('user_role');
    return res;
  }

  // Role-prefix enforcement.
  const matched = Object.entries(ROLE_PREFIXES).find(([prefix]) => pathname.startsWith(prefix));
  if (matched) {
    const [, allowed] = matched;
    if (!role || !allowed.includes(role)) {
      const url = new URL('/login', req.url);
      url.searchParams.set('error', 'wrong_role');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/auditor/:path*',
    '/billing/:path*',
    '/owner/:path*',
    '/curator/:path*',
    '/manager/:path*',
    '/reviewer/:path*',
    '/agent/:path*',
    '/sales/:path*',
    '/customer/:path*',
  ],
};
