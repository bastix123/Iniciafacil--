"use client";

import { useEffect, useMemo } from "react";
import "./documento-detalle-modal.css";

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function moneyCL(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CL");
}

export default function DocumentoDetalleModal({
  open,
  onClose,
  data,
  loading = false,
  title = "Detalle del documento",
}) {
  const d = data || {};

  const total = useMemo(() => {
    if (d.montoTotal !== undefined && d.montoTotal !== null) return Number(d.montoTotal);

    const neto = Number(d.montoNeto ?? 0);
    const ivaRec = Number(d.ivaRecuperable ?? 0);
    const ivaNoRec = Number(d.ivaNoRecuperable ?? 0);
    const exento = Number(d.montoExento ?? 0);
    const otros = Number(d.otrosImpuestos ?? 0);
    return neto + ivaRec + ivaNoRec + exento + otros;
  }, [d]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ddm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="ddm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ddm-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ddm-head">
          <div className="ddm-titleWrap">
            <div id="ddm-title" className="ddm-title">
              {title}
            </div>
            <div className="ddm-subtitle">
              {safe(d.tipoDocumento)} {d.folio ? `• Folio ${safe(d.folio)}` : ""}
              {d.modo ? ` • ${String(d.modo).toUpperCase()}` : ""}
              {loading ? <span className="ddm-loading"> • Cargando…</span> : null}
            </div>
          </div>

          <button className="ddm-x" type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="ddm-body">
          <div className="ddm-grid">
            {/* Col 1 */}
            <div className="ddm-stack">
              <div className="ddm-card">
                <div className="ddm-cardHead">Proveedor</div>
                <div className="ddm-table">
                  <div className="ddm-row">
                    <div className="ddm-k">Razón social</div>
                    <div className="ddm-v">{safe(d.razonSocial)}</div>
                  </div>
                  <div className="ddm-row">
                    <div className="ddm-k">RUT Proveedor</div>
                    <div className="ddm-v mono">{safe(d.rutProveedor)}</div>
                  </div>
                </div>
              </div>

              <div className="ddm-card">
                <div className="ddm-cardHead">Resumen del documento</div>
                <div className="ddm-table">
                  <div className="ddm-row">
                    <div className="ddm-k">Monto neto</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(d.montoNeto ?? 0)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">IVA recuperable</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(d.ivaRecuperable ?? 0)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">IVA no recuperable</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(d.ivaNoRecuperable ?? 0)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Monto exento</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(d.montoExento ?? 0)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Otros impuestos</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(d.otrosImpuestos ?? 0)}</div>
                  </div>

                  <div className="ddm-total">
                    <div className="ddm-k">Monto total</div>
                    <div className="ddm-v ddm-money mono">$ {moneyCL(total)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div className="ddm-stack">
              <div className="ddm-card">
                <div className="ddm-cardHead">Documento</div>
                <div className="ddm-table">
                  <div className="ddm-row">
                    <div className="ddm-k">Tipo compra</div>
                    <div className="ddm-v">{safe(d.tipoCompra)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Folio</div>
                    <div className="ddm-v mono">{safe(d.folio)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Fecha docto.</div>
                    <div className="ddm-v mono">{safe(d.fechaDocto)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Fecha recepción</div>
                    <div className="ddm-v mono">{safe(d.fechaRecepcion)}</div>
                  </div>

                  <div className="ddm-row">
                    <div className="ddm-k">Fecha acuse recibo</div>
                    <div className="ddm-v mono">{safe(d.fechaAcuseRecibo)}</div>
                  </div>
                </div>
              </div>

              <div className="ddm-card">
                <div className="ddm-cardHead">Detalle tributario avanzado</div>
                <div className="ddm-note">
                  {safe(d.detalleTributario || "Este doc no registra impuestos especiales")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ddm-foot">
          <button className="ddm-btn ddm-btnDanger" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}


