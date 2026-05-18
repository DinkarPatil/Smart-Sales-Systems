import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ManagerDashboard } from "@/features/manager/ManagerDashboard";

export default function ManagerPage() {
  return (
    <ProtectedRoute allowedRoles={["Manager"]}>
      <ManagerDashboard />
    </ProtectedRoute>
  );
}
