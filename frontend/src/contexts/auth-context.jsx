"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { getToken, setToken } from "@/lib/api/client";

const AuthContext = createContext(null);

const ROLE_REDIRECTS = {
  Admin: "/admin",
  Manager: "/manager",
  Owner: "/owner",
  SalesRep: "/sales",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'authenticated' | 'unauthenticated'
  const router = useRouter();

  // Rehydrate session from localStorage on mount.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    authApi
      .me()
      .then((data) => {
        setUser(data);
        setStatus("authenticated");
      })
      .catch(() => {
        setToken(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login(email, password);
    setToken(access_token);
    const me = await authApi.me();
    setUser(me);
    setStatus("authenticated");
    router.push(ROLE_REDIRECTS[me.role] || "/login");
    return me;
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    router.push("/login");
  }, [router]);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateMe(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, updateProfile, setUser }),
    [user, status, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const ROLE_HOMES = ROLE_REDIRECTS;
