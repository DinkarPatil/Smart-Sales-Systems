"use client";

import { useCallback, useEffect, useState } from "react";
import { managerApi } from "@/lib/api/manager";
import { extractError } from "@/lib/api/client";

export function useManagerData() {
  const [stats, setStats] = useState({
    total_queries: 0,
    resolved_queries: 0,
    active_sales_reps: 0,
    sentiment_score: 0,
  });
  const [team, setTeam] = useState([]);
  const [queries, setQueries] = useState([]);
  const [companyStatus, setCompanyStatus] = useState({
    name: "",
    admin_suspended: false,
    manager_suspended: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t, q, c] = await Promise.all([
        managerApi.stats(),
        managerApi.team(),
        managerApi.queries(),
        managerApi.companyStatus(),
      ]);
      setStats(s);
      setTeam(t);
      setQueries(q);
      setCompanyStatus(c);
    } catch (err) {
      setError(extractError(err, "Couldn't load your dashboard. Please refresh."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, team, queries, companyStatus, loading, error, refetch: fetchAll };
}
