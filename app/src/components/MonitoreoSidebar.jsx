import logo from '../assets/minsa-logo.png';
import { EQUIPOS, EQUIPO_DIBAN } from '../data/equipoDiban.js';
import { iniciales, responsablesDe } from '../lib/monitoreo.js';
import { navButtonStyle, actaButtonStyle, inputStyle } from '../lib/styles.js';

export default function MonitoreoSidebar({
  view, activeRegion, filtro, setFiltro, visibleRegions, bancosPorRegion, regionStatsOf, totals,
  goResumen, goRegion, exportExcel, open, onClose
}) {
  const withClose = (fn) => (...args) => { fn(...args); if (onClose) onClose(); };
  const handleResumen = withClose(goResumen);
  const handleRegion = withClose(goRegion);
  const handleExport = withClose(exportExcel);

  const pctMonitoreados = totals.bancos ? Math.round((totals.monitoreados / totals.bancos) * 100) : 0;

  return (
    <div id="bs2-sidebar" className={open ? 'bs2-sidebar-open' : ''} style={{ width: 288, flexShrink: 0, background: '#ffffff', borderRight: '1px solid #dedddb', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="bs2-sb-header" style={{ padding: '20px 20px 16px', borderBottom: '1px solid #dedddb', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <img src={logo} alt="MINSA Perú" className="bs2-sb-logo" style={{ height: 30, objectFit: 'contain', display: 'block', marginBottom: 12 }} />
          <div className="bs2-sb-title" style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25 }}>Monitoreo Bancos de Sangre Tipo II</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#000', letterSpacing: '.03em', marginTop: 2 }}>Fenómeno El Niño · DIBAN · MINSA</div>
        </div>
        <button onClick={onClose} aria-label="Cerrar menú" className="bs2-sidebar-close" style={{ display: 'none', background: 'none', border: '1px solid #d7d7d5', borderRadius: 8, fontSize: 16, padding: '4px 9px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
      </div>

      <div className="bs2-sb-quicknav" style={{ padding: '14px 14px 6px' }}>
        <button onClick={handleResumen} style={navButtonStyle(view === 'resumen')}>
          <span style={{ fontSize: 13.5 }}>📊 Equipo y asignaciones</span>
        </button>
        <div style={{ marginTop: 10 }}>
          <label htmlFor="mon-filtro" style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#717171', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 6px 4px' }}>Ver regiones de</label>
          <select id="mon-filtro" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }}>
            <option value="">Todo el equipo</option>
            {EQUIPOS.map(eq => (
              <optgroup key={eq} label={eq}>
                {EQUIPO_DIBAN.filter(m => m.equipo === eq).map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="bs2-sb-navlist" style={{ flex: 1, overflowY: 'auto', padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#717171', letterSpacing: '.08em', textTransform: 'uppercase', margin: '10px 6px 2px' }}>Regiones ({visibleRegions.length})</div>
        {visibleRegions.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#717171', fontStyle: 'italic', padding: '4px 8px' }}>Ninguna región con este filtro.</div>
        )}
        {visibleRegions.map(r => {
          const st = regionStatsOf(r.key);
          const resp = responsablesDe(bancosPorRegion[r.key] || []);
          const active = view === 'region' && r.key === activeRegion;
          return (
            <button key={r.key} onClick={() => handleRegion(r.key)} style={navButtonStyle(active)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.8, fontWeight: 600, lineHeight: 1.25, textAlign: 'left', minWidth: 0 }}>{r.key}</span>
                <span style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {resp.length === 0 && <span style={{ fontSize: 10.5, color: '#808080' }}>sin asignar</span>}
                  {resp.slice(0, 3).map(m => (
                    <span key={m.id} title={m.nombre} style={{ background: '#000', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '1px 6px' }}>{iniciales(m.nombre)}</span>
                  ))}
                  {resp.length > 3 && <span style={{ fontSize: 10, fontWeight: 800 }}>+{resp.length - 3}</span>}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#717171', marginTop: 2 }}>
                {st.bancos} {st.bancos === 1 ? 'banco' : 'bancos'} · {st.pct}% contactos
              </div>
              <div style={{ height: 3, borderRadius: 3, background: '#e4e4e2', marginTop: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: st.pct + '%', background: '#000', borderRadius: 3 }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="bs2-sb-footer" style={{ padding: 14, borderTop: '1px solid #dedddb', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11.5, color: '#636363', display: 'flex', justifyContent: 'space-between' }}>
          <span>Bancos monitoreados</span><span style={{ fontWeight: 700 }}>{totals.monitoreados}/{totals.bancos}</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: '#e4e4e2', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pctMonitoreados + '%', background: '#000', borderRadius: 6 }} />
        </div>
        <button onClick={handleExport} style={actaButtonStyle}>⬇ Exportar lista a Excel</button>
        <div style={{ fontSize: 10.5, color: '#8f8f8d' }}>Guardado automáticamente en este navegador</div>
      </div>
    </div>
  );
}
