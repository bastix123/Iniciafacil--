"use client";

import "./balance-tributario.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePeriodo } from "@/context/PeriodoContext";

function fmtMonthLabel(yyyyMm) {
  if (!yyyyMm || !yyyyMm.includes("-")) return "—";
  const [y, m] = yyyyMm.split("-").map((x) => Number(x));
  const d = new Date(y, (m || 1) - 1, 1);
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(d);
}

function monthToRange(yyyyMm) {
  if (!yyyyMm || !yyyyMm.includes("-")) return { desde: "", hasta: "" };
  const [yStr, mStr] = yyyyMm.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return { desde: "", hasta: "" };

  const pad = (n) => String(n).padStart(2, "0");
  const lastDay = new Date(y, m, 0).getDate();
  return {
    desde: `${y}-${pad(m)}-01`,
    hasta: `${y}-${pad(m)}-${pad(lastDay)}`,
  };
}

export default function BalanceTributario() {
  const router = useRouter();

  // ✅ PERIODO GLOBAL (Topbar)
  const { periodo: periodoGlobal, ready: periodoReady } = usePeriodo();

  const [modoPeriodo, setModoPeriodo] = useState("mes"); // "mes" | "rango"

  // ✅ Periodo local (solo para esta pantalla), sincronizado con global cuando corresponde
  const [periodo, setPeriodo] = useState(periodoGlobal || ""); // yyyy-mm

  // ✅ 1) Inicializar/actualizar periodo local cuando cargue el global
  useEffect(() => {
    if (!periodoReady) return;
    // Si aún no hay periodo local, inicializa con global
    if (!periodo) setPeriodo(periodoGlobal);
  }, [periodoReady, periodoGlobal, periodo]);

  // ✅ 2) Mantener sincronía en “modo mes”
  useEffect(() => {
    if (!periodoReady) return;
    if (modoPeriodo !== "mes") return; // no pisar rango manual
    setPeriodo(periodoGlobal);
  }, [periodoReady, periodoGlobal, modoPeriodo]);

  const rangeFromMonth = useMemo(() => monthToRange(periodo), [periodo]);

  const [desde, setDesde] = useState("2026-01-01");
  const [hasta, setHasta] = useState("2026-01-31");

  const realDesde = modoPeriodo === "mes" ? rangeFromMonth.desde : desde;
  const realHasta = modoPeriodo === "mes" ? rangeFromMonth.hasta : hasta;

  const [nivel, setNivel] = useState(4);
  const [showCode, setShowCode] = useState(true);

  // Salida: Vista previa | PDF | Excel
  const [salida, setSalida] = useState("Vista previa");

  const rangoInvalido = useMemo(() => {
    if (!realDesde || !realHasta) return false;
    return String(realDesde) > String(realHasta);
  }, [realDesde, realHasta]);

  const canGenerate = useMemo(() => {
    return Boolean(realDesde && realHasta && !rangoInvalido);
  }, [realDesde, realHasta, rangoInvalido]);

  const ejemploNivel = useMemo(() => {
    const map = {
      1: "1",
      2: "1 → 11",
      3: "1 → 11 → 1101",
      4: "1 → 11 → 1101 → 1101-01",
    };
    return map[nivel] ?? map[4];
  }, [nivel]);

  const periodoLabel = useMemo(() => {
    if (modoPeriodo === "mes") return fmtMonthLabel(periodo);
    return `${realDesde} → ${realHasta}`;
  }, [modoPeriodo, periodo, realDesde, realHasta]);

  const resumen = useMemo(() => {
    return {
      periodo: periodoLabel,
      nivel: `${nivel}`,
      detalle: showCode ? "Sí" : "No",
      salida,
    };
  }, [periodoLabel, nivel, showCode, salida]);

  const onReset = () => {
    setModoPeriodo("mes");
    // ✅ vuelve al global (mes actual o el que el usuario eligió)
    setPeriodo(periodoGlobal);
    // rango manual vuelve a defaults (puedes cambiarlo si quieres)
    setDesde("2026-01-01");
    setHasta("2026-01-31");
    setNivel(4);
    setShowCode(true);
    setSalida("Vista previa");
  };

  const onGenerate = () => {
    if (!canGenerate) return;

    const qs = new URLSearchParams({
      periodo: modoPeriodo === "mes" ? periodo : "",
      desde: realDesde,
      hasta: realHasta,
      nivel: String(nivel),
      showCode: showCode ? "1" : "0",
      salida: salida === "Vista previa" ? "preview" : salida.toLowerCase(),
    });

    router.push(`/contabilidad/balance-tributario/resultado?${qs.toString()}`);
  };

  const primaryLabel =
    salida === "Vista previa" ? "Generar vista previa" : salida === "PDF" ? "Exportar PDF" : "Exportar Excel";

  return (
    <div className="bt-page">
      <div className="bt-header">
        <div>
          <h1 className="bt-title">Balance tributario</h1>
          <p className="bt-subtitle">
            Configura el período y opciones del balance. Mantendremos el contexto visible en resultados.
          </p>
        </div>
      </div>

      <div className="bt-panel">
        <div className="bt-topbar">
          <div className="bt-chips">
            <div className="bt-chip">
              <div className="k">Período</div>
              <div className="v">{resumen.periodo}</div>
            </div>
            <div className="bt-chip">
              <div className="k">Nivel</div>
              <div className="v">{resumen.nivel}</div>
            </div>
            <div className="bt-chip">
              <div className="k">Detalle</div>
              <div className="v">{resumen.detalle}</div>
            </div>
            <div className="bt-chip">
              <div className="k">Salida</div>
              <div className="v">{resumen.salida}</div>
            </div>
          </div>

          <div className="bt-actions">
            <button className="bt-btn bt-btnGhost" type="button" onClick={onReset}>
              Limpiar
            </button>

            <button
              className="bt-btn bt-btnPrimary"
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              title={!canGenerate ? "Completa el período correctamente" : primaryLabel}
            >
              {primaryLabel}
            </button>
          </div>

          <div className={`bt-status ${rangoInvalido ? "warn" : "ok"}`}>
            <span className="dot" aria-hidden="true" />
            <span className="txt">
              {rangoInvalido ? "Rango inválido: “Desde” es mayor que “Hasta”." : "Listo para generar."}
            </span>
          </div>
        </div>

        <div className="bt-grid">
          <section className="bt-card bt-cardPrimary">
            <div className="bt-cardHead">
              <span className="bt-cardTitle">Período</span>

              <div className="bt-tabs" role="tablist" aria-label="Tipo de período">
                <button
                  type="button"
                  className={`bt-tab ${modoPeriodo === "mes" ? "active" : ""}`}
                  onClick={() => setModoPeriodo("mes")}
                  role="tab"
                  aria-selected={modoPeriodo === "mes"}
                >
                  Mes/Año
                </button>
                <button
                  type="button"
                  className={`bt-tab ${modoPeriodo === "rango" ? "active" : ""}`}
                  onClick={() => setModoPeriodo("rango")}
                  role="tab"
                  aria-selected={modoPeriodo === "rango"}
                >
                  Rango
                </button>
              </div>
            </div>

            {modoPeriodo === "mes" ? (
              <>
                <div className="bt-field">
                  <label className="bt-label">Mes/Año</label>
                  <input
                    type="month"
                    className="bt-input"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                  />
                </div>

                <div className="bt-help">
                  Se generará para <strong>{fmtMonthLabel(periodo)}</strong> (
                  <span className="mono">{rangeFromMonth.desde}</span> →{" "}
                  <span className="mono">{rangeFromMonth.hasta}</span>).
                </div>
              </>
            ) : (
              <>
                <div className="bt-row2">
                  <div className="bt-field">
                    <label className="bt-label">Desde</label>
                    <input
                      type="date"
                      className={`bt-input ${rangoInvalido ? "invalid" : ""}`}
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                    />
                  </div>

                  <div className="bt-field">
                    <label className="bt-label">Hasta</label>
                    <input
                      type="date"
                      className={`bt-input ${rangoInvalido ? "invalid" : ""}`}
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bt-help">Selecciona un rango de fechas para el balance.</div>
              </>
            )}
          </section>

          <section className="bt-card">
            <div className="bt-cardHead">
              <span className="bt-cardTitle">Opciones del balance</span>
            </div>

            <div className="bt-field">
              <label className="bt-label">Nivel</label>
              <select className="bt-input" value={nivel} onChange={(e) => setNivel(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>

              <div className="bt-help">Nivel 1: grandes grupos · Nivel 4: cuentas más detalladas.</div>

              <div className="bt-miniExample">
                Ejemplo: <span className="mono">{ejemploNivel}</span>
              </div>
            </div>

            <div className="bt-setting">
              <div className="bt-settingText">
                <div className="t">Mostrar número de cuenta</div>
                <div className="d">Incluye el código junto al nombre de cuenta.</div>
              </div>

              <label className="bt-switch" aria-label="Mostrar número de cuenta">
                <input type="checkbox" checked={showCode} onChange={(e) => setShowCode(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
          </section>

          <section className="bt-card bt-cardLight">
            <div className="bt-cardHead">
              <span className="bt-cardTitle">Salida de archivo</span>
            </div>

            <div className="bt-field">
              <label className="bt-label">Tipo</label>

              <div className="bt-seg" role="radiogroup" aria-label="Tipo de salida">
                {["Vista previa", "PDF", "Excel"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`bt-segBtn ${salida === opt ? "active" : ""}`}
                    onClick={() => setSalida(opt)}
                    role="radio"
                    aria-checked={salida === opt}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="bt-help">
                Recomendado: valida en <strong>Vista previa</strong> y luego exporta a PDF/Excel.
              </div>
            </div>
          </section>
        </div>

        <div className="bt-footHint">
          Tip: en Resultados verás siempre arriba el período/nivel/detalle para no “perderte”.
        </div>
      </div>
    </div>
  );
}

