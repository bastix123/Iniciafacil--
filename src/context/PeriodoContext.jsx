"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PeriodoContext = createContext(null);

const STORAGE_KEY = "contaplus_periodo";
const YM_RE = /^\d{4}-\d{2}$/;

function getMesActualYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

function normalizeYM(value, fallback) {
  const v = String(value || "").trim();
  return YM_RE.test(v) ? v : fallback;
}

export function PeriodoProvider({ children, persist = true, storageKey = STORAGE_KEY, defaultPeriodo }) {
  // ✅ Hydration-safe: en SSR y primer render de cliente es estable ("")
  const [periodo, _setPeriodo] = useState("");
  const [ready, setReady] = useState(false);

  // Setter “seguro” (valida formato)
  const setPeriodo = useCallback(
    (next) => {
      const fb = defaultPeriodo ? normalizeYM(defaultPeriodo, getMesActualYYYYMM()) : getMesActualYYYYMM();
      _setPeriodo((prev) => {
        const normalized = normalizeYM(typeof next === "function" ? next(prev) : next, fb);
        return normalized;
      });
    },
    [defaultPeriodo]
  );

  // Inicializar (solo en cliente)
  useEffect(() => {
    const fb = defaultPeriodo ? normalizeYM(defaultPeriodo, getMesActualYYYYMM()) : getMesActualYYYYMM();

    if (!persist) {
      _setPeriodo(fb);
      setReady(true);
      return;
    }

    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      _setPeriodo(normalizeYM(saved, fb));
    } catch {
      _setPeriodo(fb);
    } finally {
      setReady(true);
    }
  }, [persist, storageKey, defaultPeriodo]);

  // Persistir cambios (cuando ya está listo)
  useEffect(() => {
    if (!ready || !persist) return;
    try {
      window.localStorage.setItem(storageKey, periodo);
    } catch {}
  }, [periodo, ready, persist, storageKey]);

  const value = useMemo(() => ({ periodo, setPeriodo, ready }), [periodo, setPeriodo, ready]);

  return <PeriodoContext.Provider value={value}>{children}</PeriodoContext.Provider>;
}

export function usePeriodo() {
  const ctx = useContext(PeriodoContext);
  if (!ctx) throw new Error("usePeriodo debe usarse dentro de <PeriodoProvider>");
  return ctx;
}