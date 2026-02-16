"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PeriodoContext = createContext(null);

function getMesActualYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

export function PeriodoProvider({ children, persist = true }) {
  const [periodo, setPeriodo] = useState(getMesActualYYYYMM);
  const [ready, setReady] = useState(false);

  // Inicial: mes actual o lo guardado en localStorage
  useEffect(() => {
    const fallback = getMesActualYYYYMM();

    if (!persist) {
      setPeriodo(fallback);
      setReady(true);
      return;
    }

    try {
      const saved = localStorage.getItem("contaplus_periodo");
      setPeriodo(saved || fallback);
    } catch {
      setPeriodo(fallback);
    }

    setReady(true);
  }, [persist]);

  // Persistir cambios
  useEffect(() => {
    if (!ready || !persist) return;
    try {
      localStorage.setItem("contaplus_periodo", periodo);
    } catch {}
  }, [periodo, ready, persist]);

  const value = useMemo(
    () => ({ periodo, setPeriodo, ready }),
    [periodo, ready]
  );

  return <PeriodoContext.Provider value={value}>{children}</PeriodoContext.Provider>;
}

export function usePeriodo() {
  const ctx = useContext(PeriodoContext);
  if (!ctx) throw new Error("usePeriodo debe usarse dentro de <PeriodoProvider>");
  return ctx;
}
