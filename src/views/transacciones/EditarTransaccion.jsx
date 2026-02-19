"use client";

import "./editar-transaccion.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CL");
}

function parseMoney(v) {
  if (v === "" || v === null || v === undefined) return "";
  const s = String(v).replace(/\./g, "").replace(/,/g, ".");
  const num = Number(s);
  return Number.isFinite(num) ? num : "";
}

export default function EditarTransaccion({ id, params }) {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const txId = id ?? params?.id ?? routeParams?.id ?? "—";

  const backToList = () => {
    const qs = new URLSearchParams();

    const tipo = searchParams.get("tipo");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const q = searchParams.get("q");

    if (tipo) qs.set("tipo", tipo);
    if (desde) qs.set("desde", desde);
    if (hasta) qs.set("hasta", hasta);
    if (q) qs.set("q", q);

    const url = qs.toString() ? `/transacciones?${qs.toString()}` : "/transacciones";
    router.push(url);
  };

  // ---------- Datos del comprobante ----------
  const [openHeader, setOpenHeader] = useState(true);

  const [tipo, setTipo] = useState("Ingreso");
  const [fecha, setFecha] = useState("2025-12-30");
  const [nComprobante, setNComprobante] = useState(String(txId));
  const [glosa, setGlosa] = useState("TRANSFERENCIA BANCOESTADO DE MALHUE ARANDA ERIKA DE LAS MERCEDES");
  const [repetirGlosa, setRepetirGlosa] = useState(true);

  // ---------- Detalle contable ----------
  const [lineas, setLineas] = useState([
    {
      id: "l1",
      cuenta: "1104-01",
      ccosto: "",
      glosaDet: "TRANSFERENCIA BANCOESTADO DE MALHUE ARANDA ERIKA DE LAS MERCEDES",
      debe: "",
      haber: 10860,
    },
    {
      id: "l2",
      cuenta: "1102-02",
      ccosto: "",
      glosaDet: "TRANSFERENCIA BANCOESTADO DE MALHUE ARANDA ERIKA DE LAS MERCEDES",
      debe: 10860,
      haber: "",
    },
  ]);

  const [touched, setTouched] = useState(false);

  // ✅ Mensajería (banner simple) + submitting (listo para API)
  const [msg, setMsg] = useState({ type: "", text: "" }); // type: "ok" | "warn" | "error" | "info" | ""
  const [submitting, setSubmitting] = useState(false);

  const setBanner = (type, text) => setMsg({ type, text });
  const clearBanner = () => setMsg({ type: "", text: "" });

  // ✅ Modo edición: por defecto NO editable hasta apretar "Editar"
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Confirmación eliminación (modal simple)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ---------- Adjuntos ----------
  const [adjunto, setAdjunto] = useState(null);

  const validateAdjunto = (file) => {
    if (!file) return { ok: true, msg: "" };
    if (file.type !== "application/pdf") return { ok: false, msg: "El adjunto debe ser un PDF." };
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) return { ok: false, msg: "El PDF excede 4MB." };
    return { ok: true, msg: "" };
  };

  // ✅ (opcional) Hook de carga real (GET /api/transacciones/{id})
  // - Mantiene tus defaults, pero si el backend existe, se llenará con datos reales.
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    const numericId = String(txId || "").trim();
    if (!numericId || numericId === "—" || loadedOnce) return;

    let alive = true;

    (async () => {
      setLoading(true);
      clearBanner();
      try {
        const res = await fetch(`/api/transacciones/${numericId}`, { method: "GET" });
        if (!res.ok) {
          // si aún no existe backend, no rompas la vista
          return;
        }
        const data = await res.json();

        if (!alive) return;

        // Adaptación: si tu backend usa { fecha, tipo, estado, detalles: [...] }
        const nextTipo = data?.tipo ?? tipo;
        const nextFecha = data?.fecha ?? fecha;
        const nextId = data?.id ?? numericId;

        // Glosa principal: usa la primera glosa del detalle si no viene una glosa de encabezado
        const headGlosa =
          data?.glosa ??
          (Array.isArray(data?.detalles) && data.detalles[0]?.glosa ? data.detalles[0].glosa : glosa);

        setTipo(String(nextTipo));
        setFecha(String(nextFecha));
        setNComprobante(String(nextId));
        setGlosa(String(headGlosa || ""));

        const detalles = Array.isArray(data?.detalles) ? data.detalles : Array.isArray(data?.detalles) ? data.detalles : [];
        if (Array.isArray(data?.detalles)) {
          const mapped = data.detalles.map((d, idx) => ({
            id: `l${idx + 1}`,
            cuenta: String(d?.codigoCuenta ?? d?.accountId ?? ""),
            ccosto: String(d?.centroCosto ?? d?.centroCostoId ?? ""),
            glosaDet: String(d?.glosa ?? ""),
            debe: d?.debe ?? "",
            haber: d?.haber ?? "",
          }));
          if (mapped.length) setLineas(mapped);
        }

        setTouched(false);
        setIsEditing(false);
        setAdjunto(null);
        setLoadedOnce(true);
      } catch (e) {
        // no bloquees: solo muestra info si ya estás conectado a backend
        setBanner("warn", "No se pudo cargar desde API (se usan datos mock).");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txId, loadedOnce]);

  const applyGlosaToDetalle = (newGlosa) => {
    setLineas((prev) =>
      prev.map((l) => ({
        ...l,
        glosaDet: newGlosa,
      }))
    );
  };

  const onChangeGlosa = (v) => {
    clearBanner();
    setGlosa(v);
    setTouched(true);
    if (repetirGlosa) applyGlosaToDetalle(v);
  };

  const onToggleRepetir = (v) => {
    clearBanner();
    setRepetirGlosa(v);
    setTouched(true);
    if (v) applyGlosaToDetalle(glosa);
  };

  const setLinea = (lineId, patch) => {
    clearBanner();
    setLineas((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
    setTouched(true);
  };

  const MAX_LINEAS = 15;

  const addLinea = () => {
    clearBanner();
    if (!isEditing) {
      setBanner("info", "Presiona “Editar” para modificar la transacción.");
      return;
    }
    if (lineas.length >= MAX_LINEAS) {
      setBanner("warn", `Máximo permitido: ${MAX_LINEAS} líneas.`);
      return;
    }

    const newId = `l${Date.now()}`;
    setLineas((prev) => [
      ...prev,
      {
        id: newId,
        cuenta: "",
        ccosto: "",
        glosaDet: repetirGlosa ? glosa : "",
        debe: "",
        haber: "",
      },
    ]);
    setTouched(true);
  };

  const deleteLinea = (lineId) => {
    clearBanner();
    if (!isEditing) {
      setBanner("info", "Presiona “Editar” para modificar la transacción.");
      return;
    }
    setConfirmDeleteId(lineId);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setLineas((prev) => prev.filter((l) => l.id !== confirmDeleteId));
    setTouched(true);
    setConfirmDeleteId(null);
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  // Reglas contables: no permitir debe y haber a la vez en una línea
  const onChangeDebe = (lineId, raw) => {
    clearBanner();
    const v = parseMoney(raw);
    setLinea(lineId, { debe: v, haber: v ? "" : "" });
  };

  const onChangeHaber = (lineId, raw) => {
    clearBanner();
    const v = parseMoney(raw);
    setLinea(lineId, { haber: v, debe: v ? "" : "" });
  };

  const totals = useMemo(() => {
    const tDebe = lineas.reduce((acc, l) => acc + Number(l.debe || 0), 0);
    const tHaber = lineas.reduce((acc, l) => acc + Number(l.haber || 0), 0);
    const ok = tDebe === tHaber && tDebe > 0;
    return { tDebe, tHaber, ok };
  }, [lineas]);

  const canSave = totals.ok && touched && !submitting && isEditing;

  const onCancel = () => backToList();

  // ✅ Validador “profesional” listo para backend
  const validateBeforeSave = () => {
    if (!String(tipo || "").trim()) return { ok: false, type: "error", msg: "Selecciona un tipo de comprobante." };
    if (!String(fecha || "").trim()) return { ok: false, type: "error", msg: "Selecciona una fecha de emisión." };
    if (!String(glosa || "").trim()) return { ok: false, type: "error", msg: "La glosa principal es obligatoria." };

    if (!Array.isArray(lineas) || lineas.length === 0) {
      return { ok: false, type: "error", msg: "Debes tener al menos 1 línea contable." };
    }
    if (lineas.length > MAX_LINEAS) {
      return { ok: false, type: "warn", msg: `Máximo permitido: ${MAX_LINEAS} líneas.` };
    }

    let hasDebe = false;
    let hasHaber = false;

    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const idx = i + 1;

      if (!String(l.cuenta || "").trim()) return { ok: false, type: "error", msg: `Línea ${idx}: la cuenta es obligatoria.` };
      if (!String(l.glosaDet || "").trim()) return { ok: false, type: "error", msg: `Línea ${idx}: la glosa de la línea es obligatoria.` };

      const d = Number(l.debe || 0);
      const h = Number(l.haber || 0);

      if (d > 0 && h > 0) return { ok: false, type: "error", msg: `Línea ${idx}: no puede tener Debe y Haber a la vez.` };
      if (d <= 0 && h <= 0) return { ok: false, type: "error", msg: `Línea ${idx}: ingresa Debe o Haber (mayor a 0).` };

      if (d > 0) hasDebe = true;
      if (h > 0) hasHaber = true;
    }

    if (!hasDebe || !hasHaber) {
      return { ok: false, type: "error", msg: "Debe existir al menos 1 línea en Debe y 1 línea en Haber." };
    }

    if (!totals.ok) {
      return { ok: false, type: "error", msg: "La transacción no cuadra: Debe debe ser igual a Haber y mayor a 0." };
    }

    const vAdj = validateAdjunto(adjunto);
    if (!vAdj.ok) return { ok: false, type: "error", msg: vAdj.msg };

    return { ok: true, type: "", msg: "" };
  };

  // ✅ Payload listo para PUT /api/transacciones/{id}
  const buildPayload = () => {
    return {
      id: Number.isFinite(Number(txId)) ? Number(txId) : txId,
      fecha, // YYYY-MM-DD
      tipo,
      nComprobante: String(nComprobante || "").trim(),
      glosa: String(glosa || "").trim(),
      repetirGlosa: Boolean(repetirGlosa),
      detalles: lineas.map((l) => ({
        accountId: String(l.cuenta || "").trim(),
        centroCosto: String(l.ccosto || "").trim() || null,
        glosa: String(l.glosaDet || "").trim(),
        debe: Number(l.debe || 0),
        haber: Number(l.haber || 0),
      })),
    };
  };

  // ✅ Manejo de errores REAL (cuando conectes backend)
  const apiUpdate = async ({ payload, file }) => {
    const url = `/api/transacciones/${String(txId)}`;
    let res;

    if (file) {
      const fd = new FormData();
      fd.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      fd.append("file", file);
      res = await fetch(url, { method: "PUT", body: fd });
    } else {
      res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      let message = `Error al guardar (HTTP ${res.status}).`;
      try {
        const data = await res.json();
        message = data?.message || data?.error || message;
      } catch {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {}
      }
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const onSave = async (continueEditing = false) => {
    clearBanner();

    if (!isEditing) {
      setBanner("info", "Presiona “Editar” para poder guardar cambios.");
      return;
    }

    const v = validateBeforeSave();
    if (!v.ok) {
      setBanner(v.type || "error", v.msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();

      // Si aún no hay backend, esto igual “queda listo” (no rompe): intenta, y si falla avisa
      const result = await apiUpdate({ payload, file: adjunto });

      console.log("PUT /api/transacciones/{id} payload:", payload, "adjunto:", adjunto, "result:", result);

      setBanner("ok", "Cambios guardados correctamente.");
      setTouched(false);

      if (!continueEditing) {
        setIsEditing(false);
        backToList();
      }
    } catch (e) {
      setBanner("error", e?.message || "No se pudo guardar. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    clearBanner();
    setIsEditing(true);
  };

  const stopEditing = () => {
    clearBanner();
    setIsEditing(false);
    // no reseteo datos: solo “bloqueo” edición
    // si quieres “descartar cambios” reales, eso lo haces recargando desde API
  };

  const editDisabled = submitting || loading || !isEditing;

  return (
    <div className="editx-page">
      {/* Header contextual */}
      <div className="editx-top">
        <button className="editx-back" type="button" onClick={backToList} disabled={submitting}>
          ← Volver
        </button>

        <div className="editx-titleWrap">
          <h1 className="editx-title">Editar transacción #{txId}</h1>
          <div className="editx-sub">
            <span className="editx-chip">{tipo}</span>
            <span className="editx-chip">Emisión: {fecha}</span>
            <span className={`editx-chip ${totals.ok ? "ok" : "warn"}`}>{totals.ok ? "Cuadra" : "No cuadra"}</span>
            {loading && <span className="editx-chip">Cargando…</span>}
            {!isEditing && <span className="editx-chip">Solo lectura</span>}
            {isEditing && <span className="editx-chip ok">Editando</span>}
          </div>
        </div>

        <div className="editx-right" style={{ display: "flex", gap: 10 }}>
          {!isEditing ? (
            <button className="editx-btn editx-btnPrimary" type="button" onClick={startEditing} disabled={submitting || loading}>
              Editar
            </button>
          ) : (
            <button className="editx-btn editx-btnGhost" type="button" onClick={stopEditing} disabled={submitting || loading}>
              Bloquear edición
            </button>
          )}

          <button
            className="editx-btn editx-btnGhost"
            type="button"
            onClick={() => setOpenHeader((v) => !v)}
            title="Mostrar/Ocultar datos del comprobante"
            disabled={submitting}
          >
            {openHeader ? "Ocultar datos" : "Mostrar datos"}
          </button>
        </div>
      </div>

      {/* ✅ Banner simple (no rompe tu CSS actual) */}
      {msg?.text && (
        <div
          style={{
            margin: "12px 0 14px",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              msg.type === "error"
                ? "rgba(255, 82, 82, 0.10)"
                : msg.type === "warn"
                ? "rgba(255, 190, 92, 0.10)"
                : msg.type === "ok"
                ? "rgba(78, 220, 160, 0.10)"
                : "rgba(120, 180, 255, 0.08)",
          }}
          role="alert"
          aria-live="polite"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ opacity: 0.92, fontWeight: 700, fontSize: 13 }}>{msg.text}</div>
            <button
              type="button"
              onClick={clearBanner}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
              }}
              aria-label="Cerrar mensaje"
              disabled={submitting}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(8, 18, 32, 0.92)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 14, opacity: 0.95, marginBottom: 6 }}>¿Eliminar línea contable?</div>
            <div style={{ opacity: 0.78, fontSize: 13, marginBottom: 14 }}>
              Esta acción quitará la línea del detalle. Puedes volver a agregarla después si lo necesitas.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="editx-btn editx-btnGhost" type="button" onClick={cancelDelete} disabled={submitting}>
                Cancelar
              </button>
              <button
                className="editx-btn editx-btnPrimary"
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                style={{ background: "rgba(255, 82, 82, 0.22)" }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Datos del comprobante (colapsable) */}
      <section className="editx-panel">
        <button type="button" className="editx-panelHead" onClick={() => setOpenHeader((v) => !v)} disabled={submitting}>
          <div className="editx-panelHeadLeft">
            <span className="editx-panelTitle">Datos del comprobante</span>
            <span className="editx-panelDesc">
              {tipo} · {fecha} · #{nComprobante}
            </span>
          </div>
          <span className="editx-panelChevron">{openHeader ? "▾" : "▸"}</span>
        </button>

        {openHeader && (
          <div className="editx-panelBody">
            <div className="editx-grid3">
              <div className="editx-field">
                <label className="editx-label">Tipo de comprobante</label>
                <select
                  className="editx-input"
                  value={tipo}
                  onChange={(e) => {
                    clearBanner();
                    setTipo(e.target.value);
                    setTouched(true);
                  }}
                  disabled={editDisabled}
                >
                  <option>Ingreso</option>
                  <option>Egreso</option>
                  <option>Traspaso</option>
                </select>
              </div>

              <div className="editx-field">
                <label className="editx-label">Emisión</label>
                <input
                  type="date"
                  className="editx-input"
                  value={fecha}
                  onChange={(e) => {
                    clearBanner();
                    setFecha(e.target.value);
                    setTouched(true);
                  }}
                  disabled={editDisabled}
                />
              </div>

              <div className="editx-field">
                <label className="editx-label">N° Comprobante</label>
                <input
                  className="editx-input"
                  value={nComprobante}
                  onChange={(e) => {
                    clearBanner();
                    setNComprobante(e.target.value);
                    setTouched(true);
                  }}
                  disabled={editDisabled}
                />
              </div>
            </div>

            <div className="editx-field">
              <label className="editx-label">Glosa</label>
              <input className="editx-input" value={glosa} onChange={(e) => onChangeGlosa(e.target.value)} disabled={editDisabled} />
            </div>

            <div className="editx-inline">
              <label className="editx-check">
                <input type="checkbox" checked={repetirGlosa} onChange={(e) => onToggleRepetir(e.target.checked)} disabled={editDisabled} />
                <span>Repetir glosa en detalle</span>
              </label>

              <span className="editx-hint">Aplica la glosa del encabezado a todas las líneas.</span>
            </div>
          </div>
        )}
      </section>

      {/* Detalle contable */}
      <section className="editx-panel">
        <div className="editx-panelHeadStatic">
          <div>
            <div className="editx-panelTitle">Detalle contable</div>
            <div className="editx-panelDesc">Edita líneas. No se permite Debe y Haber en la misma línea.</div>
          </div>

          <button className="editx-btn editx-btnPrimary" type="button" onClick={addLinea} disabled={submitting || loading}>
            + Agregar línea contable
          </button>
        </div>

        <div className="editx-tableWrap">
          <table className="editx-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Cuenta</th>
                <th style={{ width: 160 }}>Centro de costo</th>
                <th>Glosa</th>
                <th style={{ width: 140 }} className="r">
                  Debe
                </th>
                <th style={{ width: 140 }} className="r">
                  Haber
                </th>
                <th style={{ width: 80 }} className="c">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {lineas.map((l) => {
                const hasDebe = Number(l.debe || 0) > 0;
                const hasHaber = Number(l.haber || 0) > 0;

                return (
                  <tr key={l.id} className="editx-row">
                    <td>
                      <input
                        className="editx-input editx-inputSm mono"
                        value={l.cuenta}
                        onChange={(e) => setLinea(l.id, { cuenta: e.target.value })}
                        placeholder="1101-01"
                        disabled={editDisabled}
                      />
                    </td>

                    <td>
                      <input
                        className="editx-input editx-inputSm"
                        value={l.ccosto}
                        onChange={(e) => setLinea(l.id, { ccosto: e.target.value })}
                        placeholder="Opcional"
                        disabled={editDisabled}
                      />
                    </td>

                    <td>
                      <input
                        className="editx-input editx-inputSm"
                        value={l.glosaDet}
                        onChange={(e) => setLinea(l.id, { glosaDet: e.target.value })}
                        placeholder="Glosa línea"
                        disabled={editDisabled}
                      />
                    </td>

                    <td className="r">
                      <input
                        className="editx-input editx-inputSm mono r"
                        value={l.debe === "" ? "" : money(l.debe)}
                        onChange={(e) => onChangeDebe(l.id, e.target.value)}
                        placeholder="0"
                        disabled={editDisabled || hasHaber}
                        title={hasHaber ? "No puedes ingresar Debe si ya hay Haber en la línea" : ""}
                      />
                    </td>

                    <td className="r">
                      <input
                        className="editx-input editx-inputSm mono r"
                        value={l.haber === "" ? "" : money(l.haber)}
                        onChange={(e) => onChangeHaber(l.id, e.target.value)}
                        placeholder="0"
                        disabled={editDisabled || hasDebe}
                        title={hasDebe ? "No puedes ingresar Haber si ya hay Debe en la línea" : ""}
                      />
                    </td>

                    <td className="c">
                      <button
                        type="button"
                        className="editx-iconBtn editx-danger"
                        title={!isEditing ? "Presiona Editar para eliminar" : "Eliminar línea"}
                        onClick={() => deleteLinea(l.id)}
                        disabled={submitting || loading || lineas.length <= 1}
                      >
                        <span className="editx-trash">🗑</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales sticky */}
        <div className={`editx-totals ${totals.ok ? "ok" : "warn"}`}>
          <div className="editx-totalsLeft">
            {totals.ok ? "✅ Cuadra" : "❌ No cuadra"}
            {!totals.ok && <span className="editx-totalsHint">Debe = Haber para guardar</span>}
          </div>

          <div className="editx-totalsRight">
            <div className="editx-totalBox">
              <div className="k">Total Debe</div>
              <div className="v mono">$ {money(totals.tDebe)}</div>
            </div>
            <div className="editx-totalBox">
              <div className="k">Total Haber</div>
              <div className="v mono">$ {money(totals.tHaber)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Adjuntos */}
      <section className="editx-panel">
        <div className="editx-panelHeadStatic">
          <div>
            <div className="editx-panelTitle">Documento adjunto</div>
            <div className="editx-panelDesc">PDF máximo 4 MB</div>
          </div>
        </div>

        <div className="editx-attach">
          <label className="editx-attachBtn" style={{ opacity: editDisabled ? 0.7 : 1, cursor: editDisabled ? "not-allowed" : "pointer" }}>
            📎 Seleccionar archivo
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                clearBanner();
                if (!isEditing) {
                  setBanner("info", "Presiona “Editar” para adjuntar un archivo.");
                  e.target.value = "";
                  return;
                }
                const f = e.target.files?.[0] ?? null;
                const v = validateAdjunto(f);
                if (!v.ok) {
                  setAdjunto(null);
                  setBanner("error", v.msg);
                  return;
                }
                setAdjunto(f);
                setTouched(true);
              }}
              disabled={editDisabled}
            />
          </label>

          <div className="editx-attachInfo">
            {adjunto ? (
              <>
                <span className="name">{adjunto.name}</span>
                <span className="meta">({Math.round(adjunto.size / 1024)} KB)</span>
              </>
            ) : (
              <span className="muted">Sin archivo adjunto</span>
            )}
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="editx-actions">
        <div className="editx-leftNote">
          {loading ? "Cargando..." : touched ? "Cambios sin guardar" : "Sin cambios"}
        </div>

        <div className="editx-rightActions">
          <button className="editx-btn editx-btnGhost" type="button" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>

          <button
            className="editx-btn editx-btnGhost"
            type="button"
            onClick={() => onSave(true)}
            disabled={!canSave}
            title={!canSave ? (!isEditing ? "Presiona Editar para modificar" : "Requiere cambios y que Debe = Haber") : "Guardar y seguir editando"}
          >
            {submitting ? "Guardando..." : "Guardar y continuar"}
          </button>

          <button
            className="editx-btn editx-btnPrimary"
            type="button"
            onClick={() => onSave(false)}
            disabled={!canSave}
            title={!canSave ? (!isEditing ? "Presiona Editar para modificar" : "Requiere cambios y que Debe = Haber") : "Guardar cambios"}
          >
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

