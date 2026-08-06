# Newcastle Team — bot de Discord y análisis HBR2

Este proyecto conserva la página de Newcastle Team y añade dos módulos:

1. **Partidos oficiales y check por Discord**
   - El DT registra rival, competencia, fecha, hora y convocados desde la página.
   - El bot envía mensajes privados a los jugadores vinculados.
   - El check se responde con botones dentro de Discord.
   - Un cron envía recordatorios aproximados 24 horas antes, 1 hora antes y cuando abre el check.

2. **Análisis de repeticiones `.hbr2`**
   - La página permite subir una rec y elegir a un jugador.
   - El servidor extrae duración, sala, participantes, goles, asistencias y actividad de chat visible.
   - Groq redacta un informe limitado a los datos encontrados.
   - Si falta `GROQ_API_KEY`, se genera un reporte básico local.

La repetición enviada está incluida en `samples/` y el parser fue probado con ella.

## Qué incluye el ZIP

- Página completa de Newcastle Team.
- Funciones API compatibles con Vercel.
- Integración REST con Discord.
- Verificación de firmas de Discord para botones y comandos.
- Recordatorios con Vercel Cron.
- Base de datos Supabase integrada con `@supabase/supabase-js`.
- Parser HBR2 básico sin dependencias externas.
- Llamada a Groq desde el servidor.
- Archivo `.env.example`.
- SQL de Supabase en `supabase/schema.sql`.
- Comandos `/avisos` y `/proximo`.

## 1. Crear el bot en Discord

1. Entra al Discord Developer Portal.
2. Crea una aplicación nueva.
3. Abre **Bot** y crea el bot.
4. Copia el token con **Reset Token**.
5. En **General Information** copia:
   - Application ID
   - Public Key
6. En **Installation** u **OAuth2 URL Generator** selecciona:
   - `bot`
   - `applications.commands`
7. Permisos recomendados:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Application Commands
8. Abre el enlace generado e invita el bot al servidor.

No pongas el token en `app.js`, `platform.js` ni `index.html`.

## 2. Crear la base de datos en Supabase

1. Abre tu proyecto de Supabase.
2. Entra en **SQL Editor**.
3. Copia y ejecuta todo el archivo:

```text
supabase/schema.sql
```

4. En **Project Settings → API Keys** copia una clave secreta para el servidor:
   - Preferida: `secret key` con prefijo `sb_secret_`.
   - Compatible: `service_role` antigua.

La publishable key puede estar en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; la clave secreta nunca debe exponerse en el navegador.
## 3. Variables de entorno en Vercel

Abre el proyecto en Vercel:

**Settings → Environment Variables**

Agrega:

```env
ADMIN_SECRET=un-codigo-privado-para-dysta-y-valdo

GROQ_API_KEY=gsk_tu_clave
GROQ_MODEL=llama-3.3-70b-versatile

DISCORD_BOT_TOKEN=token_del_bot
DISCORD_PUBLIC_KEY=public_key_de_la_aplicacion
DISCORD_APPLICATION_ID=application_id
DISCORD_GUILD_ID=id_del_servidor

NEXT_PUBLIC_SUPABASE_URL=https://goxcnmydkitmtdqylfcg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_b8rbAQPitybzkJmyA5iF5w_55PZWLJn

SUPABASE_URL=https://goxcnmydkitmtdqylfcg.supabase.co
SUPABASE_SECRET_KEY=tu_sb_secret_key
SUPABASE_SERVICE_ROLE_KEY=opcional_clave_legacy

CRON_SECRET=un-secreto-largo-para-el-cron
DEFAULT_TIMEZONE=America/Monterrey
```

Activa las variables para Production, Preview y Development. Después vuelve a desplegar.

## 4. Endpoint de interacciones de Discord

Después de desplegar, copia esta dirección cambiando el dominio:

```text
https://TU-DOMINIO.vercel.app/api/discord/interactions
```

En Discord Developer Portal abre **General Information** y colócala en **Interactions Endpoint URL**.

Discord hará una verificación automática. Debes tener configurada `DISCORD_PUBLIC_KEY` en Vercel.

## 5. Registrar los comandos

En tu computadora:

```bash
npm install
```

Copia `.env.example` como `.env.local`, coloca temporalmente las variables de Discord y ejecuta:

```bash
npm run register:discord
```

Se registran:

```text
/avisos activar nickname:TuNombre
/avisos desactivar
/proximo
```

Después puedes borrar los secretos de `.env.local` si ya están guardados en Vercel.

## 6. Cómo reciben avisos los jugadores

Cada jugador debe ejecutar una vez:

```text
/avisos activar nickname:NombreEnHaxBall
```

También puedes vincularlo desde la sección **Oficiales** de la página usando su ID numérico de Discord.

El bot intentará abrir un mensaje privado. El jugador debe permitir mensajes directos del servidor. Discord puede impedir el DM si el usuario tiene los privados bloqueados.

## 7. Crear un oficial desde la página

1. Abre la sección **Oficiales**.
2. Vincula a los jugadores con su ID de Discord o pídeles usar `/avisos activar`.
3. Completa rival, competencia, fecha y convocados.
4. Presiona **Crear y enviar avisos**.
5. La página pedirá el valor de `ADMIN_SECRET`.
6. El bot enviará la convocatoria por privado.
7. Cuando abra el check, los jugadores verán:
   - Dar check
   - No puedo jugar

El panel muestra confirmados, pendientes y no disponibles.

## 8. Recordatorios automáticos

El archivo `vercel.json` está configurado para el plan gratuito Hobby:

```json
{
  "path": "/api/cron/reminders",
  "schedule": "0 0 * * *"
}
```

La tarea se ejecuta una vez al día, aproximadamente a las 00:00 UTC. En Monterrey corresponde aproximadamente a las 6:00 PM.

Esta configuración evita el error de despliegue de Vercel Hobby. Debido a que se ejecuta una sola vez al día, los avisos de 24 horas, 1 hora y apertura de check no siempre llegarán en el momento exacto.

Para revisar cada hora tienes estas opciones:

- Cambiar a Vercel Pro y copiar `vercel-pro-hourly.example.json` sobre `vercel.json`.
- Usar un programador externo que visite cada hora:

```text
https://TU-DOMINIO.vercel.app/api/cron/reminders
```

El programador externo debe enviar este encabezado:

```http
Authorization: Bearer TU_CRON_SECRET
```

No publiques `CRON_SECRET` en el frontend ni en GitHub.
## 9. Análisis de recs HBR2

En la sección **Análisis**:

1. Selecciona una rec `.hbr2`.
2. Escribe el nombre del jugador que quieres revisar.
3. Presiona **Analizar rec**.

También hay un botón para probar la rec incluida.

### Datos que sí extrae esta versión

- Firma y versión HBR2.
- Duración aproximada.
- Nombre de la sala.
- Participantes detectados.
- Mensajes visibles.
- Goles y asistencias cuando aparecen en mensajes del host.
- Participación básica por jugador.

### Datos que todavía no calcula con precisión

- Posesión real.
- Pases intentados o completados.
- Tiros.
- Mapas de calor.
- Distancias entre jugadores.
- Posiciones cuadro por cuadro.

La IA recibe estas limitaciones y tiene la instrucción de no inventar datos. Para llegar a mapas de calor y análisis táctico completo habría que integrar un parser de física cuadro por cuadro más avanzado.

## 10. Probar la rec incluida

```bash
npm run test:replay
```

El resultado se guarda en:

```text
samples/sample-analysis.json
```

Con la rec incluida se detectaron:

- Duración aproximada: 12:13.
- Sala: Vivet Hosting #2 — Miami, Florida.
- 23 participantes filtrados.
- 3 goles del equipo azul.
- Montiel y yasez como goleadores detectados.
- lux y Montiel como asistentes detectados.

## 11. Desarrollo local

```bash
npm install
npm run dev
```

Vercel CLI mostrará una dirección local. Sin Supabase, el proyecto usa `data/local-store.json` solo para pruebas locales. En Vercel debes configurar Supabase, porque el sistema de archivos de las funciones no es almacenamiento permanente.

## Seguridad

- No subas `.env.local` a GitHub.
- No compartas `DISCORD_BOT_TOKEN`.
- No compartas `SUPABASE_SERVICE_ROLE_KEY`.
- No uses nombres como `NEXT_PUBLIC_GROQ_API_KEY`.
- Cambia `ADMIN_SECRET` y `CRON_SECRET` por valores largos.
- Si un token aparece públicamente, regénéralo inmediatamente.


Consulta también `SUPABASE-CONFIGURACION.md` para la instalación adaptada a este proyecto.
