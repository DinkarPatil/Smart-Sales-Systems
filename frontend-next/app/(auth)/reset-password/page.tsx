import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: 'Reset password · Smart Sales' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card animate-pulse h-72" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
