"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { extractError } from "@/lib/api/client";

export function useAdminData() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_companies: 0,
    total_products: 0,
    total_queries: 0,
    pending_queries: 0,
    resolved_queries: 0,
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [neuralStats, setNeuralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [u, c, s, a, n] = await Promise.all([
        adminApi.listUsers(),
        adminApi.listCompanies(),
        adminApi.stats(),
        adminApi.auditLogs(),
        adminApi.neuralDiagnostics(),
      ]);
      setUsers(u);
      setCompanies(c);
      setStats(s);
      setAuditLogs(a);
      setNeuralStats(n);
    } catch (err) {
      setError(extractError(err, "System heartbeat signal loss"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    users,
    companies,
    stats,
    auditLogs,
    neuralStats,
    loading,
    error,
    refetch: fetchAll,
  };
}
