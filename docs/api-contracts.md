# API Contracts – Contaplus Next

Este documento define el contrato esperado entre Frontend y Backend.
El backend debe generar automáticamente la documentación oficial (OpenAPI/Swagger),
pero este archivo sirve como guía funcional y técnica para el desarrollo.

---

# ================================
# TRANSACCIONES
# ================================

## 1️⃣ Listar transacciones

GET /api/transacciones

### Query Params

- tipo: "Todos" | "Ingreso" | "Egreso" | "Traspaso"
- desde: string (YYYY-MM)
- hasta: string (YYYY-MM)
- q: string
- page: number
- pageSize: number
- sortBy: "id" | "fecha" | "tipo" | "monto"
- sortDir: "asc" | "desc"

### Response 200

{
  "items": [
    {
      "id": 6100,
      "fecha": "2025-12-30",
      "tipo": "Ingreso",
      "estado": "Vigente",
      "totalDebe": 10860,
      "totalHaber": 10860
    }
  ],
  "total": 35,
  "page": 1,
  "pageSize": 10
}

---

## 2️⃣ Obtener transacción por ID

GET /api/transacciones/{id}

### Response 200

{
  "id": 6100,
  "fecha": "2025-12-30",
  "tipo": "Ingreso",
  "estado": "Vigente",
  "detalles": [
    {
      "accountId": "1101-01",
      "codigoCuenta": "1101-01",
      "nombreCuenta": "Caja",
      "centroCosto": "General",
      "glosa": "Ingreso efectivo",
      "debe": 10860,
      "haber": 0
    },
    {
      "accountId": "2101-01",
      "codigoCuenta": "2101-01",
      "nombreCuenta": "Clientes",
      "centroCosto": "General",
      "glosa": "Ingreso efectivo",
      "debe": 0,
      "haber": 10860
    }
  ]
}

---

## 3️⃣ Crear nueva transacción

POST /api/transacciones

### Body esperado

{
  "fecha": "2025-12-30",
  "tipo": "Ingreso",
  "detalles": [
    {
      "accountId": "1101-01",
      "centroCosto": "General",
      "glosa": "Ingreso efectivo",
      "debe": 10860,
      "haber": 0
    },
    {
      "accountId": "2101-01",
      "centroCosto": "General",
      "glosa": "Ingreso efectivo",
      "debe": 0,
      "haber": 10860
    }
  ]
}

### Reglas de negocio obligatorias

- Máximo 15 líneas de detalle.
- Cada línea debe tener accountId válido.
- Solo cuentas de tipo "Imputable".
- Debe existir al menos una línea en Debe y una en Haber.
- La suma total del Debe debe ser igual a la suma total del Haber.

### Response 201

{
  "id": 6101,
  "message": "Transacción creada correctamente"
}

---

## 4️⃣ Actualizar transacción

PUT /api/transacciones/{id}

### Body

Mismo formato que POST.

---

## 5️⃣ Eliminar transacción

DELETE /api/transacciones/{id}

### Response 200

{
  "message": "Transacción eliminada correctamente"
}

# ================================
# NUEVA TRANSACCIÓN (CREACIÓN)
# ================================

## 6️⃣ Crear transacción (desde “Nueva Transacción”)

POST /api/transacciones

> Crea una transacción contable con líneas de detalle (máx. 15).
> El `id` resultante identifica la transacción (comprobante).
> `accountId` corresponde al código de cuenta imputable (ej: "1101-01").

### Body (application/json)

{
  "tipo": "Ingreso",
  "emision": "2025-12-30",
  "glosa": "Ingreso efectivo",
  "detalle": [
    {
      "accountId": "1101-01",
      "centroCostoId": "CC-01",
      "glosa": "Ingreso efectivo",
      "debe": 10860,
      "haber": 0
    },
    {
      "accountId": "2101-01",
      "centroCostoId": "CC-01",
      "glosa": "Ingreso efectivo",
      "debe": 0,
      "haber": 10860
    }
  ]
}

### Reglas de negocio (Backend debe validar)

- Máximo 15 líneas de detalle.
- `accountId` debe existir y ser cuenta **Imputable**.
- Cada línea usada debe incluir `accountId` y `centroCostoId`.
- En cada línea: Debe XOR Haber (uno > 0 y el otro = 0).
- Debe existir al menos una línea en Debe y una en Haber.
- Suma(Debe) == Suma(Haber).
- `glosa` principal obligatoria.

### Response 201

{
  "id": 6101,
  "message": "Transacción creada correctamente"
}

### Errores

- 400: Validación (campos faltantes, descuadre, cuenta no imputable, etc.)
- 409: Conflicto (si aplica: folio repetido / periodo cerrado / etc.)

---

## 7️⃣ Adjuntar PDF de respaldo (opcional)

POST /api/transacciones/{id}/adjuntos

> Sube un PDF de respaldo (factura/boleta/comprobante externo).
> No es el PDF “generado”; es un archivo adjunto del usuario.

### Request (multipart/form-data)

- file: PDF (máx. 4MB)
- (opcional) nombre / metadata si se requiere

### Response 201

{
  "attachmentId": "att_01",
  "fileName": "respaldo.pdf"
}

---

## 8️⃣ Obtener PDF generado del comprobante (para “Guardar y ver PDF”)

GET /api/transacciones/{id}/pdf

> Devuelve el PDF generado por el sistema para visualizar/descargar.

### Response 200

- Content-Type: application/pdf
- Body: (binario PDF)

### Errores
- 404: Transacción no existe o PDF aún no generado

---

## 9️⃣ Generar PDF (si el backend lo hace bajo demanda)

POST /api/transacciones/{id}/pdf

> Genera (o regenera) el PDF del comprobante.
> Útil si el PDF no se genera automáticamente al crear.

### Body (opcional)

{
  "force": false
}

### Response 202 (o 200)

{
  "message": "PDF generado",
  "pdfUrl": "/api/transacciones/6101/pdf"
}

# ================================
# EDITAR TRANSACCIÓN (EDICIÓN)
# ================================

## 🔟 Obtener transacción para edición

GET /api/transacciones/{id}

> Se utiliza para prellenar la vista EditarTransaccion.jsx con encabezado, líneas y adjunto (si existe).

### Response 200

{
  "id": 6100,
  "fecha": "2025-12-30",
  "tipo": "Ingreso",
  "nComprobante": "6100",
  "glosa": "TRANSFERENCIA BANCOESTADO...",
  "repetirGlosa": true,
  "detalles": [
    {
      "lineId": "l1",
      "accountId": "1104-01",
      "centroCosto": null,
      "glosa": "TRANSFERENCIA BANCOESTADO...",
      "debe": 0,
      "haber": 10860
    },
    {
      "lineId": "l2",
      "accountId": "1102-02",
      "centroCosto": null,
      "glosa": "TRANSFERENCIA BANCOESTADO...",
      "debe": 10860,
      "haber": 0
    }
  ],
  "adjunto": {
    "attachmentId": "att_01",
    "fileName": "respaldo.pdf",
    "sizeBytes": 345678
  }
}

### Errores

- 404: Transacción no existe
- 409: Conflicto (periodo cerrado / transacción bloqueada)

---

## 1️⃣1️⃣ Actualizar transacción

PUT /api/transacciones/{id}

> Actualiza encabezado y líneas de detalle.
> Si no hay adjunto, se envía JSON.
> Si hay adjunto, se recomienda multipart/form-data (payload + file).

### Body (application/json)

{
  "id": 6100,
  "fecha": "2025-12-30",
  "tipo": "Ingreso",
  "nComprobante": "6100",
  "glosa": "TRANSFERENCIA BANCOESTADO...",
  "repetirGlosa": true,
  "detalles": [
    {
      "accountId": "1104-01",
      "centroCosto": null,
      "glosa": "TRANSFERENCIA BANCOESTADO...",
      "debe": 0,
      "haber": 10860
    },
    {
      "accountId": "1102-02",
      "centroCosto": null,
      "glosa": "TRANSFERENCIA BANCOESTADO...",
      "debe": 10860,
      "haber": 0
    }
  ]
}

### Body (multipart/form-data) — con adjunto

- payload: JSON (mismo formato anterior)
- file: PDF (máx. 4MB)

### Reglas de negocio (Backend debe validar)

- tipo obligatorio.
- fecha obligatoria (YYYY-MM-DD).
- glosa principal obligatoria.
- Mínimo 1 línea de detalle.
- Máximo 15 líneas.
- Cada línea debe tener accountId válido (cuenta Imputable).
- glosa por línea obligatoria.
- Debe XOR Haber por línea (uno > 0 y el otro = 0).
- Debe existir al menos una línea con Debe y una con Haber.
- Suma(Debe) == Suma(Haber) y total > 0.
- Si hay adjunto:
  - Debe ser PDF.
  - Máximo 4MB.

### Response 200

{
  "id": 6100,
  "message": "Transacción actualizada correctamente"
}

### Errores

- 400: Error de validación.
- 404: Transacción no existe.
- 409: Conflicto (periodo cerrado / estado inválido).
- 413: Archivo demasiado grande.
- 415: Tipo de archivo inválido.

---

## 1️⃣2️⃣ Subir o reemplazar adjunto (opcional)

POST /api/transacciones/{id}/adjuntos

> Permite subir o reemplazar el PDF de respaldo desde la edición.

### Request (multipart/form-data)

- file: PDF (máx. 4MB)

### Response 201

{
  "attachmentId": "att_02",
  "fileName": "nuevo_respaldo.pdf"
}

### Errores

- 404: Transacción no existe.
- 413: Archivo demasiado grande.
- 415: Tipo inválido (no PDF).

---

# ================================
# LIBRO MAYOR
# ================================

## 1️⃣3️⃣ Buscar / listar cuentas imputables (para selector)

GET /api/cuentas

> Se usa para poblar el selector de “Cuenta” (modo Por cuenta).
> Idealmente soporta búsqueda por código/nombre y filtro imputable.

### Query Params

- q: string (opcional) → busca por código o nombre
- imputable: boolean (opcional) → true para solo imputables
- limit: number (opcional) → default 50

### Response 200

{
  "items": [
    {
      "codigo": "1101-01",
      "nombre": "Caja",
      "imputable": true
    }
  ]
}

---

## 1️⃣4️⃣ Generar vista previa del Libro Mayor (por cuenta)

POST /api/libro-mayor/preview

> Genera datos para la vista previa (tabla + métricas) SOLO para una cuenta imputable.

### Body (application/json)

{
  "periodo": "2025-12",
  "desde": "2025-12-01",
  "hasta": "2025-12-31",
  "cuentaCodigo": "1101-01",
  "filtros": {
    "soloVigentes": true,
    "mostrarDetalle": true
  }
}

### Response 200

{
  "cuenta": {
    "codigo": "1101-01",
    "nombre": "Caja"
  },
  "periodo": {
    "value": "2025-12",
    "desde": "2025-12-01",
    "hasta": "2025-12-31",
    "label": "diciembre 2025"
  },
  "saldoInicial": 109020,
  "totalDebe": 10860,
  "totalHaber": 10860,
  "saldoFinal": 109020,
  "rows": [
    {
      "fecha": "2025-12-01",
      "glosa": "Saldo inicial",
      "documento": "-",
      "debe": 0,
      "haber": 0,
      "saldo": 109020,
      "inicial": true
    },
    {
      "fecha": "2025-12-30",
      "glosa": "Movimiento 1",
      "documento": "COMP-1001",
      "debe": 10860,
      "haber": 0,
      "saldo": 119880
    }
  ]
}

### Reglas de negocio (Backend debe validar)

- `periodo` obligatorio (YYYY-MM) y coherente con `desde/hasta` (mismo mes).
- `desde` y `hasta` obligatorios (YYYY-MM-DD) y deben pertenecer al período.
- `cuentaCodigo` obligatorio y debe existir y ser **Imputable**.
- Si `soloVigentes=true`, excluir transacciones anuladas/no vigentes.
- Si `mostrarDetalle=false`, backend puede:
  - devolver `rows` vacío y solo métricas, o
  - devolver movimientos agregados (definir criterio).
  (Recomendación: para preview mantener `rows` siempre, y usar `mostrarDetalle` para export.)

### Errores

- 400: Validación (periodo inválido, cuenta inválida, etc.)
- 404: Cuenta no existe
- 409: Conflicto (período cerrado / usuario sin acceso, etc.)

---

## 1️⃣5️⃣ Exportar Libro Mayor (por cuenta o completo)

POST /api/libro-mayor/export

> Exporta el Libro Mayor a PDF o Excel.
> - Modo "Por cuenta": exporta SOLO la cuenta indicada.
> - Modo "Completo": exporta TODAS las cuentas imputables (puede ser archivo grande).

### Body (application/json)

{
  "periodo": "2025-12",
  "desde": "2025-12-01",
  "hasta": "2025-12-31",
  "modo": "Por cuenta",
  "cuentaCodigo": "1101-01",
  "filtros": {
    "soloVigentes": true,
    "mostrarDetalle": true
  },
  "formato": "PDF"
}

### Formatos y modos permitidos

- modo: "Por cuenta" | "Completo"
- formato: "PDF" | "Excel"

### Response (opción A: devuelve URL de descarga)

200

{
  "message": "Export generado",
  "downloadUrl": "/api/libro-mayor/exports/exp_01/download",
  "expiresAt": "2026-02-20T23:59:59Z"
}

### Response (opción B: devuelve binario directo)

200

- Content-Type: application/pdf  (si formato=PDF)
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (si formato=Excel)
- Content-Disposition: attachment; filename="libro_mayor_2025-12.pdf"
- Body: (binario)

### Reglas de negocio (Backend debe validar)

- `periodo`, `desde`, `hasta` obligatorios y coherentes (mismo mes).
- `modo` obligatorio.
- `formato` obligatorio.
- Si modo="Por cuenta":
  - `cuentaCodigo` obligatorio y debe ser **Imputable**.
- Si modo="Completo":
  - `cuentaCodigo` debe ser null/omitido (backend ignora).
  - Export incluye todas las imputables, ordenadas por código (recomendación).
- Si `mostrarDetalle=false`:
  - Export puede ir resumido (sin líneas) o agregado por día/documento (definir criterio).
- Si el archivo es muy grande:
  - backend puede responder 202 y procesar asíncrono (ver siguiente endpoint).

### Errores

- 400: Validación (modo/formato inválido, cuenta requerida, etc.)
- 403: Sin permisos para exportar
- 409: Conflicto (período cerrado / bloqueo)
- 413: Export demasiado grande (si aplicara) o recomendar 202

---

## 1️⃣6️⃣ (Opcional) Export asíncrono: consultar estado y descargar

> Solo si deciden hacerlo asíncrono para “Completo” (recomendado cuando hay muchas cuentas/movimientos).

### 1️⃣6️⃣.1 Crear export asíncrono

POST /api/libro-mayor/exports

Body: mismo que /api/libro-mayor/export

Response 202

{
  "exportId": "exp_01",
  "status": "processing"
}

### 1️⃣6️⃣.2 Consultar estado

GET /api/libro-mayor/exports/{exportId}

Response 200

{
  "exportId": "exp_01",
  "status": "processing"  // processing | ready | failed
}

### 1️⃣6️⃣.3 Descargar

GET /api/libro-mayor/exports/{exportId}/download

Response 200: binario (PDF/Excel)
Errores:
- 404: no existe
- 409: aún no está listo
