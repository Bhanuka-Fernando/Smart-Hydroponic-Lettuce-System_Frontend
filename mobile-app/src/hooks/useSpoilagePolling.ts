import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getRecentPredictions, type SpoilagePredictionRow } from "../api/SpoilageApi";

export function useSpoilagePolling(limit: number, pollMs: number = 4000) {
  const [rows, setRows] = useState<SpoilagePredictionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // ✅ used to avoid setting state when nothing changed
  const lastFirstIdRef = useRef<number | string | null>(null);
  const lastLenRef = useRef<number>(0);

  const load = useCallback(async () => {
    try {
      setError(null);

      // optional: only show loading spinner on first load
      if (rows.length === 0) setLoading(true);

      const data = await getRecentPredictions(limit);

      const firstId = (data?.[0] as any)?.id ?? null;
      const newLen = Array.isArray(data) ? data.length : 0;

      // ✅ only update state when data changed
      const changed =
        firstId !== lastFirstIdRef.current || newLen !== lastLenRef.current;

      if (changed) {
        lastFirstIdRef.current = firstId;
        lastLenRef.current = newLen;
        setRows(data);
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [limit, rows.length]);

  useFocusEffect(
    useCallback(() => {
      load();
      timerRef.current = setInterval(load, pollMs);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [load, pollMs])
  );

  return { rows, loading, error, refresh: load };
}