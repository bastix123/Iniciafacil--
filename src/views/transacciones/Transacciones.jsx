"use client";

import TxActionsMenu from "@/components/ui/TxActionsMenu";
import "./transacciones.css";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as Select from "@radix-ui/react-select";
import { useRouter, useSearchParams } from "next/navigation";
import { usePeriodo } from "@/context/PeriodoContext";

/* ✅ mismo datepicker tipo “Período” (mes/año) */
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
registerLocale("es", es);

/* -----------------------------
   UI helpers
------------------------------ */

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

/* -----------------------------
   YM helpers + validation
------------------------------ */

const YM_RE = /^\d{4}-\d{2}$/;

function ymToDate(ym) {
  if (!ym || !YM_RE.test(String(ym))) return null;
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

function getCurrentYM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** compara "YYYY-MM" (string) */
function ymLE(a, b) {
  if (!YM_RE.test(a) || !YM_RE.test(b)) return false;
  return a <= b;
}
function ymLT(a, b) {
  if (!YM_RE.test(a) || !YM_RE.test(b)) return false;
  return a < b;
}

function clampToMaxYM(ym, maxYM) {
  if (!YM_RE.test(ym)) return "";
  if (!YM_RE.test(maxYM)) return ym;
  return ymLE(ym, maxYM) ? ym : maxYM;
}

function buildQS(next) {
  const qs = new URLSearchParams();
  if (next.tipo && next.tipo !== "Todos") qs.set("tipo", next.tipo);
  if (next.desde) qs.set("desde", next.desde);
  if (next.hasta) qs.set("hasta", next.hasta);
  if (next.q) qs.set("q", next.q);
  if (next.show) qs.set("show", next.show);
  if (next.page && Number(next.page) > 1) qs.set("page", String(next.page));
  if (next.sortBy) qs.set("sortBy", String(next.sortBy));
  if (next.sortDir && String(next.sortDir) !== "asc") qs.set("sortDir", String(next.sortDir));
  return qs.toString();
}

function validateAppliedFilters({ tipo, desde, hasta }, maxYM) {
  if (desde && !YM_RE.test(desde)) return { ok: false, msg: "Fecha “Desde” inválida. Vuelva a intentarlo." };
  if (hasta && !YM_RE.test(hasta)) return { ok: false, msg: "Fecha “Hasta” inválida. Vuelva a intentarlo." };

  if (desde && ymLT(maxYM, desde)) return { ok: false, msg: `“Desde” no puede ser posterior al período actual (${maxYM}). Vuelva a intentarlo.` };
  if (hasta && ymLT(maxYM, hasta)) return { ok: false, msg: `“Hasta” no puede ser posterior al período actual (${maxYM}). Vuelva a intentarlo.` };

  if (desde && hasta && ymLT(hasta, desde)) return { ok: false, msg: "El rango es inválido: “Desde” no puede ser mayor que “Hasta”. Vuelva a intentarlo." };

  const allowedTipos = new Set(["Todos", "Ingreso", "Traspaso", "Egreso"]);
  if (tipo && !allowedTipos.has(tipo)) return { ok: false, msg: "Tipo inválido. Vuelva a intentarlo." };

  return { ok: true, msg: "" };
}

/* -----------------------------
   Mock fallback (mantener UX)
------------------------------ */

const MOCK_ROWS = [
  { id: 6100, fecha: "30/12/2025", tipo: "Ingreso", desc: "Transferencia Banco Estado Aranda Erika de las Mercedes", monto: "10.860", vig: "SI" },
  { id: 6100, fecha: "30/12/2025", tipo: "Ingreso", desc: "Transferencia Banco Estado Aranda RODRIGUEZ ARAVENA LUIS", monto: "10.860", vig: "SI" },
  { id: 6200, fecha: "30/12/2025", tipo: "Traspaso", desc: "TRASPASO DE: GONZALEZ SAGREDO MARIA JOSE", monto: "20.870", vig: "SI" },
  { id: 6100, fecha: "30/12/2025", tipo: "Traspaso", desc: "TRASPASO DE: MENA ASTUDILLO CINTHIA JACQUELINNE", monto: "13.940", vig: "SI" },
];

function toYMfromDDMMYYYY(ddmmyyyy) {
  const parts = String(ddmmyyyy).split("/");
  const mm = parts?.[1];
  const yyyy = parts?.[2];
  if (!mm || !yyyy) return "";
  return `${yyyy}-${String(mm).padStart(2, "0")}`;
}

function filterMock(rows, { tipo, desde, hasta, q }) {
  const qq = (q || "").toLowerCase();

  return rows.filter((r) => {
    const tipoOk = tipo === "Todos" ? true : r.tipo === tipo;

    const ym = toYMfromDDMMYYYY(r.fecha);
    const desdeOk = !desde ? true : ymLE(desde, ym);
    const hastaOk = !hasta ? true : ymLE(ym, hasta);

    const qOk = !qq ? true : `${r.id} ${r.desc} ${r.tipo}`.toLowerCase().includes(qq);
    return tipoOk && desdeOk && hastaOk && qOk;
  });
}

/* -----------------------------
   Sorting helpers
------------------------------ */

function parseDDMMYYYY(s) {
  const [dd, mm, yyyy] = String(s || "").split("/").map((x) => Number(x));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}

function parseMonto(s) {
  const n = Number(String(s || "").replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
}

function cmp(a, b) {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : 1;
}

function sortRowsClient(rows, sortBy, sortDir) {
  if (!sortBy) return rows; // ✅ default: orden de llegada (backend)
  const dir = sortDir === "desc" ? -1 : 1;
  const out = [...rows];

  out.sort((ra, rb) => {
    let va, vb;

    switch (sortBy) {
      case "id":
        va = Number(ra.id) || 0;
        vb = Number(rb.id) || 0;
        break;
      case "fecha":
        va = parseDDMMYYYY(ra.fecha)?.getTime() ?? 0;
        vb = parseDDMMYYYY(rb.fecha)?.getTime() ?? 0;
        break;
      case "tipo":
        va = String(ra.tipo || "").toLowerCase();
        vb = String(rb.tipo || "").toLowerCase();
        break;
      case "desc":
        va = String(ra.desc || "").toLowerCase();
        vb = String(rb.desc || "").toLowerCase();
        break;
      case "monto":
        va = parseMonto(ra.monto);
        vb = parseMonto(rb.monto);
        break;
      case "vig":
        va = ra.vig === "SI" ? 0 : 1;
        vb = rb.vig === "SI" ? 0 : 1;
        break;
      default:
        va = String(ra[sortBy] ?? "").toLowerCase();
        vb = String(rb[sortBy] ?? "").toLowerCase();
        break;
    }

    return cmp(va, vb) * dir;
  });

  return out;
}

/* -----------------------------
   Mensaje “no resultados” contextual
------------------------------ */

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function ymToLabelEs(ym) {
  if (!YM_RE.test(String(ym))) return "";
  const [y, m] = String(ym).split("-").map(Number);
  const name = MONTHS_ES[(m || 1) - 1] || "";
  return `${name} ${y}`;
}

function noResultsMessage(applied) {
  const d = ymToLabelEs(applied?.desde);
  const h = ymToLabelEs(applied?.hasta);

  if (applied?.desde && applied?.hasta && applied.desde === applied.hasta) {
    return `No se encuentran transacciones en ${d}.`;
  }
  if (d && h) return `No se encuentran transacciones entre ${d} y ${h}.`;
  if (d) return `No se encuentran transacciones desde ${d}.`;
  if (h) return `No se encuentran transacciones hasta ${h}.`;
  return "No se encuentran transacciones.";
}

/* -----------------------------
   Main component
------------------------------ */

export default function Transacciones() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { periodo: periodoGlobal } = usePeriodo();

  // maxYM: NO permitimos seleccionar meses futuros a esto
  const maxYM = periodoGlobal || getCurrentYM();
  const maxDate = useMemo(() => ymToDate(maxYM), [maxYM]);

  // UI inputs (draft)
  const [tipo, setTipo] = useState("Todos");
  const [desde, setDesde] = useState(getCurrentYM());
  const [hasta, setHasta] = useState(getCurrentYM());
  const [qInput, setQInput] = useState("");
  const [pageSize, setPageSize] = useState("10");

  // applied (lo que realmente filtra + sync URL + fetch)
  const [applied, setApplied] = useState(() => ({
    tipo: "Todos",
    desde: getCurrentYM(),
    hasta: getCurrentYM(),
    q: "",
  }));

  // pagination
  const [page, setPage] = useState(1); // 1-based
  const pageSizeNum = Number(pageSize) || 10;

  // sorting (client + preparado para server)
  // ✅ default ahora es "orden de llegada" => sortBy ""
  const [sortBy, setSortBy] = useState(""); // default (backend)
  const [sortDir, setSortDir] = useState("asc"); // da igual si sortBy es ""

  // data + status
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // ✅ NUEVO: el “mensaje tipo error” solo se permite tras presionar Buscar
  const [didSearch, setDidSearch] = useState(false);

  // ✅ NUEVO: guardar el orden original (backend) para volver a default
  const [baseRows, setBaseRows] = useState([]);

  // Evita sobreescrituras si usuario ya tocó fechas
  const touchedDesdeHasta = useRef(false);

  // anti doble click buscar (y anti repetición)
  const lastBuscarRef = useRef("");

  // ---- init from URL (una sola vez) ----
  const didInitFromUrl = useRef(false);
  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;

    const pTipo = searchParams.get("tipo") || "Todos";
    const pDesde = searchParams.get("desde") || maxYM;
    const pHasta = searchParams.get("hasta") || maxYM;
    const pQ = searchParams.get("q") || "";
    const pShow = searchParams.get("show");
    const pPage = Number(searchParams.get("page") || "1") || 1;

    const pSortBy = searchParams.get("sortBy") || ""; // ✅ default
    const pSortDir = searchParams.get("sortDir") || "asc";

    const safeDesde = clampToMaxYM(pDesde, maxYM) || maxYM;
    const safeHasta = clampToMaxYM(pHasta, maxYM) || maxYM;

    let finalDesde = safeDesde;
    let finalHasta = safeHasta;
    if (ymLT(finalHasta, finalDesde)) {
      finalDesde = safeHasta;
      finalHasta = safeDesde;
      setErrMsg("El rango de fechas en la URL era inválido. Se corrigió automáticamente. Vuelva a intentarlo si persiste.");
      // Nota: esto viene por URL, no es un “Buscar” manual.
    }

    setTipo(pTipo);
    setDesde(finalDesde);
    setHasta(finalHasta);
    setQInput(pQ);

    if (pShow && ["10", "25", "50", "100"].includes(pShow)) setPageSize(pShow);

    const allowedSort = new Set(["", "id", "fecha", "tipo", "desc", "monto"]);
    setSortBy(allowedSort.has(pSortBy) ? pSortBy : "");
    setSortDir(pSortDir === "desc" ? "desc" : "asc");

    setApplied({ tipo: pTipo, desde: finalDesde, hasta: finalHasta, q: pQ });
    setPage(Math.max(1, pPage));

    // ✅ CAMBIO: NO marcamos didSearch al cargar la página.
    // La "búsqueda aplicada" solo existe cuando el usuario presiona Buscar.
    // setDidSearch(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- si cambia periodoGlobal, ajusta draft/applied SOLO si usuario no tocó fechas ----
  useEffect(() => {
    if (!didInitFromUrl.current) return;
    if (touchedDesdeHasta.current) return;

    const nextYM = maxYM;

    setDesde(nextYM);
    setHasta(nextYM);
    setApplied((a) => ({ ...a, desde: nextYM, hasta: nextYM }));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxYM]);

  // ---- Buscar real (applied) ----
  const onBuscar = useCallback(() => {
    if (loading) return; // ✅ protección doble click

    setErrMsg("");
    setDidSearch(true); // ✅ a partir de aquí sí mostramos mensajes (0 results / errores)

    const next = {
      tipo,
      desde: clampToMaxYM(desde || maxYM, maxYM) || maxYM,
      hasta: clampToMaxYM(hasta || maxYM, maxYM) || maxYM,
      q: qInput.trim(),
    };

    const v = validateAppliedFilters(next, maxYM);
    if (!v.ok) {
      setErrMsg(v.msg);
      return;
    }

    if (next.desde && next.hasta && ymLT(next.hasta, next.desde)) {
      setErrMsg("El rango es inválido: “Desde” no puede ser mayor que “Hasta”. Vuelva a intentarlo.");
      return;
    }

    const signature = JSON.stringify({ next, pageSize, sortBy, sortDir });
    if (signature === lastBuscarRef.current) return;
    lastBuscarRef.current = signature;

    setApplied(next);
    setPage(1);
  }, [tipo, desde, hasta, qInput, maxYM, loading, pageSize, sortBy, sortDir]);

  const limpiarFiltros = useCallback(() => {
    setErrMsg("");
    setDidSearch(false); // ✅ al limpiar, no mostramos mensajes
    touchedDesdeHasta.current = false;
    lastBuscarRef.current = "";

    setTipo("Todos");
    setDesde(maxYM);
    setHasta(maxYM);
    setQInput("");
    setPageSize("10");

    setApplied({ tipo: "Todos", desde: maxYM, hasta: maxYM, q: "" });
    setPage(1);

    // ✅ volver a orden default (backend)
    setSortBy("");
    setSortDir("asc");
  }, [maxYM]);

  // ---- URL sync SOLO cuando cambia applied / page / pageSize / sort ----
  useEffect(() => {
    if (!didInitFromUrl.current) return;

    const qs = buildQS({
      tipo: applied.tipo,
      desde: applied.desde,
      hasta: applied.hasta,
      q: applied.q,
      show: pageSize,
      page,
      sortBy,
      sortDir,
    });

    const url = qs ? `/transacciones?${qs}` : `/transacciones`;
    router.replace(url);
  }, [applied, page, pageSize, sortBy, sortDir, router]);

  // ---- Fetch real + loading/error ----
  useEffect(() => {
    if (!didInitFromUrl.current) return;

    const v = validateAppliedFilters(applied, maxYM);
    if (!v.ok) {
      if (didSearch) setErrMsg(v.msg);
      else setErrMsg("");
      return;
    }

    const controller = new AbortController();

    async function run() {
      setLoading(true);

      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const url = new URL(`${base}/transacciones`, window.location.origin);

        url.searchParams.set("tipo", applied.tipo);
        url.searchParams.set("desde", applied.desde);
        url.searchParams.set("hasta", applied.hasta);
        if (applied.q) url.searchParams.set("q", applied.q);

        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(pageSizeNum));

        // ✅ SOLO enviar sort si no está en default
        if (sortBy) {
          url.searchParams.set("sortBy", String(sortBy));
          url.searchParams.set("sortDir", String(sortDir));
        }

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const t = Number(data?.total ?? items.length) || 0;

        // ✅ guardamos orden original (backend) para "default"
        setBaseRows(items);

        // ✅ si sortBy está vacío, NO ordenar (default backend)
        const ordered = sortRowsClient(items, sortBy, sortDir);

        setRows(ordered);
        setTotal(t);

        if (t > 0) {
          setErrMsg("");
        } else {
          setErrMsg(didSearch ? noResultsMessage(applied) : "");
        }

        const totalPages = Math.max(1, Math.ceil(t / pageSizeNum));
        if (page > totalPages) setPage(totalPages);
      } catch (err) {
        if (String(err?.name) === "AbortError") return;

        const all = filterMock(MOCK_ROWS, applied);

        // ✅ default = orden “de llegada” del mock (tal cual)
        const orderedAll = sortRowsClient(all, sortBy, sortDir);

        const t = orderedAll.length;
        const start = (page - 1) * pageSizeNum;
        const items = orderedAll.slice(start, start + pageSizeNum);

        // ✅ en fallback mock, el "default" también funciona por baseRows mock implícito
        setBaseRows(items);

        setRows(items);
        setTotal(t);

        if (t > 0) {
          setErrMsg("");
        } else {
          setErrMsg(didSearch ? noResultsMessage(applied) : "");
        }
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [applied, page, pageSizeNum, maxYM, sortBy, sortDir, didSearch]);

  // ---- UI derived ----
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSizeNum)), [total, pageSizeNum]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSizeNum + 1;
  const showingTo = Math.min(total, page * pageSizeNum);

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

  const filtrosActivos = useMemo(() => {
    const chips = [];
    if (applied.tipo !== "Todos") chips.push({ k: "tipo", label: `Tipo: ${applied.tipo}` });
    if (applied.desde) chips.push({ k: "desde", label: `Desde: ${applied.desde}` });
    if (applied.hasta) chips.push({ k: "hasta", label: `Hasta: ${applied.hasta}` });
    if (applied.q) chips.push({ k: "q", label: `Buscar: ${applied.q}` });
    if (pageSize) chips.push({ k: "show", label: `Mostrar: ${pageSize}` });
    return chips;
  }, [applied, pageSize]);

  const onRowAction = (action, row) => {
    if (action === "ver") alert(`Ver detalles ID ${row.id}`);
    if (action === "eliminar") alert(`Eliminar ID ${row.id}`);
  };

  const makeEditHref = (txId) => {
    const qs = buildQS({
      tipo: applied.tipo,
      desde: applied.desde,
      hasta: applied.hasta,
      q: applied.q,
      show: pageSize,
      page,
      sortBy,
      sortDir,
    });
    return qs ? `/transacciones/${txId}/editar?${qs}` : `/transacciones/${txId}/editar`;
  };

  const makeNewHref = () => {
    const qs = buildQS({
      tipo: applied.tipo,
      desde: applied.desde,
      hasta: applied.hasta,
      q: applied.q,
      show: pageSize,
      page,
      sortBy,
      sortDir,
    });
    return qs ? `/transacciones/nueva?${qs}` : `/transacciones/nueva`;
  };

  // ---- sorting UI (3 estados: default -> asc -> desc -> default) ----
  const toggleSort = (key) => {
    setPage(1);

    // Vigencia NO se ordena
    if (key === "vig") return;

    if (sortBy !== key) {
      // default (otra col) -> asc en esta
      setSortBy(key);
      setSortDir("asc");
      return;
    }

    // misma columna: asc -> desc -> default
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }

    // desc -> default (orden de llegada)
    setSortBy("");
    setSortDir("asc");

    // ✅ volver visualmente al orden original si ya lo tenemos cargado
    // (sin esperar fetch; no rompe nada)
    if (Array.isArray(baseRows) && baseRows.length > 0) {
      const ordered = sortRowsClient(baseRows, "", "asc");
      setRows(ordered);
    }
  };

  const sortIconFor = (key) => {
    // Vigencia sin flechas
    if (key === "vig") return "";

    // Estado inicial / no activa: dos flechas
    if (sortBy !== key) return "↕";

    // Activa: una flecha según dir
    return sortDir === "asc" ? "↑" : "↓";
  };

  // empty contextual
  const emptyTitle = useMemo(() => {
    if (loading) return "Cargando…";
    if (total === 0 && applied.q) return "Sin resultados para la búsqueda";
    if (total === 0 && (applied.tipo !== "Todos" || applied.desde !== maxYM || applied.hasta !== maxYM)) return "Sin resultados con esos filtros";
    return "Sin resultados";
  }, [loading, total, applied, maxYM]);

  const emptySub = useMemo(() => {
    if (loading) return "Estamos cargando las transacciones.";
    if (errMsg) return "Hubo un problema o no hay datos para ese período. Puedes volver a intentar.";
    return "Prueba ajustando el período, tipo o búsqueda.";
  }, [loading, errMsg]);

  return (
    <div className="tx-page">
      <div className="tx-head">
        <div>
          <h1 className="tx-title">Transacciones</h1>
          <p className="tx-subtitle">Buscar y Gestionar Comprobantes</p>
        </div>

        <div>
          <button type="button" className="tx-btn tx-btn-primary" onClick={() => router.push(makeNewHref())} disabled={loading}>
            Nueva transacción
          </button>
        </div>
        {/* Exportar eliminado (se deja para edición/detalle) */}
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
                maxDate={maxDate}
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
                maxDate={maxDate}
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
                  if (e.key === "Enter") onBuscar();
                  if (e.key === "Escape") setQInput("");
                }}
              />

              <button type="button" className="tx-searchIconBtn" onClick={onBuscar} aria-label="Buscar" disabled={loading} />
              {qInput && (
                <button
                  type="button"
                  className="tx-clearBtn"
                  onClick={() => setQInput("")}
                  aria-label="Limpiar búsqueda"
                  disabled={loading}
                />
              )}
            </div>
          </div>

          <div className="tx-field tx-field-actions">
            <label className="tx-label">&nbsp;</label>
            <div className="tx-actionsBar">
              <button type="button" className="tx-btn tx-btn-primary" onClick={onBuscar} disabled={loading}>
                Buscar
              </button>

              <button type="button" className="tx-btn tx-btn-ghost" onClick={limpiarFiltros} disabled={loading}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje (solo tras Buscar) */}
        {errMsg && didSearch && (
          <div className="tx-alert" role="alert" aria-live="polite">
            <div className="tx-alertIcon" aria-hidden="true">
              !
            </div>
            <div className="tx-alertText">
              <div className="tx-alertTitle">Resultado</div>
              <div className="tx-alertSub">{errMsg}</div>
            </div>
            <button type="button" className="tx-alertBtn" onClick={onBuscar} disabled={loading}>
              Reintentar
            </button>
          </div>
        )}

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
                  <th className="col-id">
                    <button type="button" className="tx-thBtn" onClick={() => toggleSort("id")} aria-label="Ordenar por ID">
                      ID <span className="tx-sort">{sortIconFor("id")}</span>
                    </button>
                  </th>

                  <th className="col-fecha">
                    <button type="button" className="tx-thBtn" onClick={() => toggleSort("fecha")} aria-label="Ordenar por Fecha">
                      Fecha <span className="tx-sort">{sortIconFor("fecha")}</span>
                    </button>
                  </th>

                  <th className="col-tipo">
                    <button type="button" className="tx-thBtn" onClick={() => toggleSort("tipo")} aria-label="Ordenar por Tipo">
                      Tipo <span className="tx-sort">{sortIconFor("tipo")}</span>
                    </button>
                  </th>

                  <th className="col-desc">
                    <button type="button" className="tx-thBtn" onClick={() => toggleSort("desc")} aria-label="Ordenar por Descripción">
                      Descripción <span className="tx-sort">{sortIconFor("desc")}</span>
                    </button>
                  </th>

                  <th className="tx-right col-monto">
                    <button type="button" className="tx-thBtn tx-thRight" onClick={() => toggleSort("monto")} aria-label="Ordenar por Monto">
                      Monto <span className="tx-sort">{sortIconFor("monto")}</span>
                    </button>
                  </th>

                  <th className="tx-center col-vig">
                    {/* ✅ Vigencia SIN flechas y SIN ordenar */}
                    Vigencia
                  </th>

                  <th className="tx-center col-more">…</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="tx-empty">
                      Cargando transacciones…
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r, idx) => (
                    <tr key={`${r.id}-${idx}`}>
                      <td className="mono">{r.id}</td>
                      <td className="tx-date">{r.fecha}</td>

                      <td>
                        <span className={`tx-tipo-pill is-${String(r.tipo).toLowerCase()}`}>{r.tipo}</span>
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

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tx-empty">
                      <div className="tx-emptyBox">
                        <div className="tx-emptyTitle">{emptyTitle}</div>
                        <div className="tx-emptySub">{emptySub}</div>
                        <button type="button" className="tx-btn tx-btn-primary" onClick={limpiarFiltros} disabled={loading}>
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

        {/* Footer + Mostrar + Paginación */}
        <div className="tx-footer">
          <div className="tx-footLeft">
            Mostrando <span className="mono">{showingFrom}</span>–<span className="mono">{showingTo}</span> de <span className="mono">{total}</span>
          </div>

          <div className="tx-footRight">
            <span className="tx-footLabel">Mostrar</span>
            <RadixSelect
              value={pageSize}
              onValueChange={(v) => {
                setPageSize(v);
                setPage(1);
              }}
              placeholder="10"
              items={showItems}
              ariaLabel="Mostrar cantidad"
            />

            <div className="tx-pager">
              <button type="button" className="tx-btn tx-btn-ghost" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ←
              </button>

              <div className="tx-pageCount">
                <span className="mono">{page}</span>/<span className="mono">{totalPages}</span>
              </div>

              <button type="button" className="tx-btn tx-btn-ghost" disabled={!canNext || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
