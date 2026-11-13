# Monitoreo de Bancos de Sangre Tipo II · Fenómeno El Niño

Aplicación web de la Dirección de Banco de Sangre y Hemoterapia (DIBAN – DIGDOT – MINSA)
para organizar el monitoreo de los bancos de sangre tipo II en el contexto del Fenómeno El Niño.

- Muestra el equipo técnico de la DIBAN, agrupado por equipos, con los bancos de sangre y regiones asignados a cada integrante.
- Por región registra el coordinador regional de PRONAHEBAS y sus alternos (nombre, teléfono, correo) y, por banco de sangre, el jefe (nombre, teléfono, correo), el estado del monitoreo y observaciones.
- Exporta la lista a Excel e imprime. Los datos registrados se guardan en el navegador.

## Datos y asignaciones

Todo está en `app/src/data/`:

| Archivo | Contenido |
|---|---|
| `monitoreoData.js` | Regiones con su coordinador regional y los 86 bancos tipo II (registro nacional del 05.11.2026). |
| `equipoDiban.js` | Integrantes de la DIBAN: equipo, rol de coordinador y profesión. |
| `asignaciones.js` | Asignación de bancos a cada integrante (por región y, en Lima, por banco). **Es la única fuente de las asignaciones**: se cambia en este archivo, no desde la pantalla. |

## Desarrollo

```bash
cd app
npm ci
npm run dev
```

El despliegue a GitHub Pages es automático al subir cambios de `app/` a `main` (`.github/workflows/deploy-pages.yml`).
