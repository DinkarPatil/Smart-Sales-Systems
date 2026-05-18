import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, StatTile } from '@/components/admin/presentation';
import { CompanyDetailActions } from '@/components/admin/company-detail-actions';

export const dynamic = 'force-dynamic';

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: { companyId: string };
}) {
  const companies = await api.admin.companies.list();
  const company = companies.find((c) => c.id === params.companyId);
  if (!company) notFound();

  return (
    <div>
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All companies
      </Link>
      <PageHeader
        eyebrow="Company"
        title={company.name}
        description={`ID: ${company.id}`}
      />

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Products" value={company.product_count ?? 0} />
        <StatTile label="Users" value={company.user_count ?? 0} />
        <StatTile label="Agents" value={company.sales_rep_count ?? 0} />
        <StatTile
          label="Weekly tokens"
          value={(company.weekly_tokens ?? 0).toLocaleString()}
          hint={`monthly: ${(company.monthly_tokens ?? 0).toLocaleString()}`}
        />
      </section>

      <CompanyDetailActions company={company} />
    </div>
  );
}
