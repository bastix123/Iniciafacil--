"use client";

import "./resumen-compra-venta.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ✅ usa tu picker bonito
import PeriodPicker from "@/components/ui/PeriodPicker";

// ✅ usa tu estado global (el mismo que usas en Topbar)
import { usePeriodo } from "@/context/PeriodoContext";

function getCurrentYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(ym) {
  if (!ym) return "—";
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${months[m - 1]} de ${y}`;
}

function toMMYYYY(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (!y || !m) return "";
  return `${m}/${y}`;
}

export default function ResumenCompraVenta() {
  const router = useRouter();

  // ✅ periodo global
  const { periodo, setPeriodo } = usePeriodo();

  // (Opcional) Si por alguna razón viene vacío, lo normalizamos al mes actual
  useEffect(() => {
    if (!periodo) setPeriodo(getCurrentYYYYMM());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 220);
    return () => clearTimeout(t);
  }, [periodo]);

  const canGenerate = useMemo(() => Boolean(periodo), [periodo]);

  const resumen = useMemo(() => {
    return {
      periodoLabel: monthLabel(periodo),
      periodoMeta: toMMYYYY(periodo),
    };
  }, [periodo]);

  const onReset = () => setPeriodo(getCurrentYYYYMM());

  const onGenerate = () => {
    if (!canGenerate) return;
    const qs = new URLSearchParams({ periodo });
    router.push(`/contabilidad/compra-venta/resultado?${qs.toString()}`);
  };

  const btnLabel = canGenerate
    ? `Generar resumen de ${resumen.periodoLabel}`
    : "Generar resumen";

  return (
    <div className="cv-page">
      <header className="cv-header">
        <div>
          <h1 className="cv-title">Resumen mensual de compras y ventas</h1>
          <p className="cv-subtitle">
            Genera el consolidado contable del período seleccionado.
          </p>
        </div>
      </header>

      <section className="cv-module" aria-label="Resumen compra/venta">
        <div className="cv-moduleHead">
          <div className="cv-headLeft">
            <div className="cv-headK">Mes contable</div>
            <div className="cv-headV">
              <span className={`cv-headMonth ${pulse ? "pulse" : ""}`}>
                {resumen.periodoLabel}
              </span>
              <span className="cv-badge mono">{resumen.periodoMeta}</span>
            </div>
          </div>

          <div className="cv-headRight">
            <button
              className="cv-btn cv-btnGhost"
              type="button"
              onClick={onReset}
            >
              Limpiar
            </button>

            <button
              className="cv-btn cv-btnPrimary"
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              title={!canGenerate ? "Selecciona un período" : btnLabel}
            >
              {btnLabel}
            </button>
          </div>
        </div>

        <div className="cv-moduleBody">
          {/* ✅ Picker bonito, conectado al periodo global */}
          <div className="cv-field">
            <label className="cv-label">Período contable</label>

            <PeriodPicker
              value={periodo}
              onChange={setPeriodo}
              label="" // ya tienes label arriba
            />

            <div className="cv-help">
              Se aplica globalmente en el sistema (Topbar y vistas que lo usen).
            </div>
          </div>

          <div className="cv-info">
            <div className="cv-infoTop">
              <div className="cv-infoK">Se generará el resumen para</div>
              <div className={`cv-infoV ${pulse ? "pulse" : ""}`}>
                {resumen.periodoLabel}
              </div>
              <div className="cv-infoD">
                El sistema utilizará este período para consolidar compras, ventas
                e impuestos.
              </div>
            </div>

            <div className="cv-divider" />

            <div className="cv-infoList">
              <div className="cv-infoListT">Este resumen incluirá</div>
              <ul className="cv-ul">
                <li>Totales de compras</li>
                <li>Totales de ventas</li>
                <li>IVA débito y crédito</li>
                <li>Diferencias y cuadratura mensual</li>
              </ul>
            </div>
          </div>

          <div className="cv-footHint">
            Más adelante: esta pantalla abrirá una segunda vista con el resultado
            y opción de exportar.
          </div>
        </div>
      </section>
    </div>
  );
}

