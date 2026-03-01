import React, { createContext, useContext, useMemo, useState } from "react";
import { ingestIoTData, IoTSensorPayload } from "../api/iotApi";

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
  submitReadings: (token: string | null, zoneId: string) => Promise<void>;
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

  const submitReadings = async (token: string | null, zoneId: string) => {
    // Validate that all readings are present
    if (
      readings.airT === null ||
      readings.RH === null ||
      readings.EC === null ||
      readings.pH === null
    ) {
      throw new Error("All sensor readings must be provided");
    }

    const payload: IoTSensorPayload = {
      zone_id: zoneId,
      temperature_c: readings.airT,
      humidity_pct: readings.RH,
      ec_ms_cm: readings.EC,
      ph: readings.pH,
      timestamp: readings.updatedAt || new Date().toISOString(),
    };

    await ingestIoTData({ token, data: payload });
  };

  const value = useMemo(
    () => ({ readings, setAll, setOne, clear, submitReadings }),
    [readings]
  );

  return <SensorReadingsContext.Provider value={value}>{children}</SensorReadingsContext.Provider>;
};

export const useSensorReadings = () => {
  const ctx = useContext(SensorReadingsContext);
  if (!ctx) throw new Error("useSensorReadings must be used inside SensorReadingsProvider");
  return ctx;
};
