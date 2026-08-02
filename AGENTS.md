# AGENTS Guide

Este archivo define las reglas de arquitectura, patrones de diseño y restricciones de dominio para cualquier agente de Inteligencia Artificial (Antigravity, Claude, Codex, Cursor, etc.) que trabaje en el repositorio **SiGEstacionesVE**.

---

## 🛠 Stack Tecnológico del Proyecto

- **Framework:** NestJS 11 (TypeScript 5.7, Node.js ≥ 22)
- **ORM:** Prisma 6
- **Base de Datos:** PostgreSQL 16
- **Caché & Revocación:** Redis 7 (@nestjs/cache-manager + @keyv/redis)
- **Autenticación & Autorización:** Passport.js (JWT + Local), Roles (`SUPER_ADMIN`, `ADMIN`, `PROGRAMADOR`, `VENDEDOR`)
- **Documentación:** Swagger / OpenAPI 3.0

---

## 📐 Reglas de Arquitectura y Patrones de Código

### 1. Patrón Layered Repository

- **Controllers (`*.controller.ts`):** Exclusivamente para enrutamiento HTTP, validación de DTOs y documentación Swagger. No incluir lógica de negocio.
- **Services (`*.service.ts`):** Orquestación de lógica de negocio, reglas financieras y transacciones.
- **Repositories (`*.repository.ts`):** Encapsulación de acceso a datos. Deben extender `BaseRepository<T>` para heredar el soporte de caché (`findOneCached`, `findAllCached`, `invalidateModelCache`) y paginación estándar.

### 2. Manejo Numérico de Precisión (Regla Crítica)

- **JAMÁS usar `number` o `Float` de JavaScript/Prisma para volúmenes (litros) o dinero (Bs. / USD).**
- Todos los campos de volumen y dinero en `schema.prisma` deben ser de tipo `Decimal` (`@db.Decimal(12, 3)` para litros, `@db.Decimal(14, 2)` para montos).
- En TypeScript, manipular los valores con la clase `Decimal` de `@prisma/client/runtime/library` o `decimal.js`.

### 3. Control de Acceso y Seguridad (RBAC)

- La autenticación JWT es global (`APP_GUARD`).
- Utilizar los decoradores `@Roles(Role.ADMIN, Role.VENDEDOR)` en controladores o métodos para restringir accesos.
- Las mutaciones de datos que afecten inventarios o cierres financieros requieren rol de administración o supervisión.

### 4. Transacciones e Inventarios

- La creación o cierre de un turno, la recepción de cisterna/gandola y la actualización de tanques deben ejecutarse dentro de **Transacciones Interactivas de Prisma** (`this.prisma.$transaction(async (tx) => { ... })`).
- Ningún registro de ventas puede dejar el saldo de un tanque en valor negativo; debe arrojar una excepción `BadRequestException` o `UnprocessableEntityException`.

---

## 🗄️ Convención de Dominios de Negocio

### Módulo de Turnos y Ventas (`src/modules/shifts`)

- **Flujo de Vida:** `ABIERTO` -> `LECTURA_BOMBAS` -> `ARQUEO_CAJA` -> `CERRADO`.
- **Cálculo de Litros:** $LitrosVendidos = LecturaFinal - LecturaInicial$.
- **Cierre de Caja:** Registrar diferencia de cuadre ($MontoReal - MontoTeorico$).

### Módulo de Inventarios y Tanques (`src/modules/inventory`)

- **Fórmula de Balance Volumétrico:**
  $$\text{Inventario Teórico} = \text{Inventario Inicial} + \text{Recepciones (Gandolas)} - \text{Ventas Totales}$$
- **Merma / Discrepancia:**
  $$\text{Diferencia} = \text{Inventario Teórico} - \text{Medición Física Final (Varillaje)}$$

---

## 🧪 Calidad de Código y Commits

- **Commits:** Seguir la convención _Conventional Commits_ (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Linter y Formato:** Ejecutar `npm run lint` y `npm run format` antes de concluir cualquier tarea.
- **Pruebas:** Los nuevos servicios deben incluir su archivo de prueba unitaria (`*.spec.ts`) utilizando mocks de `PrismaService` y `BaseRepository`.
