// src/app/layout.jsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import "./globals.css";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  useEffect(() => {
    if (sidebarOpen) document.body.classList.add("sidebar-open");
    else document.body.classList.remove("sidebar-open");

    return () => document.body.classList.remove("sidebar-open");
  }, [sidebarOpen]);

  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="app-body">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="app-main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

