# 🌐 SiGEstacionesVE - Frontend Angular (Fase Futura)

Este directorio está reservado para la aplicación **Frontend SPA en Angular** del sistema **SiGEstacionesVE**.

---

## 🚀 Cómo Inicializar la Aplicación Angular

Cuando estés listo para iniciar el desarrollo del frontend:

1. Abre la terminal en la raíz del proyecto `SiGEstacionesVE`.
2. Ejecuta el comando de inicialización de Angular:

```bash
npm run init:web
```

*O bien ejecutando directamente dentro de `apps/web`:*

```bash
cd apps/web
npm run init:angular
```

*(El comando ejecuta internamente: `npx -y @angular/cli@latest new web --directory=. --style=scss --routing=true --standalone --skip-git`)*

---

## 🛠️ Stack Recomendado para el Frontend
- **Framework:** Angular 18/19 (Standalone Components + Signals)
- **Estilos / Componentes:** Angular Material / PrimeNG / Tailwind CSS
- **Consumo de API:** Angular `HttpClient` apuntando al Backend NestJS (`http://localhost:3000/api`)
- **Tipos Compartidos:** Importación desde `@sigestaciones/shared` (`libs/shared`)
