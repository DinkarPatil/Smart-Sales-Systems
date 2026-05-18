import { Suspense } from 'react';
import { VerifyEmailClient } from '@/components/auth/verify-email-client';

export const metadata = { title: 'Verify email · Smart Sales' };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="card animate-pulse h-40" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
