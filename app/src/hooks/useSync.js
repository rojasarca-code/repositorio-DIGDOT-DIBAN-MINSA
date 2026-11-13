import { useCallback, useEffect, useRef, useState } from 'react';
import {
  aplicarRemotos, clearCfg, clearSnap, llamarServicio, loadCfg, loadSnap, registrosLocales, registrosPendientes,
  saveCfg, saveSnap, urlValida
} from '../lib/sync.js';

const INTERVALO_MS = 30000;
const ESPERA_CAMBIOS_MS = 2500;

/**
 * Mantiene los datos del monitoreo sincronizados con la hoja de Google Sheets.
 * Sin dirección y clave configuradas no hace nada (la app funciona solo con los
 * datos guardados en este dispositivo).
 */
export function useSync(mon, setMon) {
  const [cfg, setCfg] = useState(loadCfg);
  const [estado, setEstado] = useState({ fase: 'apagado', mensaje: '', ultima: '' });

  const monRef = useRef(mon);
  const cfgRef = useRef(cfg);
  const snapRef = useRef(null);
  const enCurso = useRef(false);
  const pendiente = useRef(false);

  useEffect(() => { monRef.current = mon; }, [mon]);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  const activo = !!(cfg.url && cfg.clave && urlValida(cfg.url));

  const sync = useCallback(async (forzarTodo) => {
    const c = cfgRef.current;
    if (!c.clave || !urlValida(c.url)) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setEstado(e => ({ ...e, fase: 'error', mensaje: 'Sin conexión a internet. Los cambios se enviarán cuando vuelva.' }));
      return;
    }
    if (enCurso.current) { pendiente.current = true; return; }
    enCurso.current = true;
    setEstado(e => ({ ...e, fase: 'sincronizando', mensaje: '' }));
    try {
      if (!snapRef.current) snapRef.current = loadSnap();
      const snap = snapRef.current;

      // 1) Enviar lo que cambió en este dispositivo.
      const locales = registrosLocales(monRef.current);
      const pend = registrosPendientes(locales, snap, forzarTodo === true);
      if (pend.length) {
        const cuerpo = { accion: 'guardar', regiones: [], bancos: [] };
        pend.forEach(k => { (k.charAt(0) === 'r' ? cuerpo.regiones : cuerpo.bancos).push(locales[k].payload); });
        const res = await llamarServicio(c, cuerpo);
        pend.forEach(k => { snap[k] = { json: locales[k].json, ts: (res.ts && res.ts[k]) || '' }; });
      }

      // 2) Descargar lo que cambió en el servicio.
      const remoto = await llamarServicio(c, { accion: 'leer' });
      const instantanea = { ...snap };
      const r = aplicarRemotos(monRef.current, remoto, instantanea);
      Object.keys(r.aplicados).forEach(k => { snap[k] = r.aplicados[k]; });
      if (r.next !== monRef.current) {
        setMon(prev => aplicarRemotos(prev, remoto, instantanea).next);
      }
      saveSnap(snap);
      setEstado({ fase: 'ok', mensaje: '', ultima: new Date().toISOString() });
    } catch (err) {
      const mensaje = err && err.message ? err.message : 'No se pudo sincronizar.';
      if (err && err.codigo === 'clave') {
        // Clave incorrecta: se vuelve al formulario para escribirla de nuevo.
        const sinClave = { ...cfgRef.current, clave: '' };
        saveCfg(sinClave);
        cfgRef.current = sinClave;
        setCfg(sinClave);
        setEstado({ fase: 'error', mensaje, ultima: '' });
      } else {
        setEstado(e => ({ ...e, fase: 'error', mensaje }));
      }
    } finally {
      enCurso.current = false;
      if (pendiente.current) {
        pendiente.current = false;
        setTimeout(() => sync(false), 500);
      }
    }
  }, [setMon]);

  // Enviar cambios poco después de editar.
  useEffect(() => {
    if (!activo) return undefined;
    const t = setTimeout(() => sync(false), ESPERA_CAMBIOS_MS);
    return () => clearTimeout(t);
  }, [mon, activo, sync]);

  // Revisar cambios de otras personas cada cierto tiempo y al volver a la pestaña.
  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => { if (document.visibilityState === 'visible') sync(false); }, INTERVALO_MS);
    const alVolver = () => { if (document.visibilityState === 'visible') sync(false); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('online', alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('online', alVolver);
    };
  }, [activo, sync]);

  // Al restablecer los datos de origen se descarta la referencia de sincronización,
  // de modo que los datos se vuelven a descargar de la hoja en vez de borrarla.
  useEffect(() => {
    const alRestablecer = () => { snapRef.current = {}; clearSnap(); };
    window.addEventListener('bs2:restablecer', alRestablecer);
    return () => window.removeEventListener('bs2:restablecer', alRestablecer);
  }, []);

  const conectar = useCallback((nuevo) => {
    const limpio = { url: String(nuevo.url || '').trim(), clave: String(nuevo.clave || '').trim(), usuario: String(nuevo.usuario || '').trim() };
    saveCfg(limpio);
    cfgRef.current = limpio;
    setCfg(limpio);
    setTimeout(() => sync(false), 0);
  }, [sync]);

  const desconectar = useCallback(() => {
    clearCfg();
    clearSnap();
    snapRef.current = {};
    const vacio = { ...loadCfg(), clave: '', usuario: '' };
    cfgRef.current = vacio;
    setCfg(vacio);
    setEstado({ fase: 'apagado', mensaje: '', ultima: '' });
  }, []);

  return {
    cfg, activo, estado,
    sincronizarAhora: () => sync(false),
    enviarTodo: () => sync(true),
    conectar, desconectar
  };
}
