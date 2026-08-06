# Supabase en Newcastle Team

El proyecto de Newcastle Team es una página estática con funciones API de Vercel; no es una aplicación Next.js. Por eso se integró Supabase sin convertir ni romper la página existente.

## Instalación

```bash
npm install
```

`package.json` ya incluye:

- `@supabase/supabase-js`
- `@supabase/ssr`

## Variables en Vercel

Agrega en **Settings → Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://goxcnmydkitmtdqylfcg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_b8rbAQPitybzkJmyA5iF5w_55PZWLJn

SUPABASE_URL=https://goxcnmydkitmtdqylfcg.supabase.co
SUPABASE_SECRET_KEY=tu_clave_secreta_sb_secret
```

Si tu proyecto todavía utiliza las claves antiguas, puedes usar:

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role
```

No coloques `SUPABASE_SECRET_KEY` ni `SUPABASE_SERVICE_ROLE_KEY` en `app.js`, `index.html`, GitHub ni variables `NEXT_PUBLIC_*`.

## Base de datos

En Supabase abre **SQL Editor** y ejecuta:

```text
supabase/schema.sql
```

El SQL activa RLS y deja las operaciones privadas en las funciones del servidor.

## Comprobar la conexión

Crea `.env.local` a partir de `.env.example` y ejecuta:

```bash
npm run test:supabase
```

También puedes desplegar y abrir:

```text
https://TU-DOMINIO.vercel.app/api/health
```

Debe mostrar `"database": "supabase-sdk"`.

## Archivos agregados

- `utils/supabase/admin.js`: cliente privado usado por las APIs del bot.
- `utils/supabase/client.js`: cliente de navegador para una futura interfaz con Auth.
- `utils/supabase/server.js`: cliente SSR compatible con un almacén de cookies.
- `utils/supabase/middleware.js`: adaptador genérico para middleware/proxy.
- `utils/supabase/env.js`: validación centralizada de variables.

Los ejemplos que importan `next/headers` no se copiaron literalmente porque este proyecto no usa Next.js. Hacerlo habría provocado errores de compilación. Se añadieron equivalentes compatibles con la arquitectura actual.

## Supabase Agent Skills

Este comando instala instrucciones para asistentes de programación; no es una dependencia necesaria para que Vercel funcione:

```bash
npm run skills:supabase
```

Equivale a:

```bash
npx skills add supabase/agent-skills
```
