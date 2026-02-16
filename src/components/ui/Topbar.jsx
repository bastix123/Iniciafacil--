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

        <Link href="/" className="topbar-brandlink">
          <div className="topbar-titles">
            <div className="topbar-title">Iniciafacil</div>
            <div className="topbar-subtitle">Panel</div>
          </div>
        </Link>
      </div>

      <div className="topbar-right">
        <PeriodPicker value={periodo} onChange={setPeriodo} />

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

