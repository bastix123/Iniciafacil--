"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar({ open, onClose }) {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Tree con íconos (Bootstrap Icons)
  const tree = useMemo(
    () => [
      { key: "inicio_contexto", label: "INICIO Y CONTEXTO", icon: "bi-house" },
      {
        key: "operacion_diaria",
        label: "OPERACIÓN DIARIA",
        icon: "bi-speedometer2",
      },
      {
        key: "registros_carga",
        label: "REGISTROS & CARGA MASIVA",
        icon: "bi-upload",
      },

      {
        key: "control_conciliacion",
        label: "CONTROL, CONCILIACIÓN Y CIERRES",
        icon: "bi-check2-square",
        children: [
          {
            key: "transacciones",
            label: "Transacciones",
            icon: "bi-arrow-left-right",
            path: "/transacciones",
          },
        ],
      },

      {
        key: "informe_analisis",
        label: "INFORME & ANÁLISIS",
        icon: "bi-graph-up",
        children: [
          {
            key: "libro_mayor",
            label: "Libro mayor",
            icon: "bi-journal-bookmark",
            path: "/contabilidad/libro-mayor",
          },
          {
            key: "balance_tributario",
            label: "Balance tributario",
            icon: "bi-clipboard-data",
            path: "/contabilidad/balance-tributario",
          },

          
          {
            key: "resumen_compra_venta",
            label: "Resumen compra/venta",
            icon: "bi-receipt",
            path: "/contabilidad/compra-venta",
          },
        ],
      },

      {
        key: "config_estructura",
        label: "CONFIGURACIÓN & ESTRUCTURA",
        icon: "bi-gear",
        children: [
          {
            key: "empresa",
            label: "Empresa",
            icon: "bi-building",
            children: [
              {
                key: "empresa_datos",
                label: "Datos Empresa",
                icon: "bi-file-earmark-text",
                path: "/datos-empresa",
              },
              {
                key: "empresa_sucursales",
                label: "Sucursales",
                icon: "bi-diagram-3",
              },
              {
                key: "empresa_usuarios",
                label: "Usuarios",
                icon: "bi-people",
              },
            ],
          },

          {
            key: "contabilidad",
            label: "Contabilidad",
            icon: "bi-calculator",
            children: [
              {
                key: "cta_plan",
                label: "Plan de cuentas",
                icon: "bi-journal-text",
                path: "/contabilidad/plan-de-cuentas",
              },
              {
                key: "cta_asientos",
                label: "Asientos",
                icon: "bi-receipt",
              },
              {
                key: "cta_centros",
                label: "Centros de costo",
                icon: "bi-bullseye",
              },
            ],
          },
        ],
      },
    ],
    []
  );

  const [openKeys, setOpenKeys] = useState({});

  
  useEffect(() => {
    setOpenKeys({});
  }, [pathname]);

  
  useEffect(() => {
    if (!open) setOpenKeys({});
  }, [open]);

  const toggle = (key, level) => {
    setOpenKeys((prev) => {
      const id = `L${level}:${key}`;
      const willOpen = !prev[id];
      const next = { ...prev };

      Object.keys(next).forEach((k) => {
        if (k.startsWith(`L${level}:`)) delete next[k];
      });

      if (willOpen) next[id] = true;
      return next;
    });
  };

  const go = (path) => {
    if (!path) return;
    router.push(path);
    onClose?.();
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-dot" />
            <strong>INICIAFACIL</strong>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <TreeList
            nodes={tree}
            level={1}
            openKeys={openKeys}
            toggle={toggle}
            onNavigate={go}
          />
        </nav>
      </aside>
    </>
  );
}

function TreeList({ nodes, level, openKeys, toggle, onNavigate }) {
  return (
    <div className={`tree tree-level-${level}`}>
      {nodes.map((node) => {
        const hasChildren = !!node.children?.length;
        const keyId = `L${level}:${node.key}`;
        const isOpen = !!openKeys[keyId];

        return (
          <div className="tree-node" key={node.key}>
            <button
              type="button"
              className={`tree-btn level-${level}`}
              onClick={() => {
                if (hasChildren) toggle(node.key, level);
                else if (node.path) onNavigate(node.path);
              }}
            >
              <span className="tree-label-wrap">
                {node.icon ? (
                  <i className={`bi ${node.icon} tree-icon`} aria-hidden="true" />
                ) : (
                  <span className="tree-icon" aria-hidden="true" />
                )}
                <span className="tree-label">{node.label}</span>
              </span>

              {hasChildren ? (
                <span className="tree-chev" aria-hidden="true">
                  <i className={`bi bi-chevron-down ${isOpen ? "open" : ""}`} />
                </span>
              ) : (
                <span className="tree-chev-placeholder" />
              )}
            </button>

            {hasChildren && isOpen && (
              <TreeList
                nodes={node.children}
                level={level + 1}
                openKeys={openKeys}
                toggle={toggle}
                onNavigate={onNavigate}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

