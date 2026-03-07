import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getRecentPredictions, type SpoilagePredictionRow } from "../api/SpoilageApi";

export function useSpoilagePolling(limit: number, pollMs: number = 4000) {
  const [rows, setRows] = useState<SpoilagePredictionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  const lastSigRef = useRef<string>("");

  const load = useCallback(async () => {
    try {
      setError(null);
      if (rows.length === 0) setLoading(true);

      const data = await getRecentPredictions(limit);

      // Build a cheap signature to avoid re-render storms
      const firstId = (data?.[0] as any)?.id ?? "";
      const len = Array.isArray(data) ? data.length : 0;
      const sig = `${firstId}:${len}`;

      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        if (isActiveRef.current) setRows(data);
      }
    } catch (e: any) {
      if (isActiveRef.current) setError(String(e?.message ?? e));
    } finally {
      if (isActiveRef.current) setLoading(false);
    }
  }, [limit, pollMs, rows.length]); // 👈 keep rows.length ONLY for first-load spinner, not for interval

  useFocusEffect(
    useCallback(() => {
      isActiveRef.current = true;

      load();

      timerRef.current = setInterval(load, pollMs);

      return () => {
        isActiveRef.current = false;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [load, pollMs])
  );

  return { rows, loading, error, refresh: load };
}