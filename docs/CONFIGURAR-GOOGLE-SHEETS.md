# Datos compartidos con Google Sheets

Por defecto, lo que cada persona registra (contactos, estados y observaciones) se guarda solo en su
navegador. Con esta configuración los datos se guardan en una **hoja de cálculo de Google** de la cuenta
del equipo y todos los dispositivos ven lo mismo.

Se hace **una sola vez**, con la cuenta `calidaddigdotdiban@gmail.com`. La contraseña de la cuenta la
escribe únicamente quien configura, en la página de Google; no se comparte ni se pone en ningún código.

## 1. Crear la hoja

1. Entra a <https://drive.google.com> con la cuenta del equipo.
2. **Nuevo → Hojas de cálculo de Google**. Ponle el nombre *Monitoreo bancos de sangre tipo II DIBAN*.

## 2. Pegar el programa

1. En la hoja: **Extensiones → Apps Script**.
2. Borra el código que aparece y pega todo el contenido de [`google-sheets/Code.gs`](google-sheets/Code.gs).
3. En la línea `var CLAVE_EQUIPO = 'CAMBIAR-ESTA-CLAVE';` escribe una **clave propia** (por ejemplo, una
   frase de 3 o 4 palabras). Es la que usará el equipo para conectarse.
4. Pulsa **Guardar** (icono del disquete).

> **Si creaste el programa suelto en <script.google.com> (y no desde la hoja):** en `Code.gs` pega en
> `ID_HOJA` el ID de la hoja de cálculo (la parte larga de su dirección entre `/d/` y `/edit`).
> Si lo creaste desde la hoja con *Extensiones > Apps Script*, deja `ID_HOJA` vacío.

## 3. Crear las hojas internas y dar permiso

1. En el selector de funciones (arriba) elige `inicializarHojas` y pulsa **Ejecutar**.
2. Google pedirá autorización. Es normal, porque el programa es tuyo y no está verificado:
   **Revisar permisos → elige la cuenta → Configuración avanzada → Ir a (nombre del proyecto) → Permitir**.
3. Vuelve a la hoja: ya tiene las pestañas **Regiones** y **Bancos**.

## 4. Publicar

1. **Implementar → Nueva implementación**.
2. En el engranaje elige **Aplicación web**.
3. **Ejecutar como:** *Yo* · **Quién tiene acceso:** *Cualquier persona*.
   (El acceso es "cualquier persona" para que la aplicación pueda conectarse; los datos solo se
   entregan a quien escriba la clave.)
4. Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).

## 5. Conectar la aplicación

1. Abre la aplicación → **Equipo y asignaciones** → tarjeta *Datos compartidos (Google Sheets)*.
2. Pega la URL, escribe la clave y pulsa **Conectar**.
3. **Solo la primera vez y solo una persona:** pulsa **Enviar todos los datos a la hoja**. Con eso la hoja
   queda con las 30 regiones y los 86 bancos.
4. El resto del equipo solo escribe la URL y la clave y pulsa **Conectar**; recibe los datos de la hoja.

Para que nadie tenga que pegar la URL, se puede dejar escrita en `app/src/data/sync.js`
(`SYNC_URL_PREDETERMINADA`); entonces solo se pide la clave.

## Cómo funciona

- Los cambios se envían solos unos segundos después de escribirlos y se revisan los de otras personas
  cada 30 segundos y al volver a la pestaña.
- Si dos personas cambian **el mismo banco o la misma región** al mismo tiempo, queda el último que
  guardó. Cada banco y cada región se guarda por separado, así que cambios en bancos distintos no se pisan.
- Sin internet, la app sigue funcionando y guarda en el dispositivo; envía los cambios al volver la conexión.
- También se pueden corregir a mano las columnas visibles de la hoja (jefe, teléfono, correo y estado en
  **Bancos**; coordinador, teléfono y correo en **Regiones**). La aplicación toma esos cambios.
  No edites las columnas `observaciones_json`, `registro_manual_json` ni `alternos_json`.
- **Restablecer datos de origen** en la aplicación no borra la hoja: descarta lo local y vuelve a descargar.

## Mantenimiento

- **Cambiar la clave:** edita `CLAVE_EQUIPO` en el programa y publica una versión nueva
  (**Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**). La URL no cambia.
  Cada persona vuelve a escribir la clave nueva.
- **Quitar el acceso a alguien:** cambia la clave como arriba.
- **Descargar los datos:** en la hoja, **Archivo → Descargar → Microsoft Excel (.xlsx)**.
- **Si la hoja se daña:** borra las pestañas *Bancos* y *Regiones*; se vuelven a crear solas y se cargan
  con **Enviar todos los datos a la hoja**.
