import { initialMonitoreo, miembroPorId } from './monitoreo.js';
import { SYNC_URL_PREDETERMINADA } from '../data/sync.js';

// Sincronización de los datos registrados con una hoja de Google Sheets
// (servicio en Google Apps Script, ver docs/google-sheets/Code.gs).
//
// Cada región y cada banco es un "registro" con una versión (ts) que fija el
// servicio al guardarlo. Un registro se envía cuando cambió en este dispositivo
// respecto de lo último sincronizado; los registros que cambiaron en el servicio
// se descargan, salvo que estén modificados aquí (gana el último en guardar).

const CFG_KEY = 'bs2_sync_cfg_v1';
const SNAP_KEY = 'bs2_sync_snap_v1';

const str = v => (v === null || v === undefined ? '' : String(v));

// ---------------------------------------------------------------- configuración

export function loadCfg() {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_KEY) || 'null') || {};
    return { url: c.url || SYNC_URL_PREDETERMINADA, clave: c.clave || '', usuario: c.usuario || '' };
  } catch {
    return { url: SYNC_URL_PREDETERMINADA, clave: '', usuario: '' };
  }
}

export function saveCfg(cfg) {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch { /* storage unavailable */ }
}

export function clearCfg() {
  try {
    localStorage.removeItem(CFG_KEY);
  } catch { /* storage unavailable */ }
}

export function loadSnap() {
  try {
    return JSON.parse(localStorage.getItem(SNAP_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

export function saveSnap(snap) {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
  } catch { /* storage unavailable */ }
}

export function clearSnap() {
  try {
    localStorage.removeItem(SNAP_KEY);
  } catch { /* storage unavailable */ }
}

export const urlValida = url => /^https:\/\/script\.google\.com\/.+\/exec$/.test(str(url).trim());

// ---------------------------------------------------------------- registros

const normAlternos = lista => (Array.isArray(lista) ? lista : []).map(a => ({ nombre: str(a && a.nombre), tel: str(a && a.tel), correo: str(a && a.correo) }));
const normObs = lista => (Array.isArray(lista) ? lista : []).map(o => ({ texto: str(o && o.texto), fecha: str(o && o.fecha) }));

export const jsonRegion = r => JSON.stringify([
  str(r.coordNombre), str(r.coordTel), str(r.coordCorreo),
  normAlternos(r.alternos).map(a => [a.nombre, a.tel, a.correo])
]);

const CAMPOS_MANUAL = ['ipress', 'renipress', 'region', 'dirsa', 'categoria', 'subsector', 'provincia', 'distrito', 'nota'];

export const jsonBanco = b => JSON.stringify([
  str(b.jefe), str(b.tel), str(b.correo), str(b.estado) || 'PENDIENTE',
  normObs(b.observaciones).map(o => [o.fecha, o.texto]),
  b.custom ? CAMPOS_MANUAL.map(c => str(b[c])) : null,
  b.custom ? !!b.eliminado : null
]);

function manualDe(b) {
  const m = { custom: true, eliminado: !!b.eliminado };
  CAMPOS_MANUAL.forEach(c => { m[c] = str(b[c]); });
  return m;
}

// Valores de origen de cada registro: un dispositivo que nunca modificó un
// registro no lo envía (así no pisa lo que ya tiene el servicio).
let pristineCache = null;
function pristine() {
  if (!pristineCache) {
    const base = initialMonitoreo();
    pristineCache = {};
    Object.keys(base.regions).forEach(k => { pristineCache['r:' + k] = jsonRegion(base.regions[k]); });
    base.bancos.forEach(b => { pristineCache['b:' + b.id] = jsonBanco(b); });
  }
  return pristineCache;
}

/** Registros del estado local: clave → { json, payload } (payload es lo que se envía al servicio). */
export function registrosLocales(mon) {
  const out = {};
  Object.keys(mon.regions).forEach(k => {
    const r = mon.regions[k];
    out['r:' + k] = {
      json: jsonRegion(r),
      payload: { key: k, coordNombre: str(r.coordNombre), coordTel: str(r.coordTel), coordCorreo: str(r.coordCorreo), alternos: normAlternos(r.alternos) }
    };
  });
  mon.bancos.forEach(b => {
    const m = miembroPorId(b.asignado);
    out['b:' + b.id] = {
      json: jsonBanco(b),
      payload: {
        id: b.id, region: str(b.region), ipress: str(b.ipress), responsable: m ? m.nombre : '',
        jefe: str(b.jefe), tel: str(b.tel), correo: str(b.correo), estado: str(b.estado) || 'PENDIENTE',
        observaciones: normObs(b.observaciones), manual: b.custom ? manualDe(b) : undefined
      }
    };
  });
  return out;
}

/** Claves de los registros que cambiaron en este dispositivo desde la última sincronización. */
export function registrosPendientes(locales, snap, forzarTodo) {
  const p = pristine();
  return Object.keys(locales).filter(k => forzarTodo || locales[k].json !== (snap[k] ? snap[k].json : p[k]));
}

function bancoDesdeRemoto(base, s) {
  const m = s.manual && typeof s.manual === 'object' ? { ...s.manual, custom: true } : null;
  return {
    ...(base || {}),
    ...(m || {}),
    jefe: str(s.jefe), tel: str(s.tel), correo: str(s.correo),
    estado: str(s.estado) || 'PENDIENTE',
    observaciones: normObs(s.observaciones)
  };
}

/**
 * Aplica los registros del servicio al estado local. Devuelve { next, aplicados }:
 * `aplicados` indica qué versión del servicio quedó reflejada para cada clave.
 * Es una función pura (no toca el almacenamiento) para poder usarla dentro de setState.
 */
export function aplicarRemotos(mon, remoto, snap) {
  const p = pristine();
  const aplicados = {};
  let cambio = false;
  const regions = { ...mon.regions };
  let bancos = mon.bancos;

  (remoto.regiones || []).forEach(s => {
    const k = 'r:' + s.key;
    const actual = regions[s.key];
    if (!actual) return;
    const base = snap[k] ? snap[k].json : p[k];
    if (jsonRegion(actual) !== base) return; // modificado aquí: se enviará en la próxima sincronización
    const nuevo = { ...actual, coordNombre: str(s.coordNombre), coordTel: str(s.coordTel), coordCorreo: str(s.coordCorreo), alternos: normAlternos(s.alternos) };
    aplicados[k] = { json: jsonRegion(nuevo), ts: str(s.ts) };
    if (jsonRegion(nuevo) !== jsonRegion(actual)) { regions[s.key] = nuevo; cambio = true; }
  });

  (remoto.bancos || []).forEach(s => {
    const k = 'b:' + s.id;
    const idx = bancos.findIndex(b => b.id === s.id);
    const actual = idx >= 0 ? bancos[idx] : null;
    if (!actual && !(s.manual && s.manual.custom)) return; // banco desconocido que no es manual
    const base = snap[k] ? snap[k].json : p[k];
    if (actual && jsonBanco(actual) !== base) return;
    const nuevo = actual
      ? bancoDesdeRemoto(actual, s)
      : { id: s.id, dirsa: '', asignado: '', ...bancoDesdeRemoto(null, s) };
    aplicados[k] = { json: jsonBanco(nuevo), ts: str(s.ts) };
    if (!actual) {
      bancos = [...bancos, nuevo];
      cambio = true;
    } else if (jsonBanco(nuevo) !== jsonBanco(actual)) {
      bancos = bancos === mon.bancos ? bancos.slice() : bancos;
      bancos[idx] = nuevo;
      cambio = true;
    }
  });

  return { next: cambio ? { ...mon, regions, bancos } : mon, aplicados };
}

// ---------------------------------------------------------------- red

export async function llamarServicio(cfg, cuerpo) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), 25000);
  let data;
  try {
    // text/plain evita la consulta previa (CORS preflight) que Apps Script no admite.
    const resp = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...cuerpo, clave: cfg.clave, usuario: cfg.usuario || '' }),
      signal: control.signal
    });
    data = await resp.json();
  } catch {
    throw new Error('No se pudo conectar con el servicio. Revisa la dirección y la conexión a internet.');
  } finally {
    clearTimeout(timer);
  }
  if (!data || !data.ok) {
    if (data && data.error === 'clave') {
      const e = new Error('La clave del equipo no es correcta.');
      e.codigo = 'clave';
      throw e;
    }
    if (data && data.error === 'tamano') throw new Error('Se intentaron enviar demasiados registros a la vez.');
    throw new Error('El servicio respondió con un error. Revisa la publicación del script.');
  }
  return data;
}

// ---------------------------------------------------------------- texto de estado

function hora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function textoEstadoSync(sync) {
  if (!sync.activo) return 'Sincronización apagada';
  if (sync.estado.fase === 'sincronizando') return 'Sincronizando…';
  if (sync.estado.fase === 'error') return 'Sin sincronizar';
  return sync.estado.ultima ? 'Sincronizado a las ' + hora(sync.estado.ultima) : 'Conectado';
}
