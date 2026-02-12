// src/components/ui/Topbar.jsx
"use client";

import Link from "next/link";

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="menu-btn"
          onClick={onMenuClick}
          type="button"
          aria-label="Abrir menú"
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>

        <Link href="/" className="topbar-brandlink">
          <div className="topbar-titles">
            <div className="topbar-title">Iniciafacil</div>
            <div className="topbar-subtitle">Panel</div>
          </div>
        </Link>
      </div>

      <div className="topbar-right">
        <button className="btn ghost" type="button">
          Soporte
        </button>
        <button className="btn" type="button">
          Mi cuenta
        </button>
      </div>
    </header>
  );
}
