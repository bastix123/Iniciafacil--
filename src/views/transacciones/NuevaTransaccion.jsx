"use client";

import "./nueva-transaccion.css";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Select from "@radix-ui/react-select";

const MAX_LINEAS = 15;
const MIN_LINEAS = 2;

const TIPOS = [
  { value: "Ingreso", label: "Ingreso" },
  { value: "Egreso", label: "Egreso" },
  { value: "Traspaso", label: "Traspaso" },
];

const CUENTAS = [
  { value: "1101-01", label: "1101-01 - Caja" },
  { value: "1101-02", label: "1101-02 - Caja chica" },
];

const CENTROS = [
  { value: "CC-01", label: "CC-01 - Administración" },
  { value: "CC-02", label: "CC-02 - Operación" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toNumberSafe(v) {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s.replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function moneyInputNormalize(raw) {
  return String(raw ?? "").replace(/[^\d.,-]/g, "");
}

function buildReturnHrefFromQS(qs) {
  return qs ? `/transacciones?${qs}` : "/transacciones";
}

/* -----------------------------
   Radix Select (reutilizable)
   - OJO: Radix NO permite Select.Item con value=""
------------------------------ */
function RadixSelect({
  value,
  onValueChange,
  placeholder,
  items,
  ariaLabel,
  disabled,
  size = "md", // "md" | "sm"
}) {
  const triggerClass = `nt-selectTrigger ${size === "sm" ? "is-sm" : ""}`.trim();

  return (
    <Select.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className={triggerClass} aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="nt-selectIcon">▾</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="nt-selectContent" position="popper" sideOffset={8}>
          <Select.Viewport className="nt-selectViewport">
            {items.map((it) => (
              <Select.Item key={it.value} value={it.value} className="nt-selectItem">
                <Select.ItemText>{it.label}</Select.ItemText>
                <Select.ItemIndicator className="nt-selectCheck">✓</Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.Arrow className="nt-selectArrow" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export default function NuevaTransaccion() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnQS = searchParams?.toString() || "";
  const returnHref = buildReturnHrefFromQS(returnQS);

  const [tipo, setTipo] = useState("");
  const [emision, setEmision] = useState(todayISO());
  const [glosa, setGlosa] = useState("");
  const [repetirGlosa, setRepetirGlosa] = useState(false);

  const [detalle, setDetalle] = useState([
    { cuenta: "", centro: "", glosa: "", debe: "", haber: "" },
    { cuenta: "", centro: "", glosa: "", debe: "", haber: "" },
  ]);

  const [pdfFile, setPdfFile] = useState(null);

  // Banner tipo “Resultado”
  const [msg, setMsg] = useState({ type: "", title: "", text: "" }); // type: "ok" | "warn" | "error" | "info" | ""
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const debe = detalle.reduce((acc, r) => acc + toNumberSafe(r.debe), 0);
    const haber = detalle.reduce((acc, r) => acc + toNumberSafe(r.haber), 0);
    const diff = debe - haber;
    return { debe, haber, diff };
  }, [detalle]);

  const setBanner = (type, title, text) => setMsg({ type, title, text });
  const clearBanner = () => setMsg({ type: "", title: "", text: "" });

  const isRowUsed = (r) => {
    const debe = toNumberSafe(r.debe);
    const haber = toNumberSafe(r.haber);
    return Boolean(r.cuenta) || Boolean(r.centro) || Boolean(r.glosa?.trim()) || debe > 0 || haber > 0;
  };

  const rowSideState = (r) => {
    const debe = toNumberSafe(r.debe);
    const haber = toNumberSafe(r.haber);
    return { hasDebe: debe > 0, hasHaber: haber > 0 };
  };

  const onChangeRow = (idx, patch) => {
    clearBanner();

    setDetalle((prev) => {
      const next = [...prev];
      const current = next[idx];
      let updated = { ...current, ...patch };

      if (repetirGlosa && patch.glosa !== undefined) {
        updated = { ...updated, glosa: patch.glosa };
      }

      // Debe XOR Haber
      if (patch.debe !== undefined) {
        const d = toNumberSafe(patch.debe);
        updated.debe = moneyInputNormalize(patch.debe);
        if (d > 0) updated.haber = "0";
      }
      if (patch.haber !== undefined) {
        const h = toNumberSafe(patch.haber);
        updated.haber = moneyInputNormalize(patch.haber);
        if (h > 0) updated.debe = "0";
      }

      next[idx] = updated;
      return next;
    });
  };

  const addRow = () => {
    clearBanner();
    setDetalle((prev) => {
      if (prev.length >= MAX_LINEAS) {
        setBanner("warn", "Resultado", `Máximo permitido: ${MAX_LINEAS} líneas.`);
        return prev;
      }
      return [...prev, { cuenta: "", centro: "", glosa: repetirGlosa ? glosa : "", debe: "", haber: "" }];
    });
  };

  const removeRow = (idx) => {
    clearBanner();
    setDetalle((prev) => {
      if (prev.length <= MIN_LINEAS) {
        setBanner("warn", "Resultado", `Debes mantener al menos ${MIN_LINEAS} líneas.`);
        return prev;
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onSetMainGlosa = (v) => {
    clearBanner();
    setGlosa(v);
    if (repetirGlosa) {
      setDetalle((prev) => prev.map((r) => ({ ...r, glosa: v })));
    }
  };

  const onToggleRepetir = (checked) => {
    clearBanner();
    setRepetirGlosa(checked);
    if (checked) {
      setDetalle((prev) => prev.map((r) => ({ ...r, glosa })));
    }
  };

  const onPickPdf = (file) => {
    clearBanner();

    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setBanner("error", "Resultado", "Solo se permite PDF.");
      return;
    }
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      setBanner("error", "Resultado", "El PDF excede 4MB.");
      return;
    }
    setPdfFile(file);
  };

  const onVolver = () => router.push(returnHref);

  const validateBeforeSave = ({ forGeneratedPdf }) => {
    // Header
    if (!tipo) return { ok: false, type: "error", msg: "Selecciona un tipo de comprobante." };
    if (!emision) return { ok: false, type: "error", msg: "Selecciona una fecha de emisión." };

    // ✅ Glosa principal obligatoria (profesional / estándar)
    if (!String(glosa || "").trim()) return { ok: false, type: "error", msg: "La glosa principal es obligatoria." };

    const used = detalle.map((r, i) => ({ r, i })).filter(({ r }) => isRowUsed(r));

    if (used.length === 0) return { ok: false, type: "error", msg: "Agrega al menos 1 línea en el detalle (Cuenta + Debe/Haber)." };
    if (used.length > MAX_LINEAS) return { ok: false, type: "warn", msg: `Máximo permitido: ${MAX_LINEAS} líneas.` };

    for (const { r, i } of used) {
      if (!r.cuenta) return { ok: false, type: "error", msg: `Línea ${i + 1}: selecciona una Cuenta (imputable).` };
      if (!r.centro) return { ok: false, type: "error", msg: `Línea ${i + 1}: selecciona un Centro de Costo.` };

      const d = toNumberSafe(r.debe);
      const h = toNumberSafe(r.haber);

      if (d <= 0 && h <= 0) return { ok: false, type: "error", msg: `Línea ${i + 1}: ingresa Debe o Haber (mayor a 0).` };
      if (d > 0 && h > 0) return { ok: false, type: "error", msg: `Línea ${i + 1}: no puedes tener Debe y Haber a la vez.` };

      // ✅ Para generar PDF: “todo lleno” (incluye glosa por línea)
      if (forGeneratedPdf && !String(r.glosa || "").trim()) {
        return { ok: false, type: "error", msg: `Línea ${i + 1}: la glosa de la línea es obligatoria para generar el PDF.` };
      }
    }

    if (totals.diff !== 0) return { ok: false, type: "error", msg: "La transacción no está balanceada: Debe y Haber deben ser iguales." };

    return { ok: true, type: "", msg: "" };
  };

  const buildPayload = () => {
    const used = detalle.filter((r) => isRowUsed(r));

    return {
      tipo,
      emision, // YYYY-MM-DD
      glosa: glosa.trim(),
      detalle: used.map((r) => ({
        accountId: r.cuenta, // accountId = código (1101-01)
        centroCostoId: r.centro,
        glosa: (r.glosa ?? "").trim(),
        debe: toNumberSafe(r.debe),
        haber: toNumberSafe(r.haber),
      })),
      // pdfFile (adjunto) -> multipart/form-data cuando lo integren en backend
    };
  };

  const onGuardar = async () => {
    clearBanner();
    const v = validateBeforeSave({ forGeneratedPdf: false });
    if (!v.ok) return setBanner(v.type || "error", "Resultado", v.msg);

    setSubmitting(true);
    try {
      const payload = buildPayload();
      console.log("POST /transacciones payload:", payload, "pdfAdjunto:", pdfFile);
      setBanner("ok", "Resultado", "Listo. (Mock) Transacción preparada para enviarse a la API.");
    } finally {
      setSubmitting(false);
    }
  };

  const onGuardarContinuar = async () => {
    await onGuardar();
  };

  const onGuardarVerPdf = async () => {
    clearBanner();

    // ✅ Opción B: generar PDF del comprobante => requiere “todo completo”
    const v = validateBeforeSave({ forGeneratedPdf: true });
    if (!v.ok) return setBanner(v.type || "error", "Resultado", v.msg);

    setSubmitting(true);
    try {
      const payload = buildPayload();

      // Flujo típico backend:
      // 1) POST /transacciones  -> retorna txId
      // 2) (opcional) POST /transacciones/{txId}/adjuntos  (si pdfFile existe)
      // 3) GET  /transacciones/{txId}/pdf  (pdf generado del comprobante)
      console.log("Guardar y ver PDF (generado) payload:", payload, "pdfAdjunto(opcional):", pdfFile);

      setBanner("ok", "Resultado", "Listo. (Mock) Flujo preparado: guardar + generar/ver PDF del comprobante (requiere backend).");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nt-page">
      <div className="nt-head">
        <div>
          <h1 className="nt-title">Nueva transacción</h1>
          <p className="nt-subtitle">Ingreso / Egreso / Traspaso</p>
        </div>

        <div className="nt-headActions">
          <button type="button" className="nt-btn nt-btn-ghost" onClick={onVolver} disabled={submitting}>
            Volver
          </button>
        </div>
      </div>

      {msg?.text && (
        <div className={`nt-alert ${msg.type ? `nt-alert--${msg.type}` : ""}`} role="alert" aria-live="polite">
          <div className="nt-alertIcon" aria-hidden="true">
            !
          </div>

          <div className="nt-alertBody">
            <div className="nt-alertTitle">{msg.title || "Resultado"}</div>
            <div className="nt-alertSub">{msg.text}</div>
          </div>

          <div className="nt-alertActions">
            <button type="button" className="nt-alertClose" onClick={clearBanner} aria-label="Cerrar mensaje">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="nt-panel">
        <div className="nt-section">
          <div className="nt-sectionTitle">INGRESO DE TRANSACCIÓN</div>

          <div className="nt-grid">
            <div className="nt-field">
              <label className="nt-label">Tipo de Comprobante</label>
              <RadixSelect
                value={tipo}
                onValueChange={setTipo}
                placeholder="Seleccione una opción..."
                items={TIPOS}
                ariaLabel="Tipo de Comprobante"
                disabled={submitting}
              />
            </div>

            <div className="nt-field">
              <label className="nt-label">Emisión</label>
              <input className="nt-input" type="date" value={emision} onChange={(e) => setEmision(e.target.value)} disabled={submitting} />
            </div>

            <div className="nt-field nt-field-wide">
              <label className="nt-label">Glosa</label>
              <input
                className="nt-input"
                value={glosa}
                onChange={(e) => onSetMainGlosa(e.target.value)}
                placeholder="Descripción / glosa..."
                disabled={submitting}
              />
            </div>

            <div className="nt-field nt-field-check">
              <label className="nt-label">Repetir Glosa</label>
              <label className="nt-check">
                <input type="checkbox" checked={repetirGlosa} onChange={(e) => onToggleRepetir(e.target.checked)} disabled={submitting} />
                <span>Aplicar glosa a detalle</span>
              </label>
            </div>
          </div>
        </div>

        <div className="nt-section">
          <div className="nt-sectionTitle nt-sectionTitleRow">
            <span>DETALLE</span>

            <div className="nt-rowMeta">
              <span className="nt-metaText">
                Líneas: <strong>{detalle.length}</strong> / {MAX_LINEAS}
              </span>

              <button type="button" className="nt-btn nt-btn-primary nt-btn-sm" onClick={addRow} disabled={submitting || detalle.length >= MAX_LINEAS}>
                + Añadir línea
              </button>
            </div>
          </div>

          <div className="nt-tableWrap">
            <table className="nt-table">
              <thead>
                <tr>
                  <th className="col-cuenta">Cuenta</th>
                  <th className="col-cc">Centro de Costo</th>
                  <th className="col-glosa">Glosa</th>
                  <th className="col-num">Debe</th>
                  <th className="col-num">Haber</th>
                  <th className="col-actions" aria-label="acciones" />
                </tr>
              </thead>

              <tbody>
                {detalle.map((r, idx) => {
                  const { hasDebe, hasHaber } = rowSideState(r);
                  const disableDebe = hasHaber;
                  const disableHaber = hasDebe;

                  return (
                    <tr key={idx}>
                      <td>
                        <RadixSelect
                          value={r.cuenta}
                          onValueChange={(v) => onChangeRow(idx, { cuenta: v })}
                          placeholder="Seleccione..."
                          items={CUENTAS}
                          ariaLabel={`Cuenta línea ${idx + 1}`}
                          disabled={submitting}
                          size="sm"
                        />
                      </td>

                      <td>
                        <RadixSelect
                          value={r.centro}
                          onValueChange={(v) => onChangeRow(idx, { centro: v })}
                          placeholder="Seleccione..."
                          items={CENTROS}
                          ariaLabel={`Centro de costo línea ${idx + 1}`}
                          disabled={submitting}
                          size="sm"
                        />
                      </td>

                      <td>
                        <input
                          className="nt-input nt-input-sm"
                          value={r.glosa}
                          onChange={(e) => onChangeRow(idx, { glosa: e.target.value })}
                          placeholder="Glosa detalle..."
                          disabled={submitting}
                        />
                      </td>

                      <td>
                        <input
                          className={`nt-input nt-input-sm nt-right ${disableDebe ? "is-disabled" : ""}`}
                          value={r.debe}
                          onChange={(e) => onChangeRow(idx, { debe: e.target.value })}
                          placeholder="0"
                          inputMode="decimal"
                          disabled={submitting || disableDebe}
                        />
                      </td>

                      <td>
                        <input
                          className={`nt-input nt-input-sm nt-right ${disableHaber ? "is-disabled" : ""}`}
                          value={disableHaber ? "0" : r.haber}
                          onChange={(e) => onChangeRow(idx, { haber: e.target.value })}
                          placeholder="0"
                          inputMode="decimal"
                          disabled={submitting || disableHaber}
                        />
                      </td>

                      <td className="nt-actionsTd">
                        <button
                          type="button"
                          className="nt-iconBtn"
                          onClick={() => removeRow(idx)}
                          aria-label="Eliminar línea"
                          disabled={submitting || detalle.length <= MIN_LINEAS}
                          title={detalle.length <= MIN_LINEAS ? `Mínimo ${MIN_LINEAS} líneas` : "Eliminar línea"}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr className="nt-totals">
                  <td colSpan={3} className="nt-totalsLabel">
                    TOTALES
                  </td>
                  <td className="nt-right nt-mono">{totals.debe.toLocaleString("es-CL")}</td>
                  <td className="nt-right nt-mono">{totals.haber.toLocaleString("es-CL")}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="nt-balanceHint" aria-live="polite">
            {totals.diff === 0 ? <span className="ok">Balanceado ✓</span> : <span className="warn">Descuadre: {totals.diff.toLocaleString("es-CL")}</span>}
          </div>
        </div>

        <div className="nt-section">
          <div className="nt-sectionTitle">ADJUNTAR PDF (opcional)</div>

          <div className="nt-uploadRow">
            <div className="nt-upload">
              <input className="nt-file" type="file" accept="application/pdf" onChange={(e) => onPickPdf(e.target.files?.[0] || null)} disabled={submitting} />
              <div className="nt-fileMeta">
                {pdfFile ? (
                  <>
                    <div className="nt-fileName">{pdfFile.name}</div>
                    <div className="nt-fileSub">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </>
                ) : (
                  <>
                    <div className="nt-fileName">Sin archivos seleccionados</div>
                    <div className="nt-fileSub">Solo PDF, máximo 4MB</div>
                  </>
                )}
              </div>
            </div>

            <div className="nt-note">Nota: El tamaño máximo permitido para subir un archivo PDF es de 4MB.</div>
          </div>
        </div>

        <div className="nt-footer">
          <button type="button" className="nt-btn nt-btn-ghost" onClick={onVolver} disabled={submitting}>
            VOLVER
          </button>

          <div className="nt-footerRight">
            <button type="button" className="nt-btn nt-btn-primary" onClick={onGuardar} disabled={submitting}>
              {submitting ? "GUARDANDO..." : "GUARDAR"}
            </button>
            <button type="button" className="nt-btn nt-btn-primary" onClick={onGuardarContinuar} disabled={submitting}>
              GUARDAR Y CONTINUAR
            </button>
            <button type="button" className="nt-btn nt-btn-ghost" onClick={onGuardarVerPdf} disabled={submitting}>
              GUARDAR Y VER PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



