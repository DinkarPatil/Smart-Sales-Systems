"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, ROLE_HOMES } from "@/contexts/auth-context";

export default function HomePage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    router.replace(ROLE_HOMES[user?.role] || "/login");
  }, [status, user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <Loader2 size={48} className="text-accent-secondary animate-spin" />
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
        One moment...
      </p>
    </div>
  );
}
