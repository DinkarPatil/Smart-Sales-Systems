import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
