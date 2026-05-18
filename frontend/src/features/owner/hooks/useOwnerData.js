"use client";

import { useCallback, useEffect, useState } from "react";
import { ownerApi } from "@/lib/api/owner";
import { extractError } from "@/lib/api/client";

export function useOwnerData() {
  const [stats, setStats] = useState({
    company_name: "—",
    total_products: 0,
    total_team_members: 0,
    pending_queries: 0,
    resolved_queries: 0,
    escalated_queries: 0,
    products_missing_docs: 0,
    high_priority_pending: 0,
  });
  const [products, setProducts] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, p, h, n] = await Promise.all([
        ownerApi.stats(),
        ownerApi.listProducts(),
        ownerApi.history(),
        ownerApi.listNegotiations(),
      ]);
      setStats(s);
      setProducts(p);
      setHistory(h);
      setNegotiations(n);
    } catch (err) {
      setError(extractError(err, "Couldn't load your dashboard. Please refresh."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, products, negotiations, history, loading, error, refetch: fetchAll };
}

export function calculateSLA(deadline) {
  if (!deadline) return { text: "—", color: "text-slate-500", expired: false, hours: 9999 };
  const remaining = new Date(deadline) - new Date();
  if (remaining < 0) return { text: "EXPIRED", color: "text-red-500", expired: true, hours: 0 };
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return {
    text: `${hours}h ${minutes}m`,
    color: hours < 12 ? "text-red-400" : "text-emerald-400",
    expired: false,
    hours,
  };
}
