import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in · Smart Sales' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card animate-pulse h-72" />}>
      <LoginForm />
    </Suspense>
  );
}
