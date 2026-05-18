import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { QueryProvider } from '@/components/dashboard/query-provider';
import { Topbar } from '@/components/dashboard/topbar';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/http';

export const metadata = { title: 'Admin · Smart Sales' };

// `redirect()` from next/navigation throws a special internal error that we
// MUST re-throw — Next.js uses it as control flow. Anything else gets converted
// into a redirect-to-login with a diagnostic banner.
function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Defence-in-depth: middleware already gated /admin, but layout re-checks via /auth/me
  // so a tampered companion cookie can't sneak someone in. Every failure mode here
  // routes to /login with a reason rather than crashing the React mount.
  let me;
  try {
    me = await api.auth.me();
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        redirect('/login?next=/admin&error=session_expired');
      }
      if (err.code === 'BACKEND_UNREACHABLE') {
        redirect('/login?error=backend_down');
      }
      if (err.code === 'SCHEMA_MISMATCH') {
        redirect('/login?error=schema_drift');
      }
    }
    // Unknown failure — log + bail to /login instead of taking down the tree.
    console.error('[admin layout] /auth/me failed:', err);
    redirect('/login?error=layout_failed');
  }

  if (!me || me.role !== 'Admin') {
    redirect('/login?error=wrong_role');
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-paper text-ink">
        <Topbar email={me.email} role={me.role} />
        <div className="mx-auto flex max-w-screen-2xl">
          <AdminSidebar />
          <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
