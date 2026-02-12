"use client";

import "./datos-empresa.css";
import { useMemo, useState } from "react";
import {
  Building2,
  BadgeCheck,
  MapPin,
  Users,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
} from "lucide-react";

export default function DatosEmpresa() {
  const initialForm = useMemo(
    () => ({
      rut: "12.345.678-5",
      nombre: "",
      repLegal: "",
      gerente: "",
      direccion: "",
      comuna: "",
      telefono: "+56 9 1234 5678",
      correo: "nombre@dominio.cl",
      siiPass: "",
      logoUrl: "",
    }),
    []
  );

  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [logoPreview, setLogoPreview] = useState("");

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isDirty = useMemo(() => {
    const keys = Object.keys(initialForm);
    return (
      keys.some((k) => String(form[k] ?? "") !== String(initialForm[k] ?? "")) ||
      !!logoPreview
    );
  }, [form, initialForm, logoPreview]);

  const onCancel = () => {
    setForm(initialForm);
    setLogoPreview("");
    setShowPass(false);
  };

  const onSave = () => {
    // En producción: validar + llamar API.
    // - Guardar datos legales/contacto
    // - Guardar credenciales SII (idealmente en vault/secret manager)
    // - Subir logo si viene archivo
    alert("Guardar cambios (pendiente)");
  };

  const onPickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  return (
    <div className="de-page">
      {/* Header de página */}
      <div className="de-header">
        <div>
          <h1 className="de-title">Datos de la empresa</h1>
          <p className="de-subtitle">
            Información legal, contacto y configuración fiscal
          </p>
        </div>
      </div>

      {/* Panel principal */}
      <div className="de-panel">
        <div className="de-panelHead">
          <div className="de-panelHeadTitle">Configuración de empresa</div>
          <div className="de-panelHeadSub">
            Completa la información obligatoria para operar y emitir documentación.
          </div>
        </div>

        <div className="de-panelBody">
          <div className="de-grid">
            {/* 1) Datos legales (CRÍTICO) */}
            <section className="de-card de-cardPrimary de-span-7">
              <div className="de-cardHead">
                <Building2 size={18} />
                <span>Datos legales</span>
                <span className="de-pill">Obligatorio</span>
              </div>

              <div className="de-cardHint">
                Se utiliza en procesos contables y fiscales. Algunos campos pueden requerir soporte para cambiar.
              </div>

              <div className="de-field">
                <label className="de-label">
                  RUT Empresa <span className="de-required">*</span>
                </label>
                <input  
                  className="de-input"
                  value={form.rut}
                  onChange={(e)=> setField("rut", e.target.value)}
                  placeholder="12.345.678-9"
                  />
                  <div className="de-help">Define el Rut Empresa.</div>
              </div>

              <div className="de-field">
                <label className="de-label">
                  Nombre Empresa <span className="de-required">*</span>
                </label>
                <input
                  className="de-input"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  placeholder="Ej: Comercial ABC SpA"
                />
              </div>

              <div className="de-row2">
                <div className="de-field">
                  <label className="de-label">
                    Representante legal <span className="de-required">*</span>
                  </label>
                  <input
                    className="de-input"
                    value={form.repLegal}
                    onChange={(e) => setField("repLegal", e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>

                <div className="de-field">
                  <label className="de-label">Gerente</label>
                  <input
                    className="de-input"
                    value={form.gerente}
                    onChange={(e) => setField("gerente", e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>
              </div>
            </section>

            {/* 2) Contacto oficial */}
            <section className="de-card de-span-5">
              <div className="de-cardHead">
                <MapPin size={18} />
                <span>Contacto oficial</span>
              </div>

              <div className="de-cardHint">
                Usado para notificaciones y documentos oficiales.
              </div>

              <div className="de-field">
                <label className="de-label">Dirección</label>
                <input
                  className="de-input"
                  value={form.direccion}
                  onChange={(e) => setField("direccion", e.target.value)}
                  placeholder="Calle, número, oficina"
                />
              </div>

              <div className="de-field">
                <label className="de-label">Comuna</label>
                <input
                  className="de-input"
                  value={form.comuna}
                  onChange={(e) => setField("comuna", e.target.value)}
                  placeholder="Ej: Providencia"
                />
              </div>

              <div className="de-row2">
                <div className="de-field">
                  <label className="de-label">Teléfono</label>
                  <input
                    className="de-input"
                    value={form.telefono}
                    onChange={(e) => setField("telefono", e.target.value)}
                    placeholder="+56 9 ..."
                  />
                </div>

                <div className="de-field">
                  <label className="de-label">Correo</label>
                  <input
                    className="de-input"
                    value={form.correo}
                    onChange={(e) => setField("correo", e.target.value)}
                    placeholder="correo@dominio.cl"
                  />
                </div>
              </div>
            </section>

            {/* 3) Credenciales fiscales (SII) */}
            <section className="de-card de-cardSensitive de-span-7">
              <div className="de-cardHead">
                <ShieldAlert size={18} />
                <span>Credenciales fiscales (SII)</span>
              </div>

              <div className="de-alert">
                <Lock size={16} />
                <span>Estas credenciales se almacenan de forma segura. No las compartas.</span>
              </div>

              <div className="de-field">
                <label className="de-label">Contraseña SII</label>

                <div className="de-passRow">
                  <input
                    className="de-input de-inputPass"
                    type={showPass ? "text" : "password"}
                    value={form.siiPass}
                    onChange={(e) => setField("siiPass", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />

                  <button
                    className="de-btnGhost"
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <div className="de-help">
                  Estado: {form.siiPass ? "configurada" : "no configurada"}
                </div>
              </div>

              <div className="de-miniRow">
                <BadgeCheck size={16} />
                <span>Recomendación: actualiza esta clave si cambia en el SII.</span>
              </div>
            </section>

            {/* 4) Branding (opcional) */}
            <section className="de-card de-cardLight de-span-5">
              <div className="de-cardHead">
                <Users size={18} />
                <span>Branding</span>
                <span className="de-pill de-pillSoft">Opcional</span>
              </div>

              <div className="de-cardHint">
                Personaliza la apariencia de tus documentos.
              </div>

              <div className="de-brandRow">
                <div className="de-logoBox">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="de-logoImg" src={logoPreview} alt="Logo" />
                  ) : (
                    <div className="de-logoFake">LOGO</div>
                  )}
                </div>

                <div className="de-brandBtns">
                  <label className="de-btnGhost de-uploadBtn">
                    <Upload size={16} />
                    Subir logo
                    <input
                      type="file"
                      accept="image/*"
                      className="de-file"
                      onChange={onPickLogo}
                    />
                  </label>

                  <button className="de-btnGhost" type="button">
                    <Download size={16} />
                    Descargar ejemplo
                  </button>
                </div>
              </div>

              <div className="de-help">
                Recomendado: PNG con fondo transparente, tamaño mínimo 256×256.
              </div>
            </section>
          </div>

          {/* Footer / barra de acciones */}
          <div className="de-panelFooter">
            <div className={`de-panelFooterLeft ${isDirty ? "is-dirty" : ""}`}>
              {isDirty ? "Cambios sin guardar" : "Sin cambios"}
            </div>

            <div className="de-panelFooterRight">
              <button className="de-btnCancel" type="button" onClick={onCancel}>
                Cancelar
              </button>

              <button
                className="de-btnSave"
                type="button"
                onClick={onSave}
                disabled={!isDirty}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

