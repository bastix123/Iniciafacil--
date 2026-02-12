"use client";

import "./editar-transaccion.css";
import { useMemo, useState } from "react";
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
  const [glosa, setGlosa] = useState(
    "TRANSFERENCIA BANCOESTADO DE MALHUE ARANDA ERIKA DE LAS MERCEDES"
  );
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

  const applyGlosaToDetalle = (newGlosa) => {
    setLineas((prev) =>
      prev.map((l) => ({
        ...l,
        glosaDet: newGlosa,
      }))
    );
  };

  const onChangeGlosa = (v) => {
    setGlosa(v);
    setTouched(true);
    if (repetirGlosa) applyGlosaToDetalle(v);
  };

  const onToggleRepetir = (v) => {
    setRepetirGlosa(v);
    setTouched(true);
    if (v) applyGlosaToDetalle(glosa);
  };

  const setLinea = (lineId, patch) => {
    setLineas((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
    setTouched(true);
  };

  const addLinea = () => {
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
    setLineas((prev) => prev.filter((l) => l.id !== lineId));
    setTouched(true);
  };

  // Reglas contables: no permitir debe y haber a la vez en una línea
  const onChangeDebe = (lineId, raw) => {
    const v = parseMoney(raw);
    setLinea(lineId, { debe: v, haber: v ? "" : "" });
  };

  const onChangeHaber = (lineId, raw) => {
    const v = parseMoney(raw);
    setLinea(lineId, { haber: v, debe: v ? "" : "" });
  };

  const totals = useMemo(() => {
    const tDebe = lineas.reduce((acc, l) => acc + Number(l.debe || 0), 0);
    const tHaber = lineas.reduce((acc, l) => acc + Number(l.haber || 0), 0);
    const ok = tDebe === tHaber && tDebe > 0;
    return { tDebe, tHaber, ok };
  }, [lineas]);

  const canSave = totals.ok && touched;

  const onCancel = () => backToList();

  const onSave = (continueEditing = false) => {
    if (!totals.ok) return;

    // Aquí conectas a tu API real:
    // payload: { tipo, fecha, nComprobante, glosa, repetirGlosa, lineas, adjunto }
    alert("Guardar (pendiente)");

    setTouched(false);
    if (!continueEditing) backToList();
  };

  // ---------- Adjuntos ----------
  const [adjunto, setAdjunto] = useState(null);

  return (
    <div className="editx-page">
      {/* Header contextual */}
      <div className="editx-top">
        <button className="editx-back" type="button" onClick={backToList}>
          ← Volver
        </button>

        <div className="editx-titleWrap">
          <h1 className="editx-title">Editar transacción #{txId}</h1>
          <div className="editx-sub">
            <span className="editx-chip">{tipo}</span>
            <span className="editx-chip">Emisión: {fecha}</span>
            <span className={`editx-chip ${totals.ok ? "ok" : "warn"}`}>
              {totals.ok ? "Cuadra" : "No cuadra"}
            </span>
          </div>
        </div>

        <div className="editx-right">
          <button
            className="editx-btn editx-btnGhost"
            type="button"
            onClick={() => setOpenHeader((v) => !v)}
            title="Mostrar/Ocultar datos del comprobante"
          >
            {openHeader ? "Ocultar datos" : "Mostrar datos"}
          </button>
        </div>
      </div>

      {/* Datos del comprobante (colapsable) */}
      <section className="editx-panel">
        <button
          type="button"
          className="editx-panelHead"
          onClick={() => setOpenHeader((v) => !v)}
        >
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
                    setTipo(e.target.value);
                    setTouched(true);
                  }}
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
                    setFecha(e.target.value);
                    setTouched(true);
                  }}
                />
              </div>

              <div className="editx-field">
                <label className="editx-label">N° Comprobante</label>
                <input
                  className="editx-input"
                  value={nComprobante}
                  onChange={(e) => {
                    setNComprobante(e.target.value);
                    setTouched(true);
                  }}
                />
              </div>
            </div>

            <div className="editx-field">
              <label className="editx-label">Glosa</label>
              <input
                className="editx-input"
                value={glosa}
                onChange={(e) => onChangeGlosa(e.target.value)}
              />
            </div>

            <div className="editx-inline">
              <label className="editx-check">
                <input
                  type="checkbox"
                  checked={repetirGlosa}
                  onChange={(e) => onToggleRepetir(e.target.checked)}
                />
                <span>Repetir glosa en detalle</span>
              </label>

              <span className="editx-hint">
                Aplica la glosa del encabezado a todas las líneas.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Detalle contable */}
      <section className="editx-panel">
        <div className="editx-panelHeadStatic">
          <div>
            <div className="editx-panelTitle">Detalle contable</div>
            <div className="editx-panelDesc">
              Edita líneas. No se permite Debe y Haber en la misma línea.
            </div>
          </div>

          <button
            className="editx-btn editx-btnPrimary"
            type="button"
            onClick={addLinea}
          >
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
              {lineas.map((l) => (
                <tr key={l.id} className="editx-row">
                  <td>
                    <input
                      className="editx-input editx-inputSm mono"
                      value={l.cuenta}
                      onChange={(e) => setLinea(l.id, { cuenta: e.target.value })}
                      placeholder="1101-01"
                    />
                  </td>

                  <td>
                    <input
                      className="editx-input editx-inputSm"
                      value={l.ccosto}
                      onChange={(e) => setLinea(l.id, { ccosto: e.target.value })}
                      placeholder="Opcional"
                    />
                  </td>

                  <td>
                    <input
                      className="editx-input editx-inputSm"
                      value={l.glosaDet}
                      onChange={(e) => setLinea(l.id, { glosaDet: e.target.value })}
                      placeholder="Glosa línea"
                    />
                  </td>

                  <td className="r">
                    <input
                      className="editx-input editx-inputSm mono r"
                      value={l.debe === "" ? "" : money(l.debe)}
                      onChange={(e) => onChangeDebe(l.id, e.target.value)}
                      placeholder="0"
                    />
                  </td>

                  <td className="r">
                    <input
                      className="editx-input editx-inputSm mono r"
                      value={l.haber === "" ? "" : money(l.haber)}
                      onChange={(e) => onChangeHaber(l.id, e.target.value)}
                      placeholder="0"
                    />
                  </td>

                  <td className="c">
                    <button
                      type="button"
                      className="editx-iconBtn editx-danger"
                      title="Eliminar línea"
                      onClick={() => deleteLinea(l.id)}
                      disabled={lineas.length <= 1}
                    >
                      <span className="editx-trash">🗑</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales sticky */}
        <div className={`editx-totals ${totals.ok ? "ok" : "warn"}`}>
          <div className="editx-totalsLeft">
            {totals.ok ? "✅ Cuadra" : "❌ No cuadra"}
            {!totals.ok && (
              <span className="editx-totalsHint">Debe = Haber para guardar</span>
            )}
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
          <label className="editx-attachBtn">
            📎 Seleccionar archivo
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setAdjunto(e.target.files?.[0] ?? null);
                setTouched(true);
              }}
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
          {touched ? "Cambios sin guardar" : "Sin cambios"}
        </div>

        <div className="editx-rightActions">
          <button className="editx-btn editx-btnGhost" type="button" onClick={onCancel}>
            Cancelar
          </button>

          <button
            className="editx-btn editx-btnGhost"
            type="button"
            onClick={() => onSave(true)}
            disabled={!canSave}
            title={!canSave ? "Requiere cambios y que Debe = Haber" : "Guardar y seguir editando"}
          >
            Guardar y continuar
          </button>

          <button
            className="editx-btn editx-btnPrimary"
            type="button"
            onClick={() => onSave(false)}
            disabled={!canSave}
            title={!canSave ? "Requiere cambios y que Debe = Haber" : "Guardar cambios"}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
