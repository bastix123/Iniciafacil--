"use client";

import "./libro-mayor.css";
import { useMemo, useState } from "react";

function fmtCL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CL");
}

// Demo cuentas (luego conectas a tu plan real / API)
const CUENTAS = [
  { codigo: "1101-01", nombre: "Caja", imputable: true },
  { codigo: "1101-02", nombre: "Caja chica", imputable: true },
  { codigo: "1102-01", nombre: "Banco Estado", imputable: true },
  { codigo: "2101-01", nombre: "Proveedores", imputable: true },
  { codigo: "4101-01", nombre: "Costo de explotación", imputable: true },
];

function demoMayor({ desde, hasta, cuenta }) {
  // ✅ En real: este saldo inicial debería venir del backend (saldo anterior al período)
  const saldoInicial = 109020;

  const movimientos = [
    { fecha: desde, glosa: "Saldo inicial", doc: "-", debe: 0, haber: 0, inicial: true },
    { fecha: desde, glosa: "Movimiento 1", doc: "COMP-1001", debe: 10860, haber: 0 },
    { fecha: hasta, glosa: "Movimiento 2", doc: "COMP-1002", debe: 0, haber: 10860 },
  ];

  let saldo = saldoInicial;

  const rows = movimientos.map((m) => {
    if (!m.inicial) saldo += m.debe - m.haber;
    return { ...m, saldo };
  });

  const totalDebe = rows.reduce((a, r) => a + r.debe, 0);
  const totalHaber = rows.reduce((a, r) => a + r.haber, 0);

  return {
    cuenta,
    desde,
    hasta,
    saldoInicial,
    rows,
    totalDebe,
    totalHaber,
    saldoFinal: saldo,
  };
}

export default function LibroMayor() {
  // Filtros
  const [modoPeriodo, setModoPeriodo] = useState("Rango"); // "Rango" | "Mes"
  const [desde, setDesde] = useState("2026-01-01");
  const [hasta, setHasta] = useState("2026-01-31");
  const [mes, setMes] = useState("2026-01"); // YYYY-MM

  const [soloVigentes, setSoloVigentes] = useState(true);
  const [mostrarDetalle, setMostrarDetalle] = useState(true);

  // Cuenta
  const [qCuenta, setQCuenta] = useState("");
  const [cuenta, setCuenta] = useState(CUENTAS[0]?.codigo ?? "");

  // Salida
  const [salida, setSalida] = useState("Vista previa"); // "Vista previa" | "PDF" | "Excel"

  // Resultado (preview)
  const [preview, setPreview] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const cuentaObj = useMemo(
    () => CUENTAS.find((c) => c.codigo === cuenta) ?? null,
    [cuenta]
  );

  const cuentasFiltradas = useMemo(() => {
    const qq = qCuenta.trim().toLowerCase();
    if (!qq) return CUENTAS;
    return CUENTAS.filter(
      (c) =>
        c.codigo.toLowerCase().includes(qq) ||
        c.nombre.toLowerCase().includes(qq)
    );
  }, [qCuenta]);

  const periodo = useMemo(() => {
    if (modoPeriodo === "Mes") {
      const [y, m] = mes.split("-").map((x) => Number(x));
      const first = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
      // demo: 28 (en real: último día del mes)
      const last = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-28`;
      return { desde: first, hasta: last, label: `${mes}` };
    }
    return { desde, hasta, label: `${desde} → ${hasta}` };
  }, [modoPeriodo, desde, hasta, mes]);

  const rangoInvalido = useMemo(() => {
    if (modoPeriodo !== "Rango") return false;
    if (!desde || !hasta) return false;
    return String(desde) > String(hasta);
  }, [modoPeriodo, desde, hasta]);

  const canGenerate = useMemo(() => {
    if (!cuenta) return false;
    if (modoPeriodo === "Rango") return Boolean(desde && hasta && !rangoInvalido);
    return Boolean(mes);
  }, [cuenta, modoPeriodo, desde, hasta, mes, rangoInvalido]);

  const payload = useMemo(() => {
    return {
      periodo,
      cuenta: cuentaObj ? `${cuentaObj.codigo} - ${cuentaObj.nombre}` : cuenta,
      filtros: { soloVigentes, mostrarDetalle },
      salida,
    };
  }, [periodo, cuentaObj, cuenta, soloVigentes, mostrarDetalle, salida]);

  const generatePreview = () => {
    const result = demoMayor({
      desde: payload.periodo.desde,
      hasta: payload.periodo.hasta,
      cuenta: payload.cuenta,
    });
    setPreview(result);
  };

  const onGenerate = () => {
    if (!canGenerate) return;

    setLastRun(payload);

    if (salida === "Vista previa") {
      generatePreview();
      return;
    }

    // PDF / Excel: aquí llamas API real
    setPreview(null);
    alert(
      `Generar ${salida} (pendiente)\n\nCuenta: ${payload.cuenta}\nPeriodo: ${payload.periodo.label}`
    );
  };

  const onReset = () => {
    setModoPeriodo("Rango");
    setDesde("2026-01-01");
    setHasta("2026-01-31");
    setMes("2026-01");
    setSoloVigentes(true);
    setMostrarDetalle(true);
    setQCuenta("");
    setCuenta(CUENTAS[0]?.codigo ?? "");
    setSalida("Vista previa");
    setPreview(null);
    setLastRun(null);
  };

  // Estado UX
  const status = useMemo(() => {
    if (!cuenta) return { kind: "warn", text: "Selecciona una cuenta." };
    if (modoPeriodo === "Rango") {
      if (!desde || !hasta) return { kind: "warn", text: "Selecciona el rango de fechas." };
      if (rangoInvalido) return { kind: "warn", text: "El rango es inválido: “Desde” es mayor que “Hasta”." };
    } else {
      if (!mes) return { kind: "warn", text: "Selecciona un mes/año." };
    }
    return { kind: "ok", text: "Listo para generar." };
  }, [cuenta, modoPeriodo, desde, hasta, mes, rangoInvalido]);

  const previewBtnLabel = preview ? "Actualizar preview" : "Generar vista previa";

  return (
    <div className="lm-page">
      <div className="lm-header">
        <div>
          <h1 className="lm-title">Libro mayor</h1>
          <p className="lm-subtitle">
            Genera el libro mayor por período y cuenta. Puedes previsualizar antes de exportar.
          </p>
        </div>
      </div>

      <div className="lm-panel">
        {/* Top row */}
        <div className="lm-panelTop">
          <div className="lm-summary">
            <div className="lm-summaryItem">
              <span className="k">Período</span>
              <span className="v">{periodo.label}</span>
            </div>
            <div className="lm-summaryItem">
              <span className="k">Cuenta</span>
              <span className="v mono">
                {cuentaObj ? `${cuentaObj.codigo} - ${cuentaObj.nombre}` : "—"}
              </span>
            </div>
            <div className="lm-summaryItem">
              <span className="k">Salida</span>
              <span className="v">{salida}</span>
            </div>
          </div>

          <div className="lm-actionsTop">
            <button className="lm-btn lm-btnGhost" type="button" onClick={onReset}>
              Limpiar
            </button>
            <button
              className="lm-btn lm-btnPrimary"
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              title={!canGenerate ? "Completa cuenta y período" : "Generar libro mayor"}
            >
              Generar
            </button>
          </div>

          {/* Estado UX */}
          <div className={`lm-status ${status.kind}`}>
            <span className="lm-statusDot" aria-hidden="true" />
            <span className="lm-statusText">{status.text}</span>
          </div>
        </div>

        {/* Cards */}
        <div className="lm-grid">
          {/* Período */}
          <section className="lm-card lm-cardPrimary">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Período</span>
              <div className="lm-seg" role="tablist" aria-label="Modo de período">
                <button
                  type="button"
                  className={`lm-segBtn ${modoPeriodo === "Rango" ? "active" : ""}`}
                  onClick={() => setModoPeriodo("Rango")}
                >
                  Rango
                </button>
                <button
                  type="button"
                  className={`lm-segBtn ${modoPeriodo === "Mes" ? "active" : ""}`}
                  onClick={() => setModoPeriodo("Mes")}
                >
                  Mes/Año
                </button>
              </div>
            </div>

            {modoPeriodo === "Rango" ? (
              <div className="lm-row2">
                <div className="lm-field">
                  <label className="lm-label">Desde</label>
                  <input
                    type="date"
                    className={`lm-input ${rangoInvalido ? "invalid" : ""}`}
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                  />
                </div>
                <div className="lm-field">
                  <label className="lm-label">Hasta</label>
                  <input
                    type="date"
                    className={`lm-input ${rangoInvalido ? "invalid" : ""}`}
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                  />
                </div>
                {rangoInvalido && (
                  <div className="lm-inlineWarn">
                    El rango es inválido. Revisa “Desde” y “Hasta”.
                  </div>
                )}
              </div>
            ) : (
              <div className="lm-field">
                <label className="lm-label">Mes/Año</label>
                <input
                  type="month"
                  className="lm-input"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                />
                <div className="lm-help">
                  Usa Mes/Año para cierres mensuales y reportes recurrentes.
                </div>
              </div>
            )}
          </section>

          {/* Cuenta */}
          <section className="lm-card">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Cuenta</span>
              <span className="lm-badge">Imputable</span>
            </div>

            <div className="lm-field">
              <label className="lm-label">Buscar cuenta</label>
              <div className="lm-search">
                <span className="lm-searchIcon" aria-hidden="true">🔍</span>
                <input
                  className="lm-searchInput"
                  value={qCuenta}
                  onChange={(e) => setQCuenta(e.target.value)}
                  placeholder="Código o nombre..."
                />
              </div>
            </div>

            <div className="lm-field">
              <label className="lm-label">Seleccionar</label>
              <select className="lm-input" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                {cuentasFiltradas.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
              <div className="lm-help">
                Selecciona una cuenta imputable para generar el libro mayor.
              </div>
            </div>
          </section>

          {/* Opciones */}
          <section className="lm-card">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Opciones</span>
            </div>

            <label className="lm-check">
              <input
                type="checkbox"
                checked={soloVigentes}
                onChange={(e) => setSoloVigentes(e.target.checked)}
              />
              <span>Solo vigentes</span>
            </label>

            <label className="lm-check">
              <input
                type="checkbox"
                checked={mostrarDetalle}
                onChange={(e) => setMostrarDetalle(e.target.checked)}
              />
              <span>Mostrar detalle</span>
            </label>

            <div className="lm-help">
              “Mostrar detalle” incluye cada movimiento individual (fecha, glosa, documento).
            </div>
          </section>

          {/* Salida */}
          <section className="lm-card lm-cardLight">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Salida</span>
            </div>

            <div className="lm-field">
              <label className="lm-label">Tipo</label>

              <div className="lm-seg lm-segWide" role="radiogroup" aria-label="Tipo de salida">
                {["Vista previa", "PDF", "Excel"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`lm-segBtn ${salida === opt ? "active" : ""}`}
                    onClick={() => setSalida(opt)}
                    aria-checked={salida === opt}
                    role="radio"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="lm-help">
                Recomendado: usa “Vista previa” para validar y luego exporta a PDF/Excel.
              </div>
            </div>
          </section>
        </div>

        
        <div className="lm-preview">
          {!preview ? (
            <div className="lm-empty">
              <div className="lm-emptyIcon">📘</div>
              <div className="lm-emptyText">
                Sin resultados aún. Configura filtros y presiona <strong>Generar</strong>.
              </div>
            </div>
          ) : (
            <>
              <div className="lm-ledgerHeader">
                <div className="lm-ledgerTitle">📘 Libro mayor</div>

                <div className="lm-ledgerMeta">
                  <span><strong>Cuenta:</strong> {preview.cuenta}</span>
                  <span><strong>Período:</strong> {preview.desde} → {preview.hasta}</span>
                  <span><strong>Saldo inicial:</strong> $ {fmtCL(preview.saldoInicial)}</span>
                </div>
              </div>

              <div className="lm-metrics">
                <div className="lm-metric">
                  <div className="k">Total Debe</div>
                  <div className="v mono">$ {fmtCL(preview.totalDebe)}</div>
                </div>
                <div className="lm-metric">
                  <div className="k">Total Haber</div>
                  <div className="v mono">$ {fmtCL(preview.totalHaber)}</div>
                </div>
                <div className="lm-metric">
                  <div className="k">Saldo final</div>
                  <div className="v mono">$ {fmtCL(preview.saldoFinal)}</div>
                </div>
              </div>

              <div className="lm-tableWrap">
                <table className="lm-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Glosa</th>
                      <th>Documento</th>
                      <th className="r">Debe</th>
                      <th className="r">Haber</th>
                      <th className="r">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r, i) => (
                      <tr key={i} className={r.inicial ? "lm-rowInitial" : ""}>
                        <td className="mono">{r.fecha}</td>
                        <td>{r.glosa}</td>
                        <td className="mono">{r.doc}</td>
                        <td className="r mono">$ {fmtCL(r.debe)}</td>
                        <td className="r mono">$ {fmtCL(r.haber)}</td>
                        <td className="r mono">$ {fmtCL(r.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CTA preview contextual */}
          {salida === "Vista previa" && (
            <div className="lm-previewCta">
              <button
                className="lm-btn lm-btnGhost"
                type="button"
                onClick={() => {
                  if (!canGenerate) return;
                  setLastRun(payload);
                  generatePreview();
                }}
                disabled={!canGenerate}
              >
                {previewBtnLabel}
              </button>
            </div>
          )}
        </div>

        {lastRun && (
          <div className="lm-footNote">
            Última generación: <span className="mono">{lastRun.cuenta}</span> ·{" "}
            <span className="mono">{lastRun.periodo.label}</span> · Salida:{" "}
            <strong>{lastRun.salida}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

