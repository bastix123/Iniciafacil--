"use client";

import "./nueva-transaccion.css";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "", label: "Seleccione una opción..." },
  { value: "Ingreso", label: "Ingreso" },
  { value: "Egreso", label: "Egreso" },
  { value: "Traspaso", label: "Traspaso" },
];

const CUENTAS = [
  { value: "", label: "Seleccione..." },
  { value: "1101", label: "1101 - Caja" },
  { value: "1102", label: "1102 - Banco" },
  { value: "4101", label: "4101 - Ingresos" },
];

const CENTROS = [
  { value: "", label: "Seleccione..." },
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
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function NuevaTransaccion() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [emision, setEmision] = useState(todayISO());
  const [glosa, setGlosa] = useState("");
  const [repetirGlosa, setRepetirGlosa] = useState(false);

  const [detalle, setDetalle] = useState([
    { cuenta: "", centro: "", glosa: "", debe: "", haber: "" },
    { cuenta: "", centro: "", glosa: "", debe: "", haber: "" },
  ]);

  const [pdfFile, setPdfFile] = useState(null);

  const totals = useMemo(() => {
    const debe = detalle.reduce((acc, r) => acc + toNumberSafe(r.debe), 0);
    const haber = detalle.reduce((acc, r) => acc + toNumberSafe(r.haber), 0);
    return { debe, haber, diff: debe - haber };
  }, [detalle]);

  const onChangeRow = (idx, patch) => {
    setDetalle((prev) => {
      const next = [...prev];
      const current = next[idx];

      let updated = { ...current, ...patch };

      if (repetirGlosa && patch.glosa !== undefined) {
        updated = { ...updated, glosa: patch.glosa };
      }

      next[idx] = updated;
      return next;
    });
  };

  const addRow = () => {
    setDetalle((prev) => [...prev, { cuenta: "", centro: "", glosa: "", debe: "", haber: "" }]);
  };

  const removeRow = (idx) => {
    setDetalle((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSetMainGlosa = (v) => {
    setGlosa(v);
    if (repetirGlosa) {
      setDetalle((prev) => prev.map((r) => ({ ...r, glosa: v })));
    }
  };

  const onToggleRepetir = (checked) => {
    setRepetirGlosa(checked);
    if (checked) {
      setDetalle((prev) => prev.map((r) => ({ ...r, glosa: glosa })));
    }
  };

  const onPickPdf = (file) => {
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Solo se permite PDF.");
      return;
    }
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("El PDF excede 4MB.");
      return;
    }
    setPdfFile(file);
  };

  const onVolver = () => router.push("/transacciones");

  const onGuardar = () => {
    // Aquí luego integras API (POST /transacciones)
    // Validaciones mínimas visuales:
    if (!tipo) return alert("Selecciona un tipo de comprobante.");

    alert("Guardado (mock). Aquí iría la integración con la API.");
  };

  const onGuardarContinuar = () => {
    onGuardar();
    // Luego podrías limpiar formulario para seguir ingresando
  };

  const onGuardarVerPdf = () => {
    alert("Luego: generar/ver PDF (depende de backend).");
  };

  return (
    <div className="nt-page">
      <div className="nt-head">
        <div>
          <h1 className="nt-title">Nueva transacción</h1>
          <p className="nt-subtitle">Ingreso / Egreso / Traspaso</p>
        </div>

        <div className="nt-headActions">
          <button type="button" className="nt-btn nt-btn-ghost" onClick={onVolver}>
            Volver
          </button>
        </div>
      </div>

      <div className="nt-panel">
        <div className="nt-section">
          <div className="nt-sectionTitle">INGRESO DE TRANSACCIÓN</div>

          <div className="nt-grid">
            <div className="nt-field">
              <label className="nt-label">Tipo de Comprobante</label>
              <select className="nt-input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="nt-field">
              <label className="nt-label">Emisión</label>
              <input className="nt-input" type="date" value={emision} onChange={(e) => setEmision(e.target.value)} />
            </div>

            <div className="nt-field nt-field-wide">
              <label className="nt-label">Glosa</label>
              <input className="nt-input" value={glosa} onChange={(e) => onSetMainGlosa(e.target.value)} placeholder="Descripción / glosa..." />
            </div>

            <div className="nt-field nt-field-check">
              <label className="nt-label">Repetir Glosa</label>
              <label className="nt-check">
                <input type="checkbox" checked={repetirGlosa} onChange={(e) => onToggleRepetir(e.target.checked)} />
                <span>Aplicar glosa a detalle</span>
              </label>
            </div>
          </div>
        </div>

        <div className="nt-section">
          <div className="nt-sectionTitle nt-sectionTitleRow">
            <span>DETALLE</span>
            <button type="button" className="nt-btn nt-btn-primary nt-btn-sm" onClick={addRow}>
              + Añadir línea
            </button>
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
                {detalle.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <select className="nt-input nt-input-sm" value={r.cuenta} onChange={(e) => onChangeRow(idx, { cuenta: e.target.value })}>
                        {CUENTAS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select className="nt-input nt-input-sm" value={r.centro} onChange={(e) => onChangeRow(idx, { centro: e.target.value })}>
                        {CENTROS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        className="nt-input nt-input-sm"
                        value={r.glosa}
                        onChange={(e) => onChangeRow(idx, { glosa: e.target.value })}
                        placeholder="Glosa detalle..."
                      />
                    </td>

                    <td>
                      <input
                        className="nt-input nt-input-sm nt-right"
                        value={r.debe}
                        onChange={(e) => onChangeRow(idx, { debe: e.target.value })}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </td>

                    <td>
                      <input
                        className="nt-input nt-input-sm nt-right"
                        value={r.haber}
                        onChange={(e) => onChangeRow(idx, { haber: e.target.value })}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </td>

                    <td className="nt-actionsTd">
                      <button type="button" className="nt-iconBtn" onClick={() => removeRow(idx)} aria-label="Eliminar línea">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}

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
            {totals.diff === 0 ? (
              <span className="ok">Balanceado ✓</span>
            ) : (
              <span className="warn">Descuadre: {totals.diff.toLocaleString("es-CL")}</span>
            )}
          </div>
        </div>

        <div className="nt-section">
          <div className="nt-sectionTitle">ADJUNTAR PDF</div>

          <div className="nt-uploadRow">
            <div className="nt-upload">
              <input
                className="nt-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => onPickPdf(e.target.files?.[0] || null)}
              />
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
          <button type="button" className="nt-btn nt-btn-ghost" onClick={onVolver}>
            VOLVER
          </button>

          <div className="nt-footerRight">
            <button type="button" className="nt-btn nt-btn-primary" onClick={onGuardar}>
              GUARDAR
            </button>
            <button type="button" className="nt-btn nt-btn-primary" onClick={onGuardarContinuar}>
              GUARDAR Y CONTINUAR
            </button>
            <button type="button" className="nt-btn nt-btn-ghost" onClick={onGuardarVerPdf}>
              GUARDAR Y VER PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
