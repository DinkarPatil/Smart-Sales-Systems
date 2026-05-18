import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OwnerDashboard } from "@/features/owner/OwnerDashboard";

export default function OwnerPage() {
  return (
    <ProtectedRoute allowedRoles={["Owner"]}>
      <OwnerDashboard />
    </ProtectedRoute>
  );
}
