import { REGIONES, BANCOS_TIPO_II } from '../data/monitoreoData.js';
import { EQUIPO_DIBAN } from '../data/equipoDiban.js';
import { responsableDeBanco } from '../data/asignaciones.js';
import { pad } from './format.js';

export const MON_KEY = 'bs2_monitoreo_v2';

export const ESTADOS_MONITOREO = ['PENDIENTE', 'CONTACTADO', 'MONITOREADO', 'SIN RESPUESTA'];
export const MAX_ALTERNOS = 3;

export const emptyContacto = () => ({ nombre: '', tel: '', correo: '' });

// Campos que el equipo puede editar en cada banco; el resto (incluida la
// asignación) viene siempre de los archivos de datos.
const CAMPOS_EDITABLES_BANCO = ['jefe', 'tel', 'correo', 'estado', 'observaciones'];

export const miembroPorId = (id) => EQUIPO_DIBAN.find(m => m.id === id) || null;

export const emptyObservacion = () => ({ texto: '', fecha: hoyISO() });

/** Fecha local de hoy como AAAA-MM-DD (formato del campo de fecha). */
export function hoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/** AAAA-MM-DD → DD/MM/AAAA. */
export function fmtFecha(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

// Lista de observaciones de un banco guardado; convierte el texto único de
// versiones anteriores (campo `obs`) en una observación.
function observacionesDe(b) {
  if (Array.isArray(b.observaciones)) return b.observaciones;
  if (typeof b.obs === 'string' && b.obs.trim()) return [{ texto: b.obs, fecha: '' }];
  return [];
}

export function initialMonitoreo() {
  const regions = {};
  REGIONES.forEach(r => {
    regions[r.key] = {
      coordNombre: r.coordNombre,
      coordTel: r.coordTel,
      coordCorreo: r.coordCorreo,
      alternos: []
    };
  });

  const bancos = BANCOS_TIPO_II.map(b => ({
    ...b, asignado: responsableDeBanco(b), estado: 'PENDIENTE', observaciones: [], custom: false
  }));

  return { version: 2, regions, bancos };
}

export function loadMonitoreo() {
  const base = initialMonitoreo();
  try {
    const saved = JSON.parse(localStorage.getItem(MON_KEY) || 'null');
    if (!saved || saved.version !== 2) return base;

    const regions = {};
    Object.keys(base.regions).forEach(k => {
      regions[k] = { ...base.regions[k], ...(saved.regions && saved.regions[k]) };
      if (!Array.isArray(regions[k].alternos)) regions[k].alternos = [];
    });

    const guardados = Array.isArray(saved.bancos) ? saved.bancos : [];
    const porId = {};
    guardados.forEach(b => { porId[b.id] = b; });

    // Bancos de origen: asignación vigente de los archivos de datos + ediciones guardadas.
    const bancos = base.bancos.map(b => {
      const s = porId[b.id];
      if (!s) return b;
      const edits = {};
      CAMPOS_EDITABLES_BANCO.forEach(f => { if (s[f] !== undefined) edits[f] = s[f]; });
      return { ...b, ...edits, observaciones: observacionesDe(s) };
    });
    // Bancos agregados manualmente.
    guardados.filter(b => b.custom).forEach(b => bancos.push({ ...b, asignado: b.asignado || '', observaciones: observacionesDe(b) }));

    return { version: 2, regions, bancos };
  } catch {
    return base;
  }
}

export function saveMonitoreo(mon) {
  try {
    localStorage.setItem(MON_KEY, JSON.stringify(mon));
  } catch {
    /* storage unavailable */
  }
}

const filled = v => !!(v && String(v).trim());

/** Avance de registro de contactos de una región (coordinador + jefes de banco). */
export function regionStats(region, bancos) {
  let done = 0, total = 0;
  [region.coordNombre, region.coordTel, region.coordCorreo].forEach(v => { total++; if (filled(v)) done++; });
  bancos.forEach(b => [b.jefe, b.tel, b.correo].forEach(v => { total++; if (filled(v)) done++; }));
  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    bancos: bancos.length,
    monitoreados: bancos.filter(b => b.estado === 'MONITOREADO').length
  };
}

export function iniciales(nombre) {
  const parts = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Ids de integrantes con al menos un banco en la lista dada, en el orden del equipo. */
export function responsablesDe(bancos) {
  const ids = new Set(bancos.map(b => b.asignado).filter(Boolean));
  return EQUIPO_DIBAN.filter(m => ids.has(m.id));
}
