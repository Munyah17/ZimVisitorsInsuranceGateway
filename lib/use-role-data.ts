"use client";

/**
 * Fetches a role-gated dashboard endpoint (/api/admin/data, /api/agent/data)
 * with the caller's Supabase access token attached, and redirects to
 * /portals if there's no session or the server rejects the role. Used by
 * every admin/agent page instead of each hand-rolling its own auth check.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export function useRoleData<T>(endpoint: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/portals");
          return;
        }

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/portals");
          return;
        }
        if (!res.ok) throw new Error("request failed");

        const json = (await res.json()) as T;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { data, loading, error };
}
