"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && allowedRoles && !allowedRoles.includes(user?.role)) {
      router.replace("/login");
    }
  }, [status, user, allowedRoles, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <Loader2 size={48} className="text-accent-secondary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
          Loading...
        </p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) return null;
  return children;
}
