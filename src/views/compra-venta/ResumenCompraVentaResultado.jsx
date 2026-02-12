"use client";

import "./resumen-compra-venta-resultado.css";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function monthLabel(ym) {
  if (!ym) return "—";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return String(ym);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${months[m - 1]} de ${y}`;
}

function toMMYYYY(ym) {
  if (!ym) return "";
  const [y, m] = String(ym).split("-");
  if (!y || !m) return "";
  return `${m}/${y}`;
}

function fmtCL(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CL");
}

// Mock simple (luego lo conectas a API)
function buildMock() {
  return [
    {
      tipoDocumento: "Factura Electrónica (33)",
      cantidad: 16,
      exento: 60242,
      neto: 3179726,
      iva: 0,
    },
    {
      tipoDocumento: "Factura no afecta o exenta electrónica (34)",
      cantidad: 2,
      exento: 317672,
      neto: 0,
      iva: 0,
    },
    {
      tipoDocumento: "Nota de crédito electrónica (61)",
      cantidad: 2,
      exento: 0,
      neto: 4933,
      iva: 0,
    },
  ];
}

export default function ResumenCompraVentaResultado() {
  const router = useRouter();
  const sp = useSearchParams();

  const periodo = sp.get("periodo") || "2025-12";

  const [modo, setModo] = useState("compra"); 
  const [tab, setTab] = useState("registros"); 
  const [page, setPage] = useState(1);

  const periodoLabel = useMemo(() => monthLabel(periodo), [periodo]);
  const periodoBadge = useMemo(() => toMMYYYY(periodo), [periodo]);

  const rows = useMemo(() => buildMock(), []);
  const totalRows = rows.length;

  // (Mock) counts por tab
  const tabCounts = useMemo(
    () => ({
      registros: totalRows,
      pendientes: totalRows,
      no_incluir: totalRows,
      reclamados: totalRows,
    }),
    [totalRows]
  );

  const title = useMemo(() => {
    return `${modo === "compra" ? "Resumen compra" : "Resumen venta"}, ${periodoLabel}`;
  }, [modo, periodoLabel]);

  const contextLine = useMemo(() => {
    const tabLabel =
      tab === "registros"
        ? "registros"
        : tab === "pendientes"
        ? "pendientes"
        : tab === "no_incluir"
        ? "no incluir"
        : "reclamados";

    return `Contexto: ${periodoLabel} · ${modo} · ${tabLabel}`;
  }, [periodoLabel, modo, tab]);

  const onCambiarPeriodo = () => {
    router.push("/contabilidad/compra-venta");
  };

  const onVolver = () => {
    router.push("/contabilidad/compra-venta");
  };

   const onDetalle = (row) => {
    const qs = new URLSearchParams({
    periodo,
    modo,
    tab,
    doc: row.tipoDocumento,
  });

    router.push(`/contabilidad/compra-venta/resultado/detalle?${qs.toString()}`);
   };


  return (
    <div className="cvr-page">
      <div className="cvr-breadcrumb">
        Registro compra/venta <span className="sep">›</span> Resumen compra
      </div>

      <div className="cvr-panel">
        {/* Header */}
        <div className="cvr-head">
          <div className="cvr-headLeft">
            <div className="cvr-titleRow">
              <h1 className="cvr-title">{title}</h1>
              <span className="cvr-badge">{periodoBadge}</span>
            </div>
            <p className="cvr-sub">
              Período contable seleccionado · Mantiene todas las funciones (tabs, compra/venta, tabla y paginación).
            </p>
          </div>

          <div className="cvr-headActions">
            <button className="cvr-btn cvr-btnPrimary" type="button" onClick={onCambiarPeriodo}>
              <i className="bi bi-calendar3" aria-hidden="true" /> Cambiar período
            </button>

            <button className="cvr-btn cvr-btnGhost" type="button" onClick={onVolver}>
              ← Volver
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="cvr-controls">
          <div className="cvr-toggle">
            <button
              type="button"
              className={`cvr-toggleBtn ${modo === "compra" ? "active" : ""}`}
              onClick={() => {
                setModo("compra");
                setPage(1);
              }}
            >
              <i className="bi bi-bar-chart-fill" aria-hidden="true" /> Compra
            </button>

            <button
              type="button"
              className={`cvr-toggleBtn ${modo === "venta" ? "active" : ""}`}
              onClick={() => {
                setModo("venta");
                setPage(1);
              }}
            >
              <i className="bi bi-receipt" aria-hidden="true" /> Venta
            </button>
          </div>

          <div className="cvr-tabs" role="tablist" aria-label="Estados">
            <button
              type="button"
              className={`cvr-tab ${tab === "registros" ? "active" : ""}`}
              onClick={() => {
                setTab("registros");
                setPage(1);
              }}
              role="tab"
              aria-selected={tab === "registros"}
            >
              Registros <span className="cvr-count">{tabCounts.registros}</span>
            </button>

            <button
              type="button"
              className={`cvr-tab ${tab === "pendientes" ? "active" : ""}`}
              onClick={() => {
                setTab("pendientes");
                setPage(1);
              }}
              role="tab"
              aria-selected={tab === "pendientes"}
            >
              Pendientes <span className="cvr-count">{tabCounts.pendientes}</span>
            </button>

            <button
              type="button"
              className={`cvr-tab ${tab === "no_incluir" ? "active" : ""}`}
              onClick={() => {
                setTab("no_incluir");
                setPage(1);
              }}
              role="tab"
              aria-selected={tab === "no_incluir"}
            >
              No incluir <span className="cvr-count">{tabCounts.no_incluir}</span>
            </button>

            <button
              type="button"
              className={`cvr-tab ${tab === "reclamados" ? "active" : ""}`}
              onClick={() => {
                setTab("reclamados");
                setPage(1);
              }}
              role="tab"
              aria-selected={tab === "reclamados"}
            >
              Reclamados <span className="cvr-count">{tabCounts.reclamados}</span>
            </button>
          </div>
        </div>

        {/* Card Table */}
        <div className="cvr-card">
          <div className="cvr-cardHead">
            <div className="cvr-cardTitle">
              <i className="bi bi-table" aria-hidden="true" />
              <span>{modo === "compra" ? "Resumen compra" : "Resumen venta"}</span>
            </div>

            <div className="cvr-small">
              Mostrando 1-{Math.min(totalRows, 3)} de {totalRows} registros
            </div>
          </div>

          <div className="cvr-tableWrap">
            <table className="cvr-table">
              <colgroup>
                <col className="col-doc" />
                <col className="col-cant" />
                <col className="col-num" />
                <col className="col-num" />
                <col className="col-num" />
                <col className="col-det" />
              </colgroup>

              <thead>
                <tr>
                  <th className="col-doc">Tipo Documento</th>
                  <th className="col-cant r">Cantidad</th>
                  <th className="col-num r">Monto exento</th>
                  <th className="col-num r">Monto neto</th>
                  <th className="col-num r">Monto IVA</th>
                  <th className="col-det r">Detalle</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="col-doc">
                      <div className="docCell" title={row.tipoDocumento}>
                        {row.tipoDocumento}
                      </div>
                    </td>
                    <td className="col-cant r mono">{fmtCL(row.cantidad)}</td>
                    <td className="col-num r mono">{fmtCL(row.exento)}</td>
                    <td className="col-num r mono">{fmtCL(row.neto)}</td>
                    <td className="col-num r mono">{fmtCL(row.iva)}</td>
                    <td className="col-det r">
                      <button
                        className="cvr-dotBtn"
                        type="button"
                        onClick={() => onDetalle(row)}
                        aria-label="Detalle"
                      >
                        …
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cvr-footer">
            <div className="cvr-context">{contextLine}</div>

            <div className="cvr-pager">
              <button
                className="cvr-btn cvr-btnGhost"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Anterior
              </button>

              <div className="cvr-pagePill">{page}/1</div>

              <button className="cvr-btn cvr-btnGhost" type="button" disabled>
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
