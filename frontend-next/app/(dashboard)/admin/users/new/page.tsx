import { api } from '@/lib/api';
import { PageHeader } from '@/components/admin/presentation';
import { ProvisionUserForm } from '@/components/admin/provision-user-form';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const companies = await api.admin.companies.list();
  return (
    <div>
      <PageHeader
        eyebrow="Users · New"
        title="Provision a new user"
        description="Creates an active account, emails the credentials, and writes an AuthEvent. You can attach multi-company assignments after creation."
      />
      <ProvisionUserForm companies={companies} />
    </div>
  );
}
