import { useCallback, useEffect, useMemo, useState } from 'react';
import { REGIONES } from '../data/monitoreoData.js';
import {
  MAX_ALTERNOS, emptyContacto, initialMonitoreo, loadMonitoreo, saveMonitoreo, regionStats
} from '../lib/monitoreo.js';
import { exportMonitoreoExcel as exportMonitoreoExcelFile } from '../lib/exportMonitoreo.js';

export function useMonitoreo() {
  const [mon, setMon] = useState(loadMonitoreo);
  const [view, setView] = useState('resumen'); // 'resumen' | 'region'
  const [activeRegion, setActiveRegion] = useState(REGIONES[0].key);
  const [filtro, setFiltro] = useState(''); // '' = todos | id de integrante DIBAN

  useEffect(() => { saveMonitoreo(mon); }, [mon]);

  const bancosPorRegion = useMemo(() => {
    const map = {};
    REGIONES.forEach(r => { map[r.key] = []; });
    mon.bancos.forEach(b => { (map[b.region] || (map[b.region] = [])).push(b); });
    return map;
  }, [mon.bancos]);

  const regionStatsOf = useCallback(
    (key) => regionStats(mon.regions[key], bancosPorRegion[key] || []),
    [mon.regions, bancosPorRegion]
  );

  // Con un filtro por integrante, solo las regiones donde tiene bancos asignados.
  const visibleRegions = useMemo(() => REGIONES.filter(r => (
    !filtro || (bancosPorRegion[r.key] || []).some(b => b.asignado === filtro)
  )), [bancosPorRegion, filtro]);

  const patchRegion = useCallback((key, patch) => {
    setMon(prev => ({ ...prev, regions: { ...prev.regions, [key]: { ...prev.regions[key], ...patch } } }));
  }, []);

  const setRegionField = useCallback((key, field, value) => patchRegion(key, { [field]: value }), [patchRegion]);

  const setAlterno = useCallback((key, idx, field, value) => {
    setMon(prev => {
      const cur = prev.regions[key].alternos.slice();
      cur[idx] = { ...cur[idx], [field]: value };
      return { ...prev, regions: { ...prev.regions, [key]: { ...prev.regions[key], alternos: cur } } };
    });
  }, []);

  const addAlterno = useCallback((key) => {
    setMon(prev => {
      const cur = prev.regions[key].alternos;
      if (cur.length >= MAX_ALTERNOS) return prev;
      return { ...prev, regions: { ...prev.regions, [key]: { ...prev.regions[key], alternos: [...cur, emptyContacto()] } } };
    });
  }, []);

  const removeAlterno = useCallback((key, idx) => {
    setMon(prev => {
      const cur = prev.regions[key].alternos.filter((_, i) => i !== idx);
      return { ...prev, regions: { ...prev.regions, [key]: { ...prev.regions[key], alternos: cur } } };
    });
  }, []);

  const setBancoField = useCallback((id, field, value) => {
    setMon(prev => ({ ...prev, bancos: prev.bancos.map(b => (b.id === id ? { ...b, [field]: value } : b)) }));
  }, []);

  const addBanco = useCallback((regionKey) => {
    const meta = REGIONES.find(r => r.key === regionKey);
    setMon(prev => ({
      ...prev,
      bancos: [...prev.bancos, {
        id: 'c' + Date.now(), renipress: '', region: regionKey, dirsa: meta ? meta.entidad : '', ipress: '',
        categoria: '', subsector: '', provincia: '', distrito: '', jefe: '', tel: '', correo: '', nota: '',
        asignado: '', estado: 'PENDIENTE', obs: '', custom: true
      }]
    }));
  }, []);

  const removeBanco = useCallback((id) => {
    if (!window.confirm('¿Quitar este banco de sangre de la lista?')) return;
    setMon(prev => ({ ...prev, bancos: prev.bancos.filter(b => b.id !== id) }));
  }, []);

  const resetMonitoreo = useCallback(() => {
    if (!window.confirm('¿Restablecer la lista a los datos de origen? Se perderán los contactos, estados y observaciones que hayas registrado.')) return;
    setMon(initialMonitoreo());
    setFiltro('');
    setView('resumen');
  }, []);

  const goResumen = useCallback(() => setView('resumen'), []);
  const goRegion = useCallback((key) => { setActiveRegion(key); setView('region'); }, []);

  const goRelativeRegion = useCallback((delta) => {
    const list = visibleRegions.length ? visibleRegions : REGIONES;
    const idx = list.findIndex(r => r.key === activeRegion);
    const next = idx + delta;
    if (next < 0 || next >= list.length) { setView('resumen'); return; }
    setActiveRegion(list[next].key);
  }, [visibleRegions, activeRegion]);

  const exportExcel = useCallback(() => {
    exportMonitoreoExcelFile({ mon });
  }, [mon]);

  const totals = useMemo(() => {
    const asignados = mon.bancos.filter(b => b.asignado).length;
    const monitoreados = mon.bancos.filter(b => b.estado === 'MONITOREADO').length;
    return { regiones: REGIONES.length, bancos: mon.bancos.length, asignados, monitoreados };
  }, [mon.bancos]);

  return {
    mon, view, activeRegion, filtro, setFiltro, bancosPorRegion, visibleRegions, totals,
    regionStatsOf, setRegionField, setAlterno, addAlterno, removeAlterno,
    setBancoField, addBanco, removeBanco, resetMonitoreo, goResumen, goRegion, goRelativeRegion, exportExcel
  };
}
