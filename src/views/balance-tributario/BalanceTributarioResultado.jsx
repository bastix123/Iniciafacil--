"use client";

import "./balance-tributario-resultado.css";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function fmtCL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CL");
}

function fmtMonthLabelFromRange(desde) {
  if (!desde || !desde.includes("-")) return "—";
  const [y, m] = desde.split("-").map((x) => Number(x));
  const d = new Date(y, (m || 1) - 1, 1);
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(d);
}


function buildMock({ showCode }) {
  const rows = [
    { cuenta: "1", nombre: "Activo", sumasD: 26675, sumasC: 24675, saldosD: 3299, saldosA: 1427, act: 3299, pas: 1427 },
    { cuenta: "2", nombre: "Pasivo", sumasD: 8367, sumasC: 8866, saldosD: 0, saldosA: 518, act: 0, pas: 518 },
    { cuenta: "4", nombre: "Resultados / pérdidas", sumasD: 9823, sumasC: 5370, saldosD: 9817, saldosA: 0, act: 0, pas: 0 },
    { cuenta: "5", nombre: "Resultados / ganancias", sumasD: 6050, sumasC: 17221, saldosD: 2941, saldosA: 14112, act: 3299, pas: 14112 },
  ];

  const totals = rows.reduce(
    (a, r) => ({
      sumasD: a.sumasD + r.sumasD,
      sumasC: a.sumasC + r.sumasC,
      saldosD: a.saldosD + r.saldosD,
      saldosA: a.saldosA + r.saldosA,
      act: a.act + r.act,
      pas: a.pas + r.pas,
    }),
    { sumasD: 0, sumasC: 0, saldosD: 0, saldosA: 0, act: 0, pas: 0 }
  );

  const resultadoEjercicio = {
    label: "Totales",
    ...totals,
  };

  const displayCuenta = (r) => (showCode ? `${r.cuenta}  ${r.nombre}` : r.nombre);

  return { rows, totals, resultadoEjercicio, displayCuenta };
}

export default function BalanceTributarioResultado() {
  const router = useRouter();
  const sp = useSearchParams();

  const desde = sp.get("desde") || "2026-01-01";
  const hasta = sp.get("hasta") || "2026-01-31";
  const periodo = sp.get("periodo") || ""; // yyyy-mm (si viene)
  const nivel = Number(sp.get("nivel") || 4);
  const showCode = (sp.get("showCode") || "1") === "1";
  const salida = (sp.get("salida") || "preview").toLowerCase(); // preview|pdf|excel

  const salidaLabel = useMemo(() => {
    if (salida === "pdf") return "PDF";
    if (salida === "excel") return "Excel";
    return "Vista previa";
  }, [salida]);

  const periodoLabel = useMemo(() => {
    if (periodo) {
      const [y, m] = periodo.split("-").map((x) => Number(x));
      const d = new Date(y, (m || 1) - 1, 1);
      return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(d);
    }
    return fmtMonthLabelFromRange(desde);
  }, [periodo, desde]);

  const data = useMemo(() => buildMock({ showCode }), [showCode]);

  const meta = useMemo(() => {
    return {
      periodo: periodoLabel,
      rango: `${desde} → ${hasta}`,
      nivel: String(nivel),
      detalle: showCode ? "Sí" : "No",
      salida: salidaLabel,
    };
  }, [periodoLabel, desde, hasta, nivel, showCode, salidaLabel]);

  const onExport = () => {
    // Conectar a API real después
    alert(`Exportar ${salidaLabel} (pendiente)\n\nPeríodo: ${meta.periodo}\nRango: ${meta.rango}\nNivel: ${meta.nivel}\nDetalle: ${meta.detalle}`);
  };

  const exportDisabled = salida === "preview";

  return (
    <div className="btr-page">
      <div className="btr-breadcrumb">
        Informes contables <span className="sep">›</span> Balance tributario <span className="sep">›</span> Resultados
      </div>

      <div className="btr-panel">
        {/* Sticky context bar */}
        <div className="btr-sticky">
          <div className="btr-stickyLeft">
            <div className="btr-h1">Balance tributario</div>

            <div className="btr-metaRow">
              <span className="pill"><span className="k">Período</span> <span className="v">{meta.periodo}</span></span>
              <span className="pill"><span className="k">Rango</span> <span className="v mono">{meta.rango}</span></span>
              <span className="pill"><span className="k">Nivel</span> <span className="v">{meta.nivel}</span></span>
              <span className="pill"><span className="k">Detalle</span> <span className="v">{meta.detalle}</span></span>
              <span className="pill"><span className="k">Salida</span> <span className="v">{meta.salida}</span></span>
            </div>
          </div>

          <div className="btr-stickyRight">
            <button className="btr-btn btr-btnGhost" type="button" onClick={() => router.push("/contabilidad/balance-tributario")}>
              ← Volver a filtros
            </button>

            <button
              className="btr-btn btr-btnPrimary"
              type="button"
              onClick={exportDisabled ? () => alert("En Vista previa no se exporta. Cambia a PDF/Excel para exportar.") : onExport}
              disabled={exportDisabled}
              title={exportDisabled ? "Cambia salida a PDF o Excel para exportar" : "Exportar"}
            >
              Exportar {salidaLabel}
            </button>
          </div>
        </div>

        {/* Result card */}
        <div className="btr-card">
          <div className="btr-cardTitle">
            <span className="icon">📄</span>
            <span>Balance tributario</span>
          </div>

          <div className="btr-tableWrap">
            <table className="btr-table">
              <thead>
                <tr className="g1">
                  <th rowSpan={2} className="col-cuenta">Cuentas</th>
                  <th colSpan={2}>Sumas</th>
                  <th colSpan={2}>Saldos</th>
                  <th colSpan={2}>Inventario</th>
                  <th colSpan={2}>Resultado</th>
                </tr>

                <tr className="g2">
                  <th className="r col-num">Débitos</th>
                  <th className="r col-num">Créditos</th>
                  <th className="r col-num">Deudor</th>
                  <th className="r col-num">Acreedor</th>
                  <th className="r col-num">Activo</th>
                  <th className="r col-num">Pasivo</th>
                  <th className="r col-num">Pérdidas</th>
                  <th className="r col-num">Ganancias</th>
                </tr>
              </thead>

              <tbody>
                {data.rows.map((r, idx) => {
                  const perdidas = r.nombre.toLowerCase().includes("pérdidas") ? r.saldosD : 0;
                  const ganancias = r.nombre.toLowerCase().includes("ganancias") ? r.saldosA : 0;

                  return (
                    <tr key={idx}>
                      <td className="col-cuenta">
                        <span className="cuenta">{data.displayCuenta(r)}</span>
                      </td>

                      <td className="r mono">{fmtCL(r.sumasD)}</td>
                      <td className="r mono">{fmtCL(r.sumasC)}</td>

                      <td className="r mono">{fmtCL(r.saldosD)}</td>
                      <td className="r mono">{fmtCL(r.saldosA)}</td>

                      <td className="r mono">{fmtCL(r.act)}</td>
                      <td className="r mono">{fmtCL(r.pas)}</td>

                      <td className="r mono">{fmtCL(perdidas)}</td>
                      <td className="r mono">{fmtCL(ganancias)}</td>
                    </tr>
                  );
                })}

                {/* Totales */}
                <tr className="btr-total">
                  <td className="col-cuenta"><strong>Sumas</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.sumasD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.sumasC)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.saldosD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.saldosA)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.act)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.pas)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.saldosD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.totals.saldosA)}</strong></td>
                </tr>

                <tr className="btr-section">
                  <td colSpan={9}>RESULTADO DEL EJERCICIO</td>
                </tr>

                <tr className="btr-total2">
                  <td className="col-cuenta"><strong>{data.resultadoEjercicio.label}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.sumasD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.sumasC)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.saldosD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.saldosA)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.act)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.pas)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.saldosD)}</strong></td>
                  <td className="r mono"><strong>{fmtCL(data.resultadoEjercicio.saldosA)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="btr-bottomActions">
            <button className="btr-btn btr-btnGhost" type="button" onClick={() => router.push("/contabilidad/balance-tributario")}>
              ← Volver a generar balance
            </button>

            <button className="btr-btn btr-btnPrimary" type="button" onClick={onExport} disabled={exportDisabled}>
              Exportar {salidaLabel}
            </button>
          </div>

          <div className="btr-footNote">
            Contexto: <strong>{meta.periodo}</strong> · Nivel <strong>{meta.nivel}</strong> · Detalle <strong>{meta.detalle}</strong> · Salida{" "}
            <strong>{meta.salida}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
