# La Tiendita — Dashboard Web

Dashboard administrativo en React (Vite) para monitorear ventas en vivo,
reportes, cortes de caja, y administrar el catálogo de productos,
cafetería y modificadores.

## Requisitos previos en el backend (`server.js`)

Antes de usar el dashboard, agrega el bloque de endpoints nuevos que está
en `server-additions.js` (te lo compartí aparte) a tu `server.js` real,
antes de la línea `const PORT = ...`. Esto agrega:

- `/api/products/list`, `PUT /api/products/:id`, `/toggle-active`
- `/api/cafe/products/list`, `POST /api/cafe/products`, `PUT /api/cafe/products/:id`
- CRUD completo de `/api/cafe/modifier-groups` y `/api/cafe/modifier-options`
- Ligar/desligar modificadores a productos de café
- `/api/reports/sales-daily` y `/api/reports/sales-live`

Sin estos endpoints, el dashboard no va a poder cargar nada.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Inicia sesión con cualquier usuario que ya
exista en tu tabla `users` (el mismo login que usa la app de la tablet).

## Desplegar en Azure — Static Web Apps (recomendado, tiene capa gratis)

### 1. Crear el recurso en Azure

1. Portal de Azure → **Crear un recurso** → busca "Static Web App"
2. Configura:
   - **Plan de hospedaje**: Free
   - **Origen de implementación**: GitHub
   - Conecta tu repositorio (crea uno nuevo si no tienes, ej. `tienda-dashboard`)
   - **Preajustes de compilación**: Custom
   - **Ubicación de la app**: `/`
   - **Ubicación de salida**: `dist`
3. Azure crea automáticamente un archivo de GitHub Actions en tu repo — puedes
   reemplazarlo por el `.github/workflows/azure-static-web-apps.yml` que ya
   viene en este proyecto (o dejar el que Azure genera, son equivalentes).
4. Al crear el recurso, Azure agrega automáticamente el secreto
   `AZURE_STATIC_WEB_APPS_API_TOKEN` a tu repo de GitHub — no necesitas
   copiarlo tú mismo.

### 2. Subir el código

```bash
git init
git add .
git commit -m "Dashboard inicial"
git branch -M main
git remote add origin https://github.com/tu-usuario/tienda-dashboard.git
git push -u origin main
```

El GitHub Action se dispara solo, compila con `npm run build`, y sube el
contenido de `dist/` a Azure. En 2-3 minutos tu dashboard está en línea en
una URL tipo `https://nombre-random.azurestaticapps.net`.

### 3. Dominio personalizado (opcional)

Si quieres algo como `dashboard.tienditadeguadalajara.com`, en el recurso
de Static Web App → **Dominios personalizados** → agrega el dominio y
sigue las instrucciones de verificación DNS (agregar un registro CNAME
en tu proveedor de dominio).

## Estructura

```
src/
  api.js                 — todas las llamadas al backend
  context/AuthContext.jsx — sesión guardada en localStorage
  components/
    Sidebar.jsx, Layout.jsx
  pages/
    LoginPage.jsx
    LiveSalesPage.jsx      — ventas en vivo, refresca cada 15s
    SalesReportPage.jsx    — reporte diario con filtro de fechas
    CashCutsPage.jsx       — historial de cortes, detalle expandible
    ProductsPage.jsx       — CRUD productos de tienda (org 1)
    CafeProductsPage.jsx   — CRUD productos de cafetería (org 2)
    ModifiersPage.jsx      — CRUD de grupos/opciones de modificadores
```

## Notas

- El login reutiliza tu tabla `users` existente y el endpoint
  `/api/auth/login` que ya tiene la app de la tablet — no se creó ningún
  sistema de autenticación nuevo.
- "Ventas en vivo" refresca automáticamente cada 15 segundos (polling).
  Si más adelante quieres actualización instantánea, se puede migrar a
  WebSockets, pero para el volumen de una tienda/cafetería el polling es
  más que suficiente y mucho más simple de mantener.
- El corte de caja sigue el mismo modelo que ya tienes en la app: un solo
  corte por caja física (`warehouse_id`), sumando tienda y cafetería
  juntos.
