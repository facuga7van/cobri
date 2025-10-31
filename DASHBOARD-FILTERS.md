# 📊 Dashboard con Filtros Personalizables

## ✅ Implementado - 31/10/2025

---

## 🎯 Funcionalidades

### 1. **Filtro de Período**

Selector con opciones preestablecidas:
- ⏱️ Último mes (1 mes)
- 📅 3 meses
- 📅 6 meses (default)
- 📅 12 meses
- 📆 Este año (Enero - Mes actual)
- ♾️ Todo el tiempo (máx 24 meses)

### 2. **Filtro por Cliente**

- Ver métricas de un cliente específico
- O ver todos los clientes
- Dropdown con lista de todos tus clientes

---

## 🔧 Cómo Funciona

### Ubicación
```
┌─────────────────────────────────────┐
│ Dashboard                           │
├─────────────────────────────────────┤
│ 🔍 Filtros:                         │
│ [Período: 6 meses ▼] [Cliente: Todos ▼] │
├─────────────────────────────────────┤
│ [KPI Cards] ← Afectadas por filtros │
│ [Gráfico]   ← Afectado por filtros  │
│ [Próximos]  ← Afectados por filtros │
└─────────────────────────────────────┘
```

### Persistencia
- ✅ Guarda en **localStorage**
- ✅ Se recuerda entre sesiones
- ✅ Por usuario (usa user.uid como key)

---

## 📝 Componentes Creados

### `components/dashboard-filters.tsx`
Componente de filtros reutilizable con:
- Select de período
- Select de cliente
- Botón para limpiar filtros
- Labels traducidos (ES/EN)

---

## 🔄 Flujo de Datos

```typescript
1. Usuario selecciona filtros
   ↓
2. Estado se actualiza (period, customerId)
   ↓
3. Se guarda en localStorage
   ↓
4. useEffect detecta cambio
   ↓
5. Llama a calculateKPIs(userId, locale, filters)
   ↓
6. lib/kpis.ts filtra subscripciones
   ↓
7. Calcula KPIs filtrados
   ↓
8. Dashboard se actualiza con nuevos datos
```

---

## 🎨 Ejemplos de Uso

### Caso 1: Ver últimos 3 meses
```
Filtros:
  Período: 3 meses
  Cliente: Todos

Resultado:
  - KPIs de últimos 3 meses
  - Gráfico muestra: Oct, Sep, Ago
  - Próximos cobros: Todos los clientes
```

### Caso 2: Ver un cliente específico
```
Filtros:
  Período: Todo el tiempo
  Cliente: Juan Pérez

Resultado:
  - KPIs solo de Juan Pérez
  - Gráfico histórico de Juan
  - Próximos cobros solo de Juan
```

### Caso 3: Este año
```
Filtros:
  Período: Este año
  Cliente: Todos

Resultado:
  - KPIs desde Enero 2025
  - Gráfico: Ene, Feb, Mar... Oct
  - Próximos cobros: Todos
```

---

## 💾 LocalStorage

### Keys utilizadas
```typescript
'dashboard-period'    // '1' | '3' | '6' | '12' | 'year' | 'all'
'dashboard-customer'  // customerId o 'all'
```

### Valores por defecto
```typescript
period: '6'      // 6 meses
customerId: 'all' // Todos los clientes
```

---

## 🧮 Cálculos Afectados

### KPIs
- **Suscripciones Activas:** Filtradas por cliente
- **MRR:** Solo del cliente seleccionado (si aplica)
- **Nuevos este mes:** Filtrados por cliente
- **Crecimiento:** Basado en datos filtrados

### Gráfico
- **Eje X:** Muestra meses según período seleccionado
- **Eje Y:** MRR del período/cliente seleccionado
- **Datos:** Filtrados según selección

### Próximos Cobros
- Filtrados por cliente (si se seleccionó uno)
- Siempre próximos 7 días

---

## 🎯 Casos Especiales

### "Todo el tiempo" con muchos datos
- Límite máximo: 24 meses (performance)
- Si hay más, muestra los últimos 24

### "Este año" en Enero
- Muestra solo 1 mes (Enero)

### Cliente sin suscripciones activas
- KPIs en 0
- Gráfico vacío (con mensaje)
- Sin próximos cobros

---

## 🚀 Mejoras Futuras

Posibles extensiones (no implementadas):
- [ ] Comparar dos períodos side-by-side
- [ ] Exportar datos filtrados a CSV
- [ ] Guardar filtros presets favoritos
- [ ] Filtro por plan/tipo de suscripción
- [ ] Compartir dashboard filtrado (URL params)

---

## 📱 Responsive

Los filtros son completamente responsive:
- **Desktop:** 2 columnas (Período | Cliente)
- **Mobile:** 1 columna (apilados)
- **Tablet:** Adaptativo

---

**Implementado por:** AI Assistant
**Fecha:** 31/10/2025
**Tiempo:** 1.5 horas

