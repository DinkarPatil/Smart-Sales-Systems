import { PageHeader } from '@/components/admin/presentation';
import { NewCompanyForm } from '@/components/admin/new-company-form';

export default function NewCompanyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Companies · New"
        title="Create a tenant"
        description="Sets up the company record and its scope; you can attach an Owner from /admin/users immediately after."
      />
      <NewCompanyForm />
    </div>
  );
}
