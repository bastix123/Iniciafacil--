"use client";

import TxActionsMenu from "@/components/ui/TxActionsMenu";
import "./transacciones.css";
import { useEffect, useMemo, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Select from "@radix-ui/react-select";
import { useRouter, useSearchParams } from "next/navigation";
import { usePeriodo } from "@/context/PeriodoContext";

/* ✅ mismo datepicker tipo “Período” (mes/año) */
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
registerLocale("es", es);

function RadixSelect({ value, onValueChange, placeholder, items, ariaLabel }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="tx-selectTrigger" aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="tx-selectIcon">▾</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="tx-selectContent" position="popper" sideOffset={8}>
          <Select.Viewport className="tx-selectViewport">
            {items.map((it) => (
              <Select.Item key={it.value} value={it.value} className="tx-selectItem">
                <Select.ItemText>{it.label}</Select.ItemText>
                <Select.ItemIndicator className="tx-selectCheck">✓</Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.Arrow className="tx-selectArrow" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/* ✅ helpers YM <-> Date */
function ymToDate(ym) {
  if (!ym || !String(ym).includes("-")) return null;
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}
function dateToYM(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function Transacciones() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { periodo: periodoGlobal } = usePeriodo();

  const getCurrentYM = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const defaultYM = periodoGlobal || getCurrentYM();

  const [tipo, setTipo] = useState("Todos");

  const [desde, setDesde] = useState(getCurrentYM());
  const [hasta, setHasta] = useState(getCurrentYM());

  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");

  // ✅ Mostrar (page size)
  const [pageSize, setPageSize] = useState("10");

  const touchedDesdeHasta = useRef(false);
  const urlOverridesRef = useRef({ desde: false, hasta: false });

  const didInitFromUrl = useRef(false);
  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;

    const pTipo = searchParams.get("tipo");
    const pDesde = searchParams.get("desde");
    const pHasta = searchParams.get("hasta");
    const pQ = searchParams.get("q");
    const pShow = searchParams.get("show");

    urlOverridesRef.current = { desde: !!pDesde, hasta: !!pHasta };

    if (pTipo) setTipo(pTipo);

    if (pDesde) {
      setDesde(pDesde);
      touchedDesdeHasta.current = true;
    } else {
      setDesde(defaultYM);
    }

    if (pHasta) {
      setHasta(pHasta);
      touchedDesdeHasta.current = true;
    } else {
      setHasta(defaultYM);
    }

    if (pQ) {
      setQInput(pQ);
      setQApplied(pQ);
    }

    if (pShow && ["10", "25", "50", "100"].includes(pShow)) {
      setPageSize(pShow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didInitFromUrl.current) return;

    const { desde: ovDesde, hasta: ovHasta } = urlOverridesRef.current;
    if (ovDesde || ovHasta) return;
    if (touchedDesdeHasta.current) return;

    setDesde(defaultYM);
    setHasta(defaultYM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultYM]);

  const buildQS = (next) => {
    const qs = new URLSearchParams();

    if (next.tipo && next.tipo !== "Todos") qs.set("tipo", next.tipo);
    if (next.desde) qs.set("desde", next.desde);
    if (next.hasta) qs.set("hasta", next.hasta);
    if (next.q) qs.set("q", next.q);
    if (next.show) qs.set("show", next.show);

    return qs.toString();
  };

  useEffect(() => {
    if (!didInitFromUrl.current) return;

    const t = setTimeout(() => {
      const qs = buildQS({ tipo, desde, hasta, q: qApplied, show: pageSize });
      const url = qs ? `/transacciones?${qs}` : `/transacciones`;
      router.replace(url);
    }, 120);

    return () => clearTimeout(t);
  }, [tipo, desde, hasta, qApplied, pageSize, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQApplied(qInput.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [qInput]);

  const rows = useMemo(
    () => [
      {
        id: 6100,
        fecha: "30/12/2025",
        tipo: "Ingreso",
        desc: "Transferencia Banco Estado Aranda Erika de las Mercedes",
        monto: "10.860",
        vig: "SI",
      },
      {
        id: 6100,
        fecha: "30/12/2025",
        tipo: "Ingreso",
        desc: "Transferencia Banco Estado Aranda RODRIGUEZ ARAVENA LUIS",
        monto: "10.860",
        vig: "SI",
      },
      {
        id: 6200,
        fecha: "30/12/2025",
        tipo: "Traspaso",
        desc: "TRASPASO DE: GONZALEZ SAGREDO MARIA JOSE",
        monto: "20.870",
        vig: "SI",
      },
      {
        id: 6100,
        fecha: "30/12/2025",
        tipo: "Traspaso",
        desc: "TRASPASO DE: MENA ASTUDILLO CINTHIA JACQUELINNE",
        monto: "13.940",
        vig: "SI",
      },
    ],
    []
  );

  const aplicarBusqueda = () => setQApplied(qInput.trim());
  const limpiarBusqueda = () => {
    setQInput("");
    setQApplied("");
  };

  const limpiarFiltros = () => {
    setTipo("Todos");
    touchedDesdeHasta.current = false;
    urlOverridesRef.current = { desde: false, hasta: false };

    setDesde(defaultYM);
    setHasta(defaultYM);
    limpiarBusqueda();
  };

  const filtrosActivos = useMemo(() => {
    const chips = [];
    if (tipo !== "Todos") chips.push({ k: "tipo", label: `Tipo: ${tipo}` });
    if (desde) chips.push({ k: "desde", label: `Desde: ${desde}` });
    if (hasta) chips.push({ k: "hasta", label: `Hasta: ${hasta}` });
    if (qApplied) chips.push({ k: "q", label: `Buscar: ${qApplied}` });
    if (pageSize) chips.push({ k: "show", label: `Mostrar: ${pageSize}` });
    return chips;
  }, [tipo, desde, hasta, qApplied, pageSize]);

  const filtered = useMemo(() => {
    const qq = qApplied.toLowerCase();

    const toYM = (ddmmyyyy) => {
      const parts = String(ddmmyyyy).split("/");
      const mm = parts?.[1];
      const yyyy = parts?.[2];
      if (!mm || !yyyy) return "";
      return `${yyyy}-${String(mm).padStart(2, "0")}`;
    };

    const inMonthRange = (rowFecha) => {
      const ym = toYM(rowFecha);
      if (!ym) return true;
      const desdeOk = !desde ? true : ym >= desde;
      const hastaOk = !hasta ? true : ym <= hasta;
      return desdeOk && hastaOk;
    };

    return rows.filter((r) => {
      const tipoOk = tipo === "Todos" ? true : r.tipo === tipo;
      const periodoOk = inMonthRange(r.fecha);
      const qOk = !qq ? true : `${r.id} ${r.desc} ${r.tipo}`.toLowerCase().includes(qq);
      return tipoOk && periodoOk && qOk;
    });
  }, [rows, tipo, desde, hasta, qApplied]);

  // ✅ “Mostrar” aplica a tabla
  const pageSizeNum = Number(pageSize) || 10;
  const visibleRows = useMemo(() => filtered.slice(0, pageSizeNum), [filtered, pageSizeNum]);

  const exportar = (formato) => {
    if (formato === "pdf") alert("Exportar PDF (pendiente)");
    if (formato === "excel") alert("Exportar Excel (pendiente)");
  };

  const onRowAction = (action, row) => {
    if (action === "ver") alert(`Ver detalles ID ${row.id}`);
    if (action === "eliminar") alert(`Eliminar ID ${row.id}`);
  };

  const makeEditHref = (txId) => {
    const qs = buildQS({ tipo, desde, hasta, q: qApplied, show: pageSize });
    return qs ? `/transacciones/${txId}/editar?${qs}` : `/transacciones/${txId}/editar`;
  };

  const tipoItems = [
    { value: "Todos", label: "Todos" },
    { value: "Ingreso", label: "Ingreso" },
    { value: "Traspaso", label: "Traspaso" },
    { value: "Egreso", label: "Egreso" },
  ];

  const showItems = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <div className="tx-page">
      <div className="tx-head">
        <div>
          <h1 className="tx-title">Transacciones</h1>
          <p className="tx-subtitle">Buscar y Gestionar Comprobantes</p>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="tx-export" type="button">
              <span className="tx-export-ico">⬇</span>
              exportar
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content side="bottom" align="end" sideOffset={8} className="tx-radix-menu">
              <DropdownMenu.Item
                className="tx-radix-item"
                onSelect={(e) => {
                  e.preventDefault();
                  exportar("pdf");
                }}
              >
                📄 Exportar PDF
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="tx-radix-item"
                onSelect={(e) => {
                  e.preventDefault();
                  exportar("excel");
                }}
              >
                📊 Exportar Excel
              </DropdownMenu.Item>

              <DropdownMenu.Arrow className="tx-radix-arrow" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="tx-panel">
        <div className="tx-filters">
          <div className="tx-field">
            <label className="tx-label">Tipo</label>
            <RadixSelect value={tipo} onValueChange={setTipo} placeholder="Selecciona tipo" items={tipoItems} ariaLabel="Tipo" />
          </div>

          <div className="tx-field">
            <label className="tx-label">Desde (mes/año)</label>

            <div className="tx-periodWrap">
              <DatePicker
                selected={ymToDate(desde)}
                onChange={(date) => {
                  touchedDesdeHasta.current = true;
                  setDesde(dateToYM(date));
                }}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                showPopperArrow={false}
                locale="es"
                popperPlacement="bottom-start"
                wrapperClassName="tx-dpWrap"
                className="tx-input tx-input-month"
              />
            </div>
          </div>

          <div className="tx-field">
            <label className="tx-label">Hasta (mes/año)</label>

            <div className="tx-periodWrap">
              <DatePicker
                selected={ymToDate(hasta)}
                onChange={(date) => {
                  touchedDesdeHasta.current = true;
                  setHasta(dateToYM(date));
                }}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                showPopperArrow={false}
                locale="es"
                popperPlacement="bottom-start"
                wrapperClassName="tx-dpWrap"
                className="tx-input tx-input-month"
              />
            </div>
          </div>

          <div className="tx-field">
            <label className="tx-label">Buscar</label>

            <div className="tx-searchBox">
              <input
                className="tx-input tx-input-search"
                placeholder="Buscar por id, descripción..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") aplicarBusqueda();
                  if (e.key === "Escape") limpiarBusqueda();
                }}
              />

              <button type="button" className="tx-searchIconBtn" onClick={aplicarBusqueda} aria-label="Buscar" />
              {qInput && <button type="button" className="tx-clearBtn" onClick={limpiarBusqueda} aria-label="Limpiar" />}
            </div>
          </div>

          <div className="tx-field tx-field-actions">
            <label className="tx-label">&nbsp;</label>
            <button
              type="button"
              className="tx-btn tx-btn-ghost"
              onClick={limpiarFiltros}
              disabled={tipo === "Todos" && desde === defaultYM && hasta === defaultYM && !qInput && !qApplied && pageSize === "10"}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {filtrosActivos.length > 0 && (
          <div className="tx-chips" aria-label="Filtros activos">
            {filtrosActivos.map((c) => (
              <span key={c.k} className="tx-chip">
                {c.label}
              </span>
            ))}
          </div>
        )}

        <div className="tx-tableWrap">
          <div className="tx-tableArea">
            <table className="tx-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-fecha">Fecha</th>
                  <th className="col-tipo">Tipo</th>
                  <th className="col-desc">Descripción</th>
                  <th className="tx-right col-monto">Monto</th>
                  <th className="tx-center col-vig">Vigencia</th>
                  <th className="tx-center col-more">…</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`}>
                    <td className="mono">{r.id}</td>
                    <td className="tx-date">{r.fecha}</td>

                    <td>
                      <span className={`tx-tipo-pill is-${r.tipo.toLowerCase()}`}>{r.tipo}</span>
                    </td>

                    <td className="tx-desc" title={r.desc}>
                      {r.desc}
                    </td>

                    <td className="tx-right mono">$ {r.monto}</td>

                    <td className="tx-center">
                      <span className={`tx-badge ${r.vig === "SI" ? "is-ok" : "is-warn"}`}>{r.vig === "SI" ? "Vigente" : "No vigente"}</span>
                    </td>

                    <td className="tx-center">
                      <div className="tx-actionsCell">
                        <TxActionsMenu editHref={makeEditHref(r.id)} onAction={(action) => onRowAction(action, r)} />
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tx-empty">
                      <div className="tx-emptyBox">
                        <div className="tx-emptyTitle">Sin resultados</div>
                        <div className="tx-emptySub">Prueba ajustando el período, tipo o búsqueda.</div>
                        <button type="button" className="tx-btn tx-btn-primary" onClick={limpiarFiltros}>
                          Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tx-footer">
          <div className="tx-footLeft">
            Mostrando <span className="mono">{Math.min(visibleRows.length, filtered.length)}</span> de <span className="mono">{filtered.length}</span> resultados
          </div>

          <div className="tx-footRight">
            <span className="tx-footLabel">Mostrar</span>
            <RadixSelect value={pageSize} onValueChange={setPageSize} placeholder="10" items={showItems} ariaLabel="Mostrar cantidad" />
          </div>
        </div>
      </div>
    </div>
  );
}


