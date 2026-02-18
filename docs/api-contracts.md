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
