"use client";

import { useMemo, useState, useEffect } from "react";
import "./plan-de-cuentas.css";

const MOCK = [
  { id: "root", parentId: null, codigo: "", nombre: "Plan de Cuentas", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },

  { id: "1", parentId: "root", codigo: "1", nombre: "Activos", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "11", parentId: "1", codigo: "11", nombre: "Activo circulante", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "1101", parentId: "11", codigo: "1101", nombre: "Disponible", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "1101-01", parentId: "1101", codigo: "1101-01", nombre: "Caja", tipoUso: "Imputable", estado: "Vigente", origen: "SII" },
  { id: "1101-02", parentId: "1101", codigo: "1101-02", nombre: "Caja chica", tipoUso: "Imputable", estado: "Vigente", origen: "Personalizada" },

  { id: "2", parentId: "root", codigo: "2", nombre: "Pasivos", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "21", parentId: "2", codigo: "21", nombre: "Pasivo circulante", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },

  { id: "4", parentId: "root", codigo: "4", nombre: "Resultados / Pérdidas", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "41", parentId: "4", codigo: "41", nombre: "Costo de explotación", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },

  { id: "5", parentId: "root", codigo: "5", nombre: "Resultados / Ganancias", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
  { id: "51", parentId: "5", codigo: "51", nombre: "Resultado operacional", tipoUso: "Agrupadora", estado: "Vigente", origen: "SII" },
];

export default function PlanDeCuentas() {
  const [items, setItems] = useState(MOCK);

  //Selección (no “cambia de vista”, solo selecciona)
  const [currentId, setCurrentId] = useState("1101"); // "Disponible"

  // Filtros
  const [q, setQ] = useState("");
  const [clase, setClase] = useState("Todas");
  const [nivel, setNivel] = useState("Todos");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  // Expansión de la tabla (árbol)
  const [expanded, setExpanded] = useState(() => new Set());

  const byId = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const childrenOf = (id) => items.filter((x) => x.parentId === id);
  const parentOf = (id) => byId.get(id)?.parentId ?? null;

  const hasChildren = (id) => childrenOf(id).length > 0;

  const getDepthFromRoot = (id) => {
    // root hijos = 1
    let d = 0;
    let cur = id;
    while (cur) {
      const p = parentOf(cur);
      if (!p) break;
      d += 1;
      cur = p;
    }
    return d;
  };

  const current = useMemo(
    () => items.find((x) => x.id === currentId) ?? items[0],
    [items, currentId]
  );

  const breadcrumb = useMemo(() => {
    const trail = [];
    let cur = current;
    while (cur) {
      trail.push(cur);
      const pid = cur.parentId;
      if (!pid) break;
      cur = items.find((x) => x.id === pid);
    }
    return trail.reverse();
  }, [currentId, items]);

  
  // Si estás dentro de Activos (o cualquier top-level), la tabla muestra ese árbol completo.
  const tableRootId = useMemo(() => {
    // subir hasta que el padre sea "root"
    let cur = currentId;
    if (cur === "root") return "root";
    while (cur) {
      const p = parentOf(cur);
      if (!p) return "root";
      if (p === "root") return cur;
      cur = p;
    }
    return "root";
  }, [currentId, byId]);

  useEffect(() => {
    const next = new Set(expanded);
    let cur = currentId;
    while (cur) {
      const p = parentOf(cur);
      if (!p) break;
      // expandimos el padre para que el hijo se vea
      next.add(p);
      cur = p;
    }

    // Además: si el root de tabla es top-level (ej 1 Activos), lo abrimos por defecto
    if (tableRootId && tableRootId !== "root") next.add(tableRootId);

    setExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, tableRootId]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ✅ Matching (filtros) + “mantener ancestros”
  const matchesFilters = (node) => {
    if (clase !== "Todas" && node.tipoUso !== clase) return false;

    if (nivel !== "Todos") {
      const wanted = Number(nivel);
      if (getDepthFromRoot(node.id) !== wanted) return false;
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      const ok =
        node.codigo.toLowerCase().includes(qq) ||
        node.nombre.toLowerCase().includes(qq);
      if (!ok) return false;
    }

    return true;
  };

  const subtreeHasMatch = (id, cache) => {
    if (cache.has(id)) return cache.get(id);
    const node = byId.get(id);
    if (!node) {
      cache.set(id, false);
      return false;
    }

    // Si este nodo matchea, OK
    if (matchesFilters(node)) {
      cache.set(id, true);
      return true;
    }

    // Si algún descendiente matchea, OK
    const kids = childrenOf(id);
    for (const k of kids) {
      if (subtreeHasMatch(k.id, cache)) {
        cache.set(id, true);
        return true;
      }
    }

    cache.set(id, false);
    return false;
  };

  const tableRows = useMemo(() => {
    const cache = new Map();

    const flatten = (id, level) => {
      const node = byId.get(id);
      if (!node) return [];

      // Siempre mostramos el root del árbol aunque no matchee (para contexto),
      // pero el resto se muestra si: matchea él o alguno de sus descendientes.
      const isRoot = id === tableRootId;
      const shouldShow = isRoot || subtreeHasMatch(id, cache);

      if (!shouldShow) return [];

      const rows = [{ node, level }];

      const kids = childrenOf(id).sort((a, b) => a.codigo.localeCompare(b.codigo));
      if (kids.length > 0 && expanded.has(id)) {
        for (const k of kids) {
          rows.push(...flatten(k.id, level + 1));
        }
      }

      return rows;
    };

    // Si tableRootId es root (muy arriba), mostramos top-levels (1,2,4,5) como “roots”
    if (tableRootId === "root") {
      const roots = childrenOf("root").sort((a, b) => a.codigo.localeCompare(b.codigo));
      let out = [];
      for (const r of roots) out = out.concat(flatten(r.id, 0));
      return out;
    }

    return flatten(tableRootId, 0);
  }, [items, q, clase, nivel, expanded, tableRootId, byId]);

  const handleRowSelect = (node) => {
    setCurrentId(node.id);
  };

  const handleCreate = ({ codigo, nombre, tipoUso }) => {
    const newItem = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      parentId: currentId,
      codigo,
      nombre,
      tipoUso,
      estado: "Vigente",
      origen: "Personalizada",
    };
    setItems((prev) => [...prev, newItem]);

    // Si creas en una agrupadora, dejamos expandido para ver la nueva hija
    if (currentId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(currentId);
        return next;
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="pc-page">
      <div className="pc-header-row">
        <div>
          <h1 className="pc-title">Plan de cuentas</h1>

          <div className="pc-breadcrumb">
            {breadcrumb.map((b, idx) => (
              <span key={b.id} className="pc-bc-item">
                <button
                  type="button"
                  className="pc-bc-btn"
                  onClick={() => setCurrentId(b.id)}
                >
                  {b.nombre}
                </button>
                {idx < breadcrumb.length - 1 && <span className="pc-sep">›</span>}
              </span>
            ))}
          </div>
        </div>

        <button className="pc-new-btn" type="button" onClick={() => setModalOpen(true)}>
          <i className="bi bi-plus-lg" /> Nueva Cuenta
        </button>
      </div>

      <div className="pc-filters">
        <div className="pc-search">
          <i className="bi bi-search pc-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código o nombre..."
          />
        </div>

        <div className="pc-select">
          <label>Clase:</label>
          <select value={clase} onChange={(e) => setClase(e.target.value)}>
            <option>Todas</option>
            <option>Agrupadora</option>
            <option>Imputable</option>
          </select>
        </div>

        <div className="pc-select">
          <label>Nivel:</label>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option>Todos</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
      </div>

      <div className="pc-layout">
        <div className="pc-panel pc-tree-panel">
          <PlanTree items={items} currentId={currentId} onSelect={setCurrentId} />
        </div>

        <div className="pc-panel pc-table-panel">
          <div className="pc-table-title">
            <i className="bi bi-list-nested" /> Plan de Cuentas
            {tableRootId !== "root" && (
              <span className="pc-tableHint">
                Mostrando árbol: <strong>{byId.get(tableRootId)?.codigo} {byId.get(tableRootId)?.nombre}</strong>
              </span>
            )}
          </div>

          <table className="pc-table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>Código</th>
                <th>Nombre de Cuenta</th>
                <th style={{ width: 160 }}>Tipo de uso</th>
                <th style={{ width: 140 }}>Estado</th>
                <th style={{ width: 160 }}>Origen</th>
              </tr>
            </thead>

            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pc-empty">Sin resultados</td>
                </tr>
              ) : (
                tableRows.map(({ node, level }) => {
                  const expandable = node.tipoUso === "Agrupadora" && hasChildren(node.id);
                  const isOpen = expanded.has(node.id);

                  return (
                    <tr
                      key={node.id}
                      className={`pc-row ${node.id === currentId ? "is-selected" : ""}`}
                      onClick={() => handleRowSelect(node)}
                    >
                      <td className="pc-code-cell">
                        <span className="pc-indent" style={{ width: level * 16 }} />

                        {expandable ? (
                          <button
                            type="button"
                            className="pc-expandBtn"
                            aria-label={isOpen ? "Colapsar" : "Expandir"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(node.id);
                            }}
                          >
                            <i className={`bi bi-chevron-${isOpen ? "down" : "right"}`} />
                          </button>
                        ) : (
                          <span className="pc-expandPlaceholder">
                            <span className="pc-dot" />
                          </span>
                        )}

                        <span className="pc-code-mono">{node.codigo}</span>
                      </td>

                      <td className={node.tipoUso === "Agrupadora" ? "pc-name-agg" : ""}>
                        {node.nombre}
                      </td>
                      <td>{node.tipoUso}</td>
                      <td>{node.estado}</td>
                      <td>{node.origen}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevaCuentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        parent={current}
        onCreate={handleCreate}
      />
    </div>
  );
}

function PlanTree({ items, currentId, onSelect }) {
  const byParent = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = it.parentId ?? "__root__";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.codigo.localeCompare(b.codigo));
      map.set(k, arr);
    }
    return map;
  }, [items]);

  const roots = byParent.get("root") ?? [];
  return (
    <div className="pc-tree">
      {roots.map((n) => (
        <TreeNode
          key={n.id}
          node={n}
          byParent={byParent}
          currentId={currentId}
          onSelect={onSelect}
          level={0}
        />
      ))}
    </div>
  );
}

function TreeNode({ node, byParent, currentId, onSelect, level }) {
  const kids = byParent.get(node.id) ?? [];
  const hasKids = kids.length > 0;

  const [open, setOpen] = useState(level < 1);

  return (
    <div>
      <button
        type="button"
        className={`pc-tree-row ${node.id === currentId ? "active" : ""}`}
        style={{ paddingLeft: 10 + level * 14 }}
        onClick={() => onSelect(node.id)}
      >
        <span className="pc-tree-left">
          {hasKids ? (
            <span
              className="pc-chev"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              role="button"
            >
              <i className={`bi bi-chevron-${open ? "down" : "right"}`} />
            </span>
          ) : (
            <span className="pc-chev-placeholder" />
          )}

          <i className={`bi ${node.tipoUso === "Agrupadora" ? "bi-folder2" : "bi-file-earmark-text"} pc-node-icon`} />
          <span className="pc-node-text">
            <strong className="pc-node-code">{node.codigo}</strong> {node.nombre}
          </span>
        </span>
      </button>

      {hasKids && open && (
        <div>
          {kids.map((k) => (
            <TreeNode
              key={k.id}
              node={k}
              byParent={byParent}
              currentId={currentId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NuevaCuentaModal({ open, onClose, parent, onCreate }) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipoUso, setTipoUso] = useState("Imputable");

  if (!open) return null;

  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pc-modal-head">
          <h3>Nueva cuenta</h3>
          <button className="pc-icon-btn" onClick={onClose} type="button">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="pc-modal-sub">
          Se creará como hija de:{" "}
          <strong>
            {parent?.codigo ? `${parent.codigo} - ` : ""}
            {parent?.nombre}
          </strong>
        </div>

        <div className="pc-form">
          <label>
            Código
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 1101-03"
            />
          </label>
          <label>
            Nombre
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banco Estado"
            />
          </label>
          <label>
            Tipo de uso
            <select value={tipoUso} onChange={(e) => setTipoUso(e.target.value)}>
              <option value="Agrupadora">Agrupadora</option>
              <option value="Imputable">Imputable</option>
            </select>
          </label>
        </div>

        <div className="pc-modal-actions">
          <button className="pc-btn-ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="pc-btn-primary"
            type="button"
            onClick={() => {
              if (!codigo.trim() || !nombre.trim()) return;
              onCreate({ codigo: codigo.trim(), nombre: nombre.trim(), tipoUso });
              setCodigo("");
              setNombre("");
              setTipoUso("Imputable");
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

