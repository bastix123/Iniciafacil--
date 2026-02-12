"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function TxActionsMenu({ editHref, onAction }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0, side: "down" });

  
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;

      if (btn.contains(e.target) || menu.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Posicionar arriba/abajo según espacio disponible (evita que se corte)
  useLayoutEffect(() => {
    if (!open) return;

    const compute = () => {
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;

      const r = btn.getBoundingClientRect();

      const mh = menu.offsetHeight;
      const mw = menu.offsetWidth;

      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;

      const side =
        spaceBelow >= mh + 12
          ? "down"
          : spaceAbove >= mh + 12
          ? "up"
          : spaceBelow >= spaceAbove
          ? "down"
          : "up";

      const top = side === "down" ? r.bottom + 8 : r.top - mh - 8;
      const left = Math.min(
        Math.max(8, r.right - mw),
        window.innerWidth - mw - 8
      );

      setPos({ top, left, side });
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  const goEdit = () => {
    setOpen(false);
    if (!editHref) return;
    router.push(editHref);
  };

  return (
    <>
      <button
        ref={btnRef}
        className="btn ghost"
        onClick={() => setOpen((v) => !v)}
        type="button"
        title="Acciones"
        style={{
          padding: "6px 10px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
        }}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="tx-actions-menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: 210,
              background: "rgba(10,16,28,0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              overflow: "hidden",
              zIndex: 99999,
            }}
          >
            <MenuItem
              label="Ver detalles"
              icon="bi-eye"
              onClick={() => {
                setOpen(false);
                onAction?.("ver");
              }}
            />

            <MenuItem label="Editar" icon="bi-pencil" onClick={goEdit} />

            <div style={{ height: 1, background: "rgba(255,255,255,0.10)" }} />

            <MenuItem
              label="Eliminar"
              icon="bi-trash"
              danger
              onClick={() => {
                setOpen(false);
                onAction?.("eliminar");
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({ label, icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        color: danger ? "rgba(255,120,120,0.95)" : "rgba(255,255,255,0.90)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
        fontWeight: 700,
        fontSize: 13,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "rgba(255, 80, 80, 0.10)"
          : "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <i className={`bi ${icon}`} style={{ opacity: 0.9 }} />
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}
