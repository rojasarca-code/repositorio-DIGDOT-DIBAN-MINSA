/**
 * Servicio de datos del Monitoreo de Bancos de Sangre Tipo II (DIBAN – DIGDOT – MINSA).
 *
 * Se pega en Extensiones > Apps Script de una hoja de cálculo de Google y se
 * publica como aplicación web (ver docs/CONFIGURAR-GOOGLE-SHEETS.md).
 *
 * La hoja guarda dos tablas legibles:
 *   · "Regiones": coordinador regional de PRONAHEBAS y alternos.
 *   · "Bancos":   jefe, teléfono, correo, estado y observaciones de cada banco.
 * Las columnas técnicas (json) las usa la aplicación; no hace falta tocarlas.
 * Los datos de las columnas visibles también se pueden corregir a mano en la hoja.
 */

// ⚠ Cambia esta clave por una propia antes de publicar. Es la que se escribe una
// sola vez en la aplicación; sin ella el servicio no entrega ni recibe datos.
var CLAVE_EQUIPO = 'CAMBIAR-ESTA-CLAVE';

// Solo si el programa se creó suelto en script.google.com (no desde Extensiones > Apps Script
// de la hoja): pega aquí el ID de la hoja de cálculo, la parte larga de su dirección
// entre /d/ y /edit. Si el programa está dentro de la hoja, déjalo vacío.
var ID_HOJA = '';

var HOJA_BANCOS = 'Bancos';
var HOJA_REGIONES = 'Regiones';

var ENC_BANCOS = ['ID', 'Región', 'Banco de sangre (IPRESS)', 'Responsable DIBAN', 'Jefe del banco', 'Teléfono', 'Correo',
  'Estado de monitoreo', 'Observaciones (texto)', 'Actualizado', 'Usuario', 'observaciones_json', 'registro_manual_json'];
var ENC_REGIONES = ['Región', 'Coordinador regional PRONAHEBAS', 'Teléfono', 'Correo', 'Alternos (texto)', 'Actualizado',
  'Usuario', 'alternos_json'];

var MAX_REGISTROS = 400;
var MAX_TEXTO = 3000;

// ---------------------------------------------------------------- entrada

function doGet() {
  return responder({ ok: true, servicio: 'Monitoreo de bancos de sangre tipo II · DIBAN' });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!req.clave || req.clave !== CLAVE_EQUIPO) return responder({ ok: false, error: 'clave' });
    if (req.accion === 'leer') return responder(leerTodo());
    if (req.accion === 'guardar') return responder(guardarCambios(req));
    return responder({ ok: false, error: 'accion' });
  } catch (err) {
    return responder({ ok: false, error: 'servicio' });
  }
}

/** Cuando alguien corrige una celda visible a mano, marca la fila como actualizada. */
function onEdit(e) {
  try {
    var hoja = e.range.getSheet();
    var fila = e.range.getRow();
    if (fila < 2) return;
    var col = e.range.getColumn();
    var ultima = e.range.getLastColumn();
    if (hoja.getName() === HOJA_BANCOS && ultima >= 5 && col <= 8) marcar(hoja, fila, 10, 11);
    if (hoja.getName() === HOJA_REGIONES && ultima >= 2 && col <= 4) marcar(hoja, fila, 6, 7);
  } catch (err) { /* sin acción */ }
}

/** Solo para programas sueltos (con ID_HOJA): hace que las correcciones a mano en la hoja se detecten. Se ejecuta una vez. */
function instalarDisparador() {
  if (!ID_HOJA) return;
  var libro = SpreadsheetApp.openById(ID_HOJA);
  var hay = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'onEdit'; });
  if (!hay) ScriptApp.newTrigger('onEdit').forSpreadsheet(libro).onEdit().create();
}

/** Opcional: crea las hojas con sus encabezados (también se crean solas al primer uso). */
function inicializarHojas() {
  obtenerHoja(HOJA_REGIONES, ENC_REGIONES);
  obtenerHoja(HOJA_BANCOS, ENC_BANCOS);
}

/**
 * Crea (o rehace) la pestaña "Tablero": una tabla limpia, solo con fórmulas, pensada para
 * conectar Looker Studio u otro tablero. Se actualiza sola cuando cambian las pestañas
 * Bancos y Regiones. Se ejecuta una vez desde el editor.
 */
function crearHojaTablero() {
  obtenerHoja(HOJA_BANCOS, ENC_BANCOS);
  var libro = abrirLibro();
  var hoja = libro.getSheetByName("Tablero");
  if (!hoja) hoja = libro.insertSheet("Tablero");
  hoja.clear();
  var B = "Bancos!";
  var vacio = function (col) { return 'ARRAYFORMULA(IF(' + B + 'A2:A="","",' + col + '))'; };
  var columnas = [
    ["Región", vacio(B + "B2:B")],
    ["Banco de sangre", vacio(B + "C2:C")],
    ["Responsable DIBAN", vacio(B + "D2:D")],
    ["Jefe del banco", vacio(B + "E2:E")],
    ["Teléfono", vacio(B + "F2:F")],
    ["Correo", vacio(B + "G2:G")],
    ["Estado de monitoreo", vacio(B + "H2:H")],
    ["Contacto del jefe", vacio('IF((' + B + 'E2:E<>"")*(' + B + 'F2:F<>"")*(' + B + 'G2:G<>""),"Completo","Faltan datos")')],
    ["Con observaciones", vacio('IF(LEN(' + B + 'I2:I)>0,"Sí","No")')],
    ["Observaciones", vacio(B + "I2:I")],
    ["Última actualización", vacio('IF(' + B + 'J2:J="","",DATEVALUE(LEFT(' + B + 'J2:J,10)))')],
    ["Bancos", vacio("1")]
  ];
  columnas.forEach(function (c, i) {
    hoja.getRange(1, i + 1).setValue(c[0]).setFontWeight("bold");
    hoja.getRange(2, i + 1).setFormula("=" + c[1]);
  });
  hoja.getRange(2, 11, hoja.getMaxRows() - 1, 1).setNumberFormat("yyyy-mm-dd");
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, columnas.length);
}

// ---------------------------------------------------------------- lectura

function leerTodo() {
  var regiones = [];
  var bancos = [];

  leerFilas(obtenerHoja(HOJA_REGIONES, ENC_REGIONES), ENC_REGIONES.length).forEach(function (f) {
    if (!texto(f[0])) return;
    regiones.push({
      key: texto(f[0]),
      coordNombre: texto(f[1]),
      coordTel: texto(f[2]),
      coordCorreo: texto(f[3]),
      alternos: jsonSeguro(f[7], []),
      ts: texto(f[5])
    });
  });

  leerFilas(obtenerHoja(HOJA_BANCOS, ENC_BANCOS), ENC_BANCOS.length).forEach(function (f) {
    if (!texto(f[0])) return;
    bancos.push({
      id: texto(f[0]),
      jefe: texto(f[4]),
      tel: texto(f[5]),
      correo: texto(f[6]),
      estado: texto(f[7]),
      observaciones: jsonSeguro(f[11], []),
      manual: jsonSeguro(f[12], null),
      ts: texto(f[9])
    });
  });

  return { ok: true, regiones: regiones, bancos: bancos, ahora: ahoraISO() };
}

// -------------------------------------------------------------- escritura

function guardarCambios(req) {
  var regiones = Array.isArray(req.regiones) ? req.regiones : [];
  var bancos = Array.isArray(req.bancos) ? req.bancos : [];
  if (regiones.length > MAX_REGISTROS || bancos.length > MAX_REGISTROS) return { ok: false, error: 'tamano' };

  var cerrojo = LockService.getScriptLock();
  cerrojo.waitLock(25000);
  try {
    var ahora = ahoraISO();
    var usuario = limitar(req.usuario).slice(0, 60) || 'aplicación';
    var ts = {};

    var hojaR = obtenerHoja(HOJA_REGIONES, ENC_REGIONES);
    var indiceR = indicePorClave(hojaR);
    regiones.forEach(function (r) {
      var key = limitar(r.key);
      if (!key) return;
      var alternos = Array.isArray(r.alternos) ? r.alternos : [];
      escribirFila(hojaR, indiceR, key, [
        key, limitar(r.coordNombre), limitar(r.coordTel), limitar(r.coordCorreo), textoAlternos(alternos),
        ahora, usuario, JSON.stringify(alternos)
      ]);
      ts['r:' + key] = ahora;
    });

    var hojaB = obtenerHoja(HOJA_BANCOS, ENC_BANCOS);
    var indiceB = indicePorClave(hojaB);
    bancos.forEach(function (b) {
      var id = limitar(b.id);
      if (!id) return;
      var obs = Array.isArray(b.observaciones) ? b.observaciones : [];
      escribirFila(hojaB, indiceB, id, [
        id, limitar(b.region), limitar(b.ipress), limitar(b.responsable), limitar(b.jefe), limitar(b.tel), limitar(b.correo),
        limitar(b.estado), textoObservaciones(obs), ahora, usuario, JSON.stringify(obs),
        b.manual ? JSON.stringify(b.manual) : ''
      ]);
      ts['b:' + id] = ahora;
    });

    SpreadsheetApp.flush();
    return { ok: true, ts: ts, ahora: ahora };
  } finally {
    cerrojo.releaseLock();
  }
}

// --------------------------------------------------------------- utilidades

function obtenerHoja(nombre, encabezados) {
  var libro = abrirLibro();
  var hoja = libro.getSheetByName(nombre);
  if (hoja) return hoja;
  hoja = libro.insertSheet(nombre);
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  // Formato de texto: conserva teléfonos y códigos tal como se escriben.
  hoja.getRange(1, 1, hoja.getMaxRows(), encabezados.length).setNumberFormat('@');
  return hoja;
}

function abrirLibro() {
  return ID_HOJA ? SpreadsheetApp.openById(ID_HOJA) : SpreadsheetApp.getActiveSpreadsheet();
}

function leerFilas(hoja, nColumnas) {
  var n = hoja.getLastRow() - 1;
  if (n < 1) return [];
  return hoja.getRange(2, 1, n, nColumnas).getValues();
}

/** Mapa clave (primera columna) → número de fila. */
function indicePorClave(hoja) {
  var indice = {};
  var n = hoja.getLastRow() - 1;
  if (n < 1) return indice;
  hoja.getRange(2, 1, n, 1).getValues().forEach(function (f, i) {
    var k = texto(f[0]);
    if (k) indice[k] = i + 2;
  });
  return indice;
}

function escribirFila(hoja, indice, clave, valores) {
  var fila = indice[clave];
  if (!fila) {
    fila = Math.max(hoja.getLastRow(), 1) + 1;
    indice[clave] = fila;
  }
  hoja.getRange(fila, 1, 1, valores.length).setNumberFormat('@').setValues([valores]);
}

function marcar(hoja, fila, colTs, colUsuario) {
  hoja.getRange(fila, colTs).setValue(ahoraISO());
  hoja.getRange(fila, colUsuario).setValue('hoja');
}

function textoAlternos(alternos) {
  return alternos.map(function (a, i) {
    return 'Alterno ' + (i + 1) + ': ' + [a.nombre, a.tel, a.correo].filter(function (v) { return v; }).map(limitar).join(' · ');
  }).join('\n');
}

function textoObservaciones(obs) {
  return obs.filter(function (o) { return o && o.texto; }).map(function (o) {
    return (o.fecha ? limitar(o.fecha) + ': ' : '') + limitar(o.texto);
  }).join('\n');
}

function texto(v) {
  return v === null || v === undefined ? '' : String(v);
}

function limitar(v) {
  return texto(v).slice(0, MAX_TEXTO);
}

function jsonSeguro(v, porDefecto) {
  try {
    var s = texto(v);
    return s ? JSON.parse(s) : porDefecto;
  } catch (err) {
    return porDefecto;
  }
}

function ahoraISO() {
  return new Date().toISOString();
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
