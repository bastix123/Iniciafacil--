"use client";

import "./resumen-compra-venta.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function monthLabel(ym) {
  // ym: "YYYY-MM"
  if (!ym) return "—";
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

  
  const [periodo, setPeriodo] = useState("2026-01");

  
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

  const onReset = () => setPeriodo("2026-01");

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
            <button className="cv-btn cv-btnGhost" type="button" onClick={onReset}>
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
          {/* Input */}
          <div className="cv-field">
            <label className="cv-label">Período contable</label>
            <input
              type="month"
              className="cv-input"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
            <div className="cv-help">
              Formato: <span className="mono">MM/AAAA</span> (ej:{" "}
              <span className="mono">01/2026</span>).
            </div>
          </div>

          
          <div className="cv-info">
            <div className="cv-infoTop">
              <div className="cv-infoK">Se generará el resumen para</div>
              <div className={`cv-infoV ${pulse ? "pulse" : ""}`}>
                {resumen.periodoLabel}
              </div>
              <div className="cv-infoD">
                El sistema utilizará este período para consolidar compras, ventas e impuestos.
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
            Más adelante: esta pantalla abrirá una segunda vista con el resultado y opción de exportar.
          </div>
        </div>
      </section>
    </div>
  );
}

