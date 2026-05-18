import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SalesRepDashboard } from "@/features/sales/SalesRepDashboard";

export default function SalesPage() {
  return (
    <ProtectedRoute allowedRoles={["SalesRep"]}>
      <SalesRepDashboard />
    </ProtectedRoute>
  );
}
