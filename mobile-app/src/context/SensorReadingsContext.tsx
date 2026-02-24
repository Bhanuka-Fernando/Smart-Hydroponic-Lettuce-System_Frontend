import React, { createContext, useContext, useMemo, useState } from "react";

export type SensorReadings = {
  airT: number | null; // °C
  RH: number | null;   // %
  EC: number | null;   // ms/cm (or your unit)
  pH: number | null;   // pH
  updatedAt?: string | null;
};

type Ctx = {
  readings: SensorReadings;
  setAll: (r: Partial<SensorReadings>) => void;
  setOne: (key: keyof Omit<SensorReadings, "updatedAt">, val: number | null) => void;
  clear: () => void;
};

const SensorReadingsContext = createContext<Ctx | null>(null);

export const SensorReadingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [readings, setReadings] = useState<SensorReadings>({
    airT: 22,
    RH: 45,
    EC: 1.4,
    pH: 6.2,
    updatedAt: new Date().toISOString(),
  });

  const setAll = (r: Partial<SensorReadings>) => {
    setReadings((prev) => ({
      ...prev,
      ...r,
      updatedAt: new Date().toISOString(),
    }));
  };

  const setOne: Ctx["setOne"] = (key, val) => {
    setReadings((prev) => ({
      ...prev,
      [key]: val,
      updatedAt: new Date().toISOString(),
    }));
  };

  const clear = () => {
    setReadings({ airT: null, RH: null, EC: null, pH: null, updatedAt: null });
  };

  const value = useMemo(() => ({ readings, setAll, setOne, clear }), [readings]);

  return <SensorReadingsContext.Provider value={value}>{children}</SensorReadingsContext.Provider>;
};

export const useSensorReadings = () => {
  const ctx = useContext(SensorReadingsContext);
  if (!ctx) throw new Error("useSensorReadings must be used inside SensorReadingsProvider");
  return ctx;
};
