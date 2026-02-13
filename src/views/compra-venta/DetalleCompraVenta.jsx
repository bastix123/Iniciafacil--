"use client";

import "./detalle-compra-venta.css";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DocumentoDetalleModal from "./DocumentoDetalleModal.jsx";

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

function startOfMonth(ym) {
  if (!ym) return "";
  const [y, m] = String(ym).split("-");
  if (!y || !m) return "";
  return `${y}-${m}-01`;
}

function endOfMonth(ym) {
  if (!ym) return "";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return "";
  const lastDay = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;
}

// Mock (después lo conectas a API)
function buildMockRows() {
  return Array.from({ length: 16 }).map((_, i) => ({
    tipo: "IVA no Recuperable",
    rut: "96689310-9",
    razon: "Transbank S.A",
    folio: 56784792,
    fecha: "27/11/2025",
    monto: 66450,
    id: i + 1,
  }));
}

/**
 * ✅ Normaliza el detalle al SHAPE que el modal espera (FLAT).
 * La idea es que la API devuelva lo que quiera, pero tú lo conviertes acá.
 */
function normalizeDetalleForModal({ row, doc, modo, apiDetail }) {
  // row: viene de la tabla
  // apiDetail: vendrá de tu API (cuando exista)
  // doc/modo: contexto

  const d = apiDetail || {};

  // Si la API ya trae campos, priorízalos; si no, cae al row.
  return {
    // Para el subtitle
    tipoDocumento: doc,
    modo: modo,

    // Campos “originales” que pediste
    tipoCompra: d.tipoCompra ?? row.tipo ?? "—",
    rutProveedor: d.rutProveedor ?? row.rut ?? "—",
    razonSocial: d.razonSocial ?? row.razon ?? "—",
    folio: d.folio ?? row.folio ?? "—",
    fechaDocto: d.fechaDocto ?? row.fecha ?? "—",
    fechaRecepcion: d.fechaRecepcion ?? "01/12/2025 17:58:38",
    fechaAcuseRecibo: d.fechaAcuseRecibo ?? "—",

    // Resumen monetario
    montoNeto: d.montoNeto ?? 55840,
    ivaRecuperable: d.ivaRecuperable ?? 0,
    ivaNoRecuperable: d.ivaNoRecuperable ?? 10610,
    montoExento: d.montoExento ?? 0,
    otrosImpuestos: d.otrosImpuestos ?? 0,
    // si lo trae API, úsalo
    montoTotal: d.montoTotal ?? 66450,

    // Texto tributario
    detalleTributario: d.detalleTributario ?? "Este doc no registra impuestos especiales",
  };
}

/**
 * ✅ STUB para API:
 * Esta función es la que deberías conectar a tu backend.
 * - Recibe contexto + la fila clickeada
 * - Devuelve el detalle del documento para poblar el modal
 */
async function fetchDocumentoDetalleFromAPI({
  periodo,
  modo,
  tab,
  doc,
  row,
}) {
  // ============================================================
  // 🔌 CUANDO TENGAS API:
  // Ejemplo de endpoint:
  // GET /api/compra-venta/detalle-documento?periodo=YYYY-MM&modo=compra&tab=registros&folio=...&rut=...
  //
  // Ejemplo de payload esperado (puedes adaptarlo):
  // {
  //   tipoCompra: "IVA no Recuperable",
  //   rutProveedor: "96689310-9",
  //   razonSocial: "Transbank S.A",
  //   folio: "56784792",
  //   fechaDocto: "27/11/2025",
  //   fechaRecepcion: "01/12/2025 17:58:38",
  //   fechaAcuseRecibo: "—",
  //   montoNeto: 55840,
  //   ivaRecuperable: 0,
  //   ivaNoRecuperable: 10610,
  //   montoExento: 0,
  //   otrosImpuestos: 0,
  //   montoTotal: 66450,
  //   detalleTributario: "..."
  // }
  //
  // EJEMPLO:
  // const res = await fetch(`/api/...`);
  // if (!res.ok) throw new Error("No se pudo cargar detalle");
  // return await res.json();
  // ============================================================

  // ✅ Por ahora: MOCK (simula latencia)
  await new Promise((r) => setTimeout(r, 250));

  return {
    tipoCompra: row.tipo,
    rutProveedor: row.rut,
    razonSocial: row.razon,
    folio: row.folio,
    fechaDocto: row.fecha,
    fechaRecepcion: "01/12/2025 17:58:38",
    fechaAcuseRecibo: "—",
    montoNeto: 55840,
    ivaRecuperable: 0,
    ivaNoRecuperable: 10610,
    montoExento: 0,
    otrosImpuestos: 0,
    montoTotal: 66450,
    detalleTributario: "Este doc no registra impuestos especiales",
  };
}

export default function ResumenCompraVentaDetalle() {
  const router = useRouter();
  const sp = useSearchParams();

  const periodo = sp.get("periodo") || "2026-01";
  const modo = (sp.get("modo") || "compra").toLowerCase();
  const tab = (sp.get("tab") || "registros").toLowerCase();
  const doc = sp.get("doc") || "Factura Electrónica (33)";

  const periodoLabel = useMemo(() => monthLabel(periodo), [periodo]);
  const periodoBadge = useMemo(() => toMMYYYY(periodo), [periodo]);

  const [proveedor, setProveedor] = useState("");
  const [desde, setDesde] = useState(startOfMonth(periodo));
  const [hasta, setHasta] = useState(endOfMonth(periodo));
  const [montoMin, setMontoMin] = useState("");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(20);

  // ✅ Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null);

  const title = useMemo(() => {
    const prefix = modo === "venta" ? "Detalle de Ventas" : "Detalle de Compras";
    return `${prefix} · ${doc}`;
  }, [modo, doc]);

  const tabLabel = useMemo(() => {
    if (tab === "pendientes") return "pendientes";
    if (tab === "no_incluir") return "no incluir";
    if (tab === "reclamados") return "reclamados";
    return "registros";
  }, [tab]);

  const rows = useMemo(() => buildMockRows(), []);
  const total = rows.length;

  const onCambiarPeriodo = () => router.push("/contabilidad/compra-venta");
  const onVolver = () => router.back();

  // ✅ Abre modal + carga detalle (mock ahora / API después)
  const onDetalleFila = async (r) => {
    // 1) Abre rápido con lo mínimo (UX: feedback inmediato)
    setModalOpen(true);
    setModalLoading(true);

    // 2) Pinta algo base (evita “modal vacío”)
    setModalData(
      normalizeDetalleForModal({
        row: r,
        doc,
        modo,
        apiDetail: {
          // base instantáneo (sin esperar API)
          tipoCompra: r.tipo,
          rutProveedor: r.rut,
          razonSocial: r.razon,
          folio: r.folio,
          fechaDocto: r.fecha,
          montoTotal: r.monto,
        },
      })
    );

    try {
      // 3) Carga detalle real (API)
      const apiDetail = await fetchDocumentoDetalleFromAPI({
        periodo,
        modo,
        tab,
        doc,
        row: r,
      });

      // 4) Actualiza modal con datos completos
      setModalData(
        normalizeDetalleForModal({
          row: r,
          doc,
          modo,
          apiDetail,
        })
      );
    } catch (err) {
      console.error(err);
      // Si falla, mantienes lo base y puedes agregar un aviso en el modal si quieres
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="cvd-page">
      <div className="cvd-breadcrumb">
        Registro compra/venta <span className="sep">›</span> Resumen{" "}
        <span className="sep">›</span> Detalle
      </div>

      <div className="cvd-panel">
        {/* Header */}
        <div className="cvd-head">
          <div className="cvd-headLeft">
            <div className="cvd-titleRow">
              <h1 className="cvd-title">{title}</h1>
              <span className="cvd-badge">{periodoBadge}</span>
            </div>

            <div className="cvd-sub">
              Período: <strong>{periodoLabel}</strong> · Modo:{" "}
              <strong>{modo}</strong> · Estado: <strong>{tabLabel}</strong>
            </div>
          </div>

          <div className="cvd-headActions">
            <button className="cvd-btn cvd-btnPrimary" type="button" onClick={onCambiarPeriodo}>
              <i className="bi bi-calendar3" aria-hidden="true" /> Cambiar período
            </button>
            <button className="cvd-btn cvd-btnGhost" type="button" onClick={onVolver}>
              ← Volver
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="cvd-filters">
          <div className="cvd-filter">
            <label className="cvd-label">Proveedor</label>
            <input
              className="cvd-input"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Nombre o RUT"
            />
          </div>

          <div className="cvd-filter">
            <label className="cvd-label">Rango de fechas</label>
            <div className="cvd-dateRow">
              <input className="cvd-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              <span className="cvd-dateSep">→</span>
              <input className="cvd-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>

          <div className="cvd-filter">
            <label className="cvd-label">Monto</label>
            <div className="cvd-moneyRow">
              <span className="cvd-moneyBadge">$</span>
              <input
                className="cvd-input"
                inputMode="numeric"
                value={montoMin}
                onChange={(e) => setMontoMin(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="cvd-card">
          <div className="cvd-cardHead">
            <div className="cvd-cardTitle">
              <i className="bi bi-table" aria-hidden="true" />
              <span>Registros</span>
            </div>

            <div className="cvd-tools">
              <div className="cvd-mini">
                <span className="k">Mostrando</span>
                <select className="cvd-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="v">registros</span>
              </div>

              <div className="cvd-search">
                <span className="cvd-searchLabel">Buscar</span>
                <input
                  className="cvd-input cvd-inputSearch"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rut, folio, razón social..."
                />
              </div>
            </div>
          </div>

          <div className="cvd-tableWrap">
            <table className="cvd-table">
              <thead>
                <tr>
                  <th className="col-tipo">Tipo</th>
                  <th className="col-rut">Rut proveedor</th>
                  <th className="col-razon">Razón social</th>
                  <th className="col-folio c">Folio</th>
                  <th className="col-fecha c">Fecha Doc.</th>
                  <th className="col-monto c">Monto Total</th>
                  <th className="col-det c">Detalle</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-tipo">{r.tipo}</td>
                    <td className="col-rut mono">{r.rut}</td>
                    <td className="col-razon">{r.razon}</td>

                    <td className="c mono">{fmtCL(r.folio)}</td>
                    <td className="c mono">{r.fecha}</td>
                    <td className="c mono">{fmtCL(r.monto)}</td>
                    <td className="c">
                      <button
                        className="cvd-dotBtn"
                        type="button"
                        onClick={() => onDetalleFila(r)}
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

          <div className="cvd-footer">
            <div className="cvd-context">
              Mostrando 1 - {Math.min(total, pageSize)} de {total} registros
            </div>

            <div className="cvd-pager">
              <button className="cvd-btn cvd-btnGhost" type="button" disabled>
                ← Anterior
              </button>
              <div className="cvd-pagePill">1/1</div>
              <button className="cvd-btn cvd-btnGhost" type="button" disabled>
                Siguiente →
              </button>
            </div>
          </div>
        </div>

        <div className="cvd-footHint">
          Tip: esta vista hereda el contexto (período/modo/estado) desde el resumen y lo mantiene visible arriba.
        </div>
      </div>

      {/* ✅ MODAL */}
      <DocumentoDetalleModal
        open={modalOpen}
        data={modalData}
        loading={modalLoading}
        onClose={() => {
          setModalOpen(false);
          setModalData(null);
          setModalLoading(false);
        }}
      />
    </div>
  );
}


