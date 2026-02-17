"use client";

import Link from "next/link";
import PeriodPicker from "@/components/ui/PeriodPicker";
import { usePeriodo } from "@/context/PeriodoContext";

export default function Topbar({ onMenuClick }) {
  const { periodo, setPeriodo } = usePeriodo();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="menu-btn"
          onClick={onMenuClick}
          type="button"
          aria-label="Abrir menú"
        >
          <i className="bi bi-list" />
        </button>

        <Link href="/" className="topbar-brandlink" aria-label="Ir al inicio">
          <div className="topbar-brand">
            <div className="topbar-logo">
              <img src="/hola.png" alt="Logo Iniciafacil" />
            </div>

            <div className="topbar-titles">
              <div className="topbar-title">Iniciafacil</div>
              <div className="topbar-subtitle">Panel</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="topbar-right">
        <PeriodPicker value={periodo} onChange={setPeriodo} />
      </div>
    </header>
  );
}


