"use client";

import "./libro-mayor.css";
import { useMemo, useState } from "react";
import * as Select from "@radix-ui/react-select";
import PeriodPicker from "@/components/ui/PeriodPicker";
import { usePeriodo } from "@/context/PeriodoContext";

/* -----------------------------
   Tiny icons (sin dependencias)
------------------------------ */
function ICalendar(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M8 2v3M16 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M3 9h18M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ILayers(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2 2 7l10 5 10-5-10-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M2 17l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IBook(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 4h11a3 3 0 0 1 3 3v14H7a3 3 0 0 0-3 3V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 21H7a3 3 0 0 0-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 4v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IDownload(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 21h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IChevronDown(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ICheck(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IX(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ISearch(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -----------------------------
   Helpers
------------------------------ */

function fmtCL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CL");
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function monthToRange(yyyyMm) {
  if (!yyyyMm || !yyyyMm.includes("-")) return { desde: "", hasta: "", label: "—" };
  const [yStr, mStr] = yyyyMm.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return { desde: "", hasta: "", label: "—" };

  const lastDay = new Date(y, m, 0).getDate();
  const desde = `${y}-${pad2(m)}-01`;
  const hasta = `${y}-${pad2(m)}-${pad2(lastDay)}`;

  const d = new Date(y, m - 1, 1);
  const label = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(d);
  return { desde, hasta, label };
}

/* -----------------------------
   Demo cuentas (luego API)
------------------------------ */

const CUENTAS = [
  { codigo: "1101-01", nombre: "Caja", imputable: true },
  { codigo: "1101-02", nombre: "Caja chica", imputable: true },
  { codigo: "1102-01", nombre: "Banco Estado", imputable: true },
  { codigo: "2101-01", nombre: "Proveedores", imputable: true },
  { codigo: "4101-01", nombre: "Costo de explotación", imputable: true },
];

function demoMayor({ desde, hasta, cuenta }) {
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

  return { cuenta, desde, hasta, saldoInicial, rows, totalDebe, totalHaber, saldoFinal: saldo };
}

function mapApiErrorToBanner(err) {
  if (!err) return { type: "error", text: "Ocurrió un error inesperado." };
  if (typeof err === "string") return { type: "error", text: err };

  if (err.name === "TypeError" && String(err.message || "").toLowerCase().includes("fetch")) {
    return { type: "error", text: "No se pudo conectar al servidor. Revisa tu conexión o el backend." };
  }

  if (err.status) {
    if (err.status === 400) return { type: "error", text: err.message || "Solicitud inválida (400). Revisa filtros y período." };
    if (err.status === 401) return { type: "error", text: "Sesión expirada o no autorizada (401)." };
    if (err.status === 403) return { type: "error", text: "No tienes permisos para generar/exportar (403)." };
    if (err.status === 404) return { type: "error", text: "Recurso no encontrado (404)." };
    if (err.status === 409) return { type: "error", text: err.message || "Conflicto (409). Posible período cerrado u otro bloqueo." };
    if (err.status >= 500) return { type: "error", text: "Error interno del servidor. Intenta nuevamente." };
  }

  return { type: "error", text: err.message || "Ocurrió un error inesperado." };
}

/* -----------------------------
   Radix Select (Libro Mayor)
------------------------------ */

function LmRadixSelect({ value, onValueChange, placeholder, items, ariaLabel, disabled }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className="lm-selectTrigger" aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="lm-selectIcon">
          <IChevronDown />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="lm-selectContent" position="popper" sideOffset={8} align="start">
          <Select.Viewport className="lm-selectViewport">
            {items.map((it) => (
              <Select.Item key={it.value} value={it.value} className="lm-selectItem">
                <Select.ItemText>{it.label}</Select.ItemText>
                <Select.ItemIndicator className="lm-selectCheck">
                  <ICheck />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.Arrow className="lm-selectArrow" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/* -----------------------------
   Component
------------------------------ */

export default function LibroMayor() {
  const { periodo: periodoGlobal, setPeriodo } = usePeriodo(); // "YYYY-MM"

  const [modo, setModo] = useState("Por cuenta"); // "Por cuenta" | "Completo"
  const [soloVigentes, setSoloVigentes] = useState(true);
  const [mostrarDetalle, setMostrarDetalle] = useState(true);

  const [qCuenta, setQCuenta] = useState("");
  const [cuenta, setCuenta] = useState(CUENTAS[0]?.codigo ?? "");

  const [salida, setSalida] = useState("Vista previa"); // "Vista previa" | "PDF" | "Excel"

  const [preview, setPreview] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const setBanner = (type, text) => setMsg({ type, text });
  const clearBanner = () => setMsg({ type: "", text: "" });

  const periodo = useMemo(() => monthToRange(periodoGlobal), [periodoGlobal]);

  const cuentaObj = useMemo(() => CUENTAS.find((c) => c.codigo === cuenta) ?? null, [cuenta]);

  const cuentasFiltradas = useMemo(() => {
    const qq = qCuenta.trim().toLowerCase();
    if (!qq) return CUENTAS;
    return CUENTAS.filter(
      (c) => c.codigo.toLowerCase().includes(qq) || c.nombre.toLowerCase().includes(qq)
    );
  }, [qCuenta]);

  const cuentaItems = useMemo(() => {
    return cuentasFiltradas
      .filter((c) => c.imputable) // por seguridad: solo imputables
      .map((c) => ({ value: c.codigo, label: `${c.codigo} - ${c.nombre}` }));
  }, [cuentasFiltradas]);

  // payload final API-ready
  const payload = useMemo(() => {
    const cuentaLabel = cuentaObj ? `${cuentaObj.codigo} - ${cuentaObj.nombre}` : cuenta;

    return {
      periodo: {
        value: periodoGlobal || null,
        desde: periodo.desde,
        hasta: periodo.hasta,
        label: periodo.label,
      },
      modo, // "Por cuenta" | "Completo"
      cuenta: modo === "Por cuenta" ? { codigo: cuenta, label: cuentaLabel } : null,
      filtros: {
        soloVigentes: Boolean(soloVigentes),
        mostrarDetalle: Boolean(mostrarDetalle),
      },
      salida, // "Vista previa" | "PDF" | "Excel"
    };
  }, [periodoGlobal, periodo, modo, cuentaObj, cuenta, soloVigentes, mostrarDetalle, salida]);

  const validateBeforeGenerate = () => {
    if (!periodoGlobal || !periodo.desde || !periodo.hasta) {
      return { ok: false, type: "error", msg: "Selecciona un período válido (Mes/Año)." };
    }

    if (!["Por cuenta", "Completo"].includes(modo)) {
      return { ok: false, type: "error", msg: "Selecciona un modo válido (Por cuenta / Completo)." };
    }

    if (!["Vista previa", "PDF", "Excel"].includes(salida)) {
      return { ok: false, type: "error", msg: "Selecciona un tipo de salida válido (Vista previa / PDF / Excel)." };
    }

    if (salida === "Vista previa" && modo !== "Por cuenta") {
      return { ok: false, type: "warn", msg: "La vista previa es solo por cuenta. Cambia a “Por cuenta” o exporta en “Completo”." };
    }

    if (modo === "Por cuenta") {
      if (!String(cuenta || "").trim()) return { ok: false, type: "error", msg: "Selecciona una cuenta imputable." };
      if (!cuentaObj?.imputable) return { ok: false, type: "error", msg: "La cuenta seleccionada debe ser imputable." };
    }

    if (modo === "Completo" && salida === "Vista previa") {
      return { ok: false, type: "warn", msg: "En “Completo” no hay vista previa. Exporta a PDF/Excel." };
    }

    return { ok: true, type: "", msg: "" };
  };

  const canGenerate = useMemo(() => {
    if (!periodoGlobal || !periodo.desde || !periodo.hasta) return false;
    if (modo === "Por cuenta" && !cuenta) return false;
    if (modo === "Completo" && salida === "Vista previa") return false;
    return true;
  }, [periodoGlobal, periodo, modo, cuenta, salida]);

  const generatePreviewMock = () => {
    const cuentaLabel = payload.cuenta?.label || "—";
    const result = demoMayor({
      desde: payload.periodo.desde,
      hasta: payload.periodo.hasta,
      cuenta: cuentaLabel,
    });
    setPreview(result);
  };

  const onGenerate = async () => {
    clearBanner();

    const v = validateBeforeGenerate();
    if (!v.ok) {
      setBanner(v.type || "error", v.msg);
      return;
    }

    setSubmitting(true);
    try {
      setLastRun(payload);

      if (payload.salida === "Vista previa") {
        // FUTURO API:
        // POST /api/libro-mayor/preview  (payload)
        generatePreviewMock();
        setBanner("ok", "Vista previa generada (mock).");
        return;
      }

      // Export (PDF/Excel) Por cuenta o Completo
      setPreview(null);

      // FUTURO API:
      // POST /api/libro-mayor/export (payload) -> { downloadUrl }
      setBanner(
        "info",
        `Exportación preparada (mock): ${payload.salida} · ${
          payload.modo === "Completo" ? "Libro mayor completo" : "Por cuenta"
        }.`
      );
    } catch (err) {
      const b = mapApiErrorToBanner(err);
      setBanner(b.type, b.text);
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = () => {
    clearBanner();
    setModo("Por cuenta");
    setSoloVigentes(true);
    setMostrarDetalle(true);
    setQCuenta("");
    setCuenta(CUENTAS[0]?.codigo ?? "");
    setSalida("Vista previa");
    setPreview(null);
    setLastRun(null);
  };

  const status = useMemo(() => {
    if (!periodoGlobal) return { kind: "warn", text: "Selecciona un mes/año." };

    if (modo === "Completo") {
      if (salida === "Vista previa") return { kind: "warn", text: "En modo Completo, exporta a PDF/Excel." };
      return { kind: "ok", text: "Listo para exportar libro mayor completo." };
    }

    if (!cuenta) return { kind: "warn", text: "Selecciona una cuenta." };
    return { kind: "ok", text: "Listo para generar." };
  }, [periodoGlobal, modo, salida, cuenta]);

  const previewBtnLabel = preview ? "Actualizar preview" : "Generar vista previa";

  const showCuentaCard = modo === "Por cuenta";
  const showPreviewCta = salida === "Vista previa" && modo === "Por cuenta";

  return (
    <div className="lm-page">
      <div className="lm-header">
        <div>
          <h1 className="lm-title">Libro mayor</h1>
          <p className="lm-subtitle">
            Vista previa por cuenta. Exportación PDF/Excel por cuenta o libro mayor completo (todas las cuentas imputables).
          </p>
        </div>
      </div>

      <div className="lm-panel">
        {/* Top row */}
        <div className="lm-panelTop">
          <div className="lm-summary">
            <div className="lm-summaryItem">
              <span className="k">
                <span className="lm-kIcon"><ICalendar /></span> Período
              </span>
              <span className="v">{periodo.label}</span>
            </div>

            <div className="lm-summaryItem">
              <span className="k">
                <span className="lm-kIcon"><ILayers /></span> Modo
              </span>
              <span className="v">{modo}</span>
            </div>

            <div className="lm-summaryItem">
              <span className="k">
                <span className="lm-kIcon"><IBook /></span> Cuenta
              </span>
              <span className="v mono">
                {modo === "Por cuenta" ? (cuentaObj ? `${cuentaObj.codigo} - ${cuentaObj.nombre}` : "—") : "—"}
              </span>
            </div>

            <div className="lm-summaryItem">
              <span className="k">
                <span className="lm-kIcon"><IDownload /></span> Salida
              </span>
              <span className="v">{salida}</span>
            </div>
          </div>

          <div className="lm-actionsTop">
            <button className="lm-btn lm-btnGhost" type="button" onClick={onReset} disabled={submitting}>
              <span className="lm-btnIcon"><IX /></span>
              Limpiar
            </button>

            <button
              className="lm-btn lm-btnPrimary"
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || submitting}
              title={!canGenerate ? "Completa filtros requeridos" : "Generar libro mayor"}
            >
              <span className="lm-btnIcon"><IDownload /></span>
              {submitting ? "Generando..." : "Generar"}
            </button>
          </div>

          {/* Estado UX */}
          <div className={`lm-status ${status.kind}`}>
            <span className="lm-statusDot" aria-hidden="true" />
            <span className="lm-statusText">{status.text}</span>
          </div>
        </div>

        {/* Banner */}
        {msg?.text && (
          <div className={`lm-banner lm-banner-${msg.type || "info"}`} role="alert" aria-live="polite">
            <div className="lm-bannerText">{msg.text}</div>
            <button type="button" className="lm-bannerClose" onClick={clearBanner} disabled={submitting} aria-label="Cerrar mensaje">
              <IX />
            </button>
          </div>
        )}

        {/* Cards */}
        <div className="lm-grid">
          {/* Período */}
          <section className="lm-card lm-cardPrimary">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Período</span>
            </div>

            <div className="lm-field">
              <label className="lm-label">Mes/Año (global)</label>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <PeriodPicker value={periodoGlobal} onChange={setPeriodo} label="Período" />
              </div>

              <div className="lm-help">
                Se generará para:{" "}
                <span className="mono">
                  {periodo.desde} → {periodo.hasta}
                </span>
              </div>
            </div>
          </section>

          {/* Modo */}
          <section className="lm-card">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Modo</span>
            </div>

            <div className="lm-field">
              <label className="lm-label">Qué quieres generar</label>

              <div className="lm-seg lm-segWide" role="radiogroup" aria-label="Modo de generación">
                {["Por cuenta", "Completo"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`lm-segBtn ${modo === opt ? "active" : ""}`}
                    onClick={() => {
                      clearBanner();
                      setModo(opt);
                    }}
                    aria-checked={modo === opt}
                    role="radio"
                    disabled={submitting}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="lm-help">
                Sugerencia: usa <strong>Por cuenta</strong> para vista previa. Usa <strong>Completo</strong> para exportar el libro mayor total.
              </div>
            </div>
          </section>

          {/* Cuenta (solo Por cuenta) */}
          {showCuentaCard && (
            <section className="lm-card">
              <div className="lm-cardHead">
                <span className="lm-cardTitle">Cuenta</span>
                <span className="lm-badge">Imputable</span>
              </div>

              <div className="lm-field">
                <label className="lm-label">Buscar cuenta</label>
                <div className="lm-search">
                  <span className="lm-searchIcon" aria-hidden="true">
                    <ISearch />
                  </span>
                  <input
                    className="lm-searchInput"
                    value={qCuenta}
                    onChange={(e) => setQCuenta(e.target.value)}
                    placeholder="Código o nombre..."
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="lm-field">
                <label className="lm-label">Seleccionar</label>

                {/* ✅ RADIX SELECT */}
                <LmRadixSelect
                  value={cuenta}
                  onValueChange={(v) => {
                    clearBanner();
                    setCuenta(v);
                  }}
                  placeholder="Selecciona cuenta"
                  items={cuentaItems}
                  ariaLabel="Cuenta"
                  disabled={submitting || cuentaItems.length === 0}
                />

                <div className="lm-help">
                  Selecciona una cuenta imputable para generar vista previa o exportar por cuenta.
                </div>
              </div>
            </section>
          )}

          {/* Opciones */}
          <section className="lm-card">
            <div className="lm-cardHead">
              <span className="lm-cardTitle">Opciones</span>
            </div>

            <label className="lm-check">
              <input
                type="checkbox"
                checked={soloVigentes}
                onChange={(e) => {
                  clearBanner();
                  setSoloVigentes(e.target.checked);
                }}
                disabled={submitting}
              />
              <span>Solo vigentes</span>
            </label>

            <label className="lm-check">
              <input
                type="checkbox"
                checked={mostrarDetalle}
                onChange={(e) => {
                  clearBanner();
                  setMostrarDetalle(e.target.checked);
                }}
                disabled={submitting}
              />
              <span>Mostrar detalle</span>
            </label>

            <div className="lm-help">“Mostrar detalle” incluye cada movimiento individual (fecha, glosa, documento).</div>
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
                    onClick={() => {
                      clearBanner();
                      setSalida(opt);
                    }}
                    aria-checked={salida === opt}
                    role="radio"
                    disabled={submitting}
                    title={modo === "Completo" && opt === "Vista previa" ? "En modo Completo exporta a PDF/Excel" : ""}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="lm-help">Usa la vista previa para validar una cuenta antes de exportar.</div>
            </div>
          </section>
        </div>

        <div className="lm-preview">
          {!preview ? (
            <div className="lm-empty">
              <div className="lm-emptyIcon">
                <IBook />
              </div>
              <div className="lm-emptyText">
                Sin resultados aún. Configura filtros y presiona <strong>Generar</strong>.
              </div>
            </div>
          ) : (
            <>
              <div className="lm-ledgerHeader">
                <div className="lm-ledgerTitle">📘 Libro mayor</div>

                <div className="lm-ledgerMeta">
                  <span>
                    <strong>Cuenta:</strong> {preview.cuenta}
                  </span>
                  <span>
                    <strong>Período:</strong> {preview.desde} → {preview.hasta}
                  </span>
                  <span>
                    <strong>Saldo inicial:</strong> $ {fmtCL(preview.saldoInicial)}
                  </span>
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
          {showPreviewCta && (
            <div className="lm-previewCta">
              <button
                className="lm-btn lm-btnGhost"
                type="button"
                onClick={() => {
                  if (!canGenerate || submitting) return;
                  clearBanner();
                  setLastRun(payload);
                  generatePreviewMock();
                  setBanner("ok", "Vista previa actualizada (mock).");
                }}
                disabled={!canGenerate || submitting}
              >
                {previewBtnLabel}
              </button>
            </div>
          )}
        </div>

        {lastRun && (
          <div className="lm-footNote">
            Última generación:{" "}
            <span className="mono">
              {lastRun.modo === "Completo" ? "Libro mayor completo" : lastRun.cuenta?.label || "—"}
            </span>{" "}
            · <span className="mono">{lastRun.periodo.label}</span> · Salida: <strong>{lastRun.salida}</strong>
          </div>
        )}
      </div>
    </div>
  );
}