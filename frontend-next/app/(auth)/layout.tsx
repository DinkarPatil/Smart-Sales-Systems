export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-stretch justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Smart Sales'}
          </h1>
          <p className="muted mt-1">Multi-tenant sales support platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
