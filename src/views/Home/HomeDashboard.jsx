"use client";

import "./home-dashboard.css";
import { useMemo, useState } from "react";
import { usePeriodo } from "@/context/PeriodoContext";

function monthLabel(ym) {
  if (!ym || !String(ym).includes("-")) return "—";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return "—";
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(d);
}

function moneyCL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CL");
}

export default function HomeDashboard() {
  const { periodo } = usePeriodo(); // "YYYY-MM"
  const [tab, setTab] = useState("Compras");

  const indicadores = useMemo(
    () => [
      { k: "UTM", v: "$ 69.611" },
      { k: "UF", v: "$ 39.728,28" },
      { k: "UTA", v: "$ 835.332" },
      { k: "DÓLAR", v: "$ 862,91" },
      { k: "EURO", v: "$ 1.022,41" },
    ],
    []
  );

  const certs = useMemo(
    () => [
      {
        title: "Ingreso mínimo mensual",
        value: "$ 539.000",
        sub: "Vigente desde 01-01-2026",
        tone: "warn",
        badge: "Info",
      },
      {
        title: "Certificado de firma",
        value: "810 días",
        sub: "Vigencia hasta 07-05-2028",
        tone: "ok",
        badge: "Vigente",
      },
      {
        title: "Declaración jurada",
        value: "Obtenida",
        sub: "Última actualización: 01-02-2026",
        tone: "info",
        badge: "OK",
      },
    ],
    []
  );

  const flujos = useMemo(
    () => [
      { name: "Caja", amount: 0 },
      { name: "Caja chica", amount: 0 },
      { name: "Banco Chile", amount: 0 },
      { name: "Banco Estado", amount: 0 },
      { name: "Oficinas", amount: 0 },
      { name: "Instalaciones", amount: 0 },
      { name: "Pozos", amount: 0 },
      { name: "Maquinarias", amount: 0 },
      { name: "Software", amount: 0 },
      { name: "Equipos industriales", amount: 0 },
      { name: "Otras maquinarias y equipos", amount: 0 },
    ],
    []
  );

  const years = useMemo(() => [2026, 2025, 2024, 2023, 2022, 2021, 2020], []);
  const months = useMemo(
    () => ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    []
  );

  const f29 = useMemo(() => {
    const map = {};
    for (const y of years) {
      map[y] = months.map((_, idx) => {
        const isBad = (y === 2025 && idx === 2) || (y === 2024 && idx === 4);
        const isEmpty = y === 2026 && idx > 1;
        if (isEmpty) return "empty";
        return isBad ? "bad" : "ok";
      });
    }
    return map;
  }, [years, months]);

  const pendientes = useMemo(() => {
    const base = {
      Compras: [
        { doc: "THC CHILE S.A.", ref: "FEA 122697", venc: "16-06-2023", monto: 85757 },
        { doc: "THC CHILE S.A.", ref: "FEA 135140", venc: "01-03-2024", monto: 1256407 },
        { doc: "THC CHILE S.A.", ref: "FEA 135141", venc: "01-03-2024", monto: 180594 },
        { doc: "THC CHILE S.A.", ref: "FEA 135142", venc: "01-03-2024", monto: 42753 },
      ],
      Ventas: [
        { doc: "Cliente X", ref: "FVE 90011", venc: "10-02-2026", monto: 209900 },
        { doc: "Cliente Y", ref: "FVE 90012", venc: "14-02-2026", monto: 98750 },
      ],
      Honorarios: [{ doc: "Prestador Z", ref: "BH 3001", venc: "28-02-2026", monto: 160000 }],
    };
    return base[tab] ?? [];
  }, [tab]);

  return (
    <div className="hd-page">
      <div className="hd-head">
        <div>
          <h1 className="hd-title">Iniciafacil</h1>
          <p className="hd-subtitle">
            Panel de control · Período activo: <span className="hd-pill">{monthLabel(periodo)}</span>
          </p>
        </div>
      </div>

      <div className="hd-grid">
        {/* Row 1 */}
        <section className="hd-card hd-banner">
          <div className="hd-cardHead">
            <div className="hd-cardTitle">Novedades SII</div>
            <span className="hd-tag">SII</span>
          </div>

          <div className="hd-bannerBody">
            <div className="hd-alert">
              <div className="hd-alertIcon">📰</div>
              <div>
                <p className="hd-alertTitle">Actualizaciones del período</p>
                <div className="hd-alertDesc">
                  Prórrogas y comunicados relevantes del SII para el mes seleccionado. (Luego lo conectas a backend/RSS)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hd-card hd-indicadores">
          <div className="hd-cardHead">
            <div className="hd-cardTitle">Indicadores económicos</div>
            <span className="hd-muted">Actualizable por backend</span>
          </div>

          <div className="hd-indBody">
            {indicadores.map((it) => (
              <div className="hd-chip" key={it.k}>
                <div className="hd-chipK">{it.k}</div>
                <div className="hd-chipV mono">{it.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Row 2 */}
        <div className="hd-kpiRow">
          {certs.map((c) => (
            <section key={c.title} className={`hd-kpi hd-kpi-${c.tone}`}>
              <div className="hd-kpiTop">
                <div className="hd-kpiT">{c.title}</div>
                <span className="hd-kpiBadge">{c.badge}</span>
              </div>
              <div className="hd-kpiV">{c.value}</div>
              <div className="hd-kpiS">{c.sub}</div>
            </section>
          ))}
        </div>

        {/* Row 3 */}
        <section className="hd-card hd-flujos">
          <div className="hd-cardHead">
            <div className="hd-cardTitle">Flujos</div>
            <span className="hd-muted">Período: {monthLabel(periodo)}</span>
          </div>

          <div className="hd-bodyPad">
            {flujos.map((f) => (
              <div key={f.name} className="hd-row">
                <div className="hd-rowL">{f.name}</div>
                <div className="hd-rowR mono">$ {moneyCL(f.amount)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="hd-card hd-f29card">
          <div className="hd-cardHead">
            <div className="hd-cardTitle">Formulario 29</div>

            <div className="hd-miniRight">
              <div className="hd-legend" aria-label="Leyenda">
                <span className="hd-legendItem"><span className="dot ok" /> Enviado</span>
                <span className="hd-legendItem"><span className="dot bad" /> Observación</span>
                <span className="hd-legendItem"><span className="dot empty" /> Pendiente</span>
              </div>
            </div>
          </div>

          {/* ✅ sin scroll vertical interno: solo overflow-x si el monitor es muy chico */}
          <div className="hd-f29Wrap noY">
            <table className="hd-f29">
              <thead>
                <tr>
                  <th className="hd-thMonth">Mes</th>
                  {years.map((y) => (
                    <th key={y} className="c hd-thYear">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((m, idx) => (
                  <tr key={m}>
                    <td className="hd-f29Month">{m}</td>
                    {years.map((y) => {
                      const st = f29[y][idx];
                      return (
                        <td key={`${y}-${m}`} className="c">
                          {st === "ok" ? <span className="dot ok" /> : st === "bad" ? <span className="dot bad" /> : <span className="dot empty" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hd-footHint">
            *En producción: aquí puedes mostrar estado real de F29 por mes/año (enviado, observado, pendiente) y link al detalle.
          </div>
        </section>

        {/* Row 4 */}
        <section className="hd-card hd-pend">
          <div className="hd-cardHead">
            <div className="hd-cardTitle">Pagos y cobros pendientes</div>

            <div className="hd-tabs" role="tablist" aria-label="Pendientes">
              {["Compras", "Ventas", "Honorarios"].map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`hd-tab ${tab === k ? "active" : ""}`}
                  onClick={() => setTab(k)}
                  role="tab"
                  aria-selected={tab === k}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ sin scroll vertical interno */}
          <div className="hd-tableWrap noY">
            <table className="hd-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Referencia</th>
                  <th>Vencimiento</th>
                  <th className="r">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((p, i) => (
                  <tr key={i}>
                    <td>{p.doc}</td>
                    <td className="mono">{p.ref}</td>
                    <td className="mono">{p.venc}</td>
                    <td className="r mono">$ {moneyCL(p.monto)}</td>
                  </tr>
                ))}

                {pendientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="hd-empty">Sin registros en esta pestaña.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}


