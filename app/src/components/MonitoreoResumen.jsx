import { REGIONES } from '../data/monitoreoData.js';
import { EQUIPOS, EQUIPO_DIBAN } from '../data/equipoDiban.js';
import { actaButtonStyleInline, secNavButtonStyle } from '../lib/styles.js';
import { cardStyle, rowStyle, mutedText, Chip } from './MonCampos.jsx';
import SyncPanel from './SyncPanel.jsx';

const sectionTitle = { fontSize: 15, fontWeight: 800, margin: '30px 0 4px' };
const regionChip = {
  cursor: 'pointer', background: '#fff', border: '1px solid #b7b7b7', borderRadius: 20, padding: '3px 10px',
  fontSize: 11.5, fontWeight: 600, fontFamily: 'Manrope,sans-serif'
};

function Tile({ label, value, sub }) {
  return (
    <div style={{ ...cardStyle, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#636363' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#717171' }}>{sub}</div>}
    </div>
  );
}

/** Cuenta bancos por región: [{ region, n }] en el orden de REGIONES. */
function regionesDe(bancos) {
  const cuenta = {};
  bancos.forEach(b => { cuenta[b.region] = (cuenta[b.region] || 0) + 1; });
  return REGIONES.filter(r => cuenta[r.key]).map(r => ({ region: r.key, n: cuenta[r.key] }));
}

export default function MonitoreoResumen({ sync, mon, totals, bancosPorRegion, regionStatsOf, goRegion, resetMonitoreo, exportExcel }) {
  let done = 0, total = 0;
  REGIONES.forEach(r => { const s = regionStatsOf(r.key); done += s.done; total += s.total; });
  const pctContactos = total ? Math.round((done / total) * 100) : 0;

  const bancosDe = (id) => mon.bancos.filter(b => !b.eliminado && b.asignado === id);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Monitoreo · Bancos de Sangre Tipo II</div>
      <div style={{ fontSize: 14, color: '#636363', marginBottom: 22 }}>
        Lista de monitoreo en el contexto del Fenómeno El Niño. Cada integrante del equipo técnico de la DIBAN tiene bancos
        asignados; en cada región se registra el coordinador regional de PRONAHEBAS y sus alternos, y el jefe de cada banco
        de sangre tipo II (con teléfonos y correos). Las asignaciones las define la DIBAN y no se editan en esta pantalla.
      </div>

      <div className="mon-stats" style={{ marginBottom: 18 }}>
        <Tile label="Bancos de sangre tipo II" value={totals.bancos} sub={totals.asignados + ' con responsable'} />
        <Tile label="Integrantes DIBAN" value={EQUIPO_DIBAN.length} sub={EQUIPOS.length + ' equipos'} />
        <Tile label="Bancos monitoreados" value={totals.monitoreados + '/' + totals.bancos} />
        <Tile label="Contactos registrados" value={pctContactos + '%'} sub="coordinadores y jefes" />
      </div>

      <SyncPanel sync={sync} />

      <div id="bs2-topbar-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={exportExcel} style={actaButtonStyleInline}>⬇ Exportar a Excel</button>
        <button onClick={() => window.print()} style={secNavButtonStyle}>🖶 Imprimir</button>
        <button onClick={resetMonitoreo} style={secNavButtonStyle}>Restablecer datos de origen</button>
      </div>

      {EQUIPOS.map(equipo => {
        const miembros = EQUIPO_DIBAN.filter(m => m.equipo === equipo);
        const nBancos = miembros.reduce((acc, m) => acc + bancosDe(m.id).length, 0);
        return (
          <div key={equipo}>
            <div style={sectionTitle}>Equipo {equipo}</div>
            <div style={{ ...mutedText, marginBottom: 10 }}>
              {miembros.length} {miembros.length === 1 ? 'integrante' : 'integrantes'} · {nBancos} bancos asignados
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {miembros.map(m => {
                const suyos = bancosDe(m.id);
                const regs = regionesDe(suyos);
                return (
                  <div key={m.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div className="bs2-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{m.nombre}</span>
                          {m.coordinador && <Chip solid>Coordinador</Chip>}
                          <Chip>{m.profesion}</Chip>
                        </div>
                        <div style={mutedText}>{m.area} · {m.condicion} · Cel. {m.celular}</div>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                        {suyos.length} {suyos.length === 1 ? 'banco' : 'bancos'}
                      </div>
                    </div>
                    {regs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {regs.map(r => (
                          <button key={r.region} onClick={() => goRegion(r.region)} style={regionChip}>
                            {r.region} <span style={{ opacity: 0.55 }}>({r.n})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={sectionTitle}>Regiones y responsables</div>
      <div style={{ ...mutedText, marginBottom: 10 }}>
        El número entre paréntesis es la cantidad de bancos de sangre tipo II. Algunas regiones, como Lima, se reparten por banco entre varias personas.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REGIONES.map(r => {
          const st = mon.regions[r.key];
          const prog = regionStatsOf(r.key);
          const bancos = bancosPorRegion[r.key] || [];
          const resp = EQUIPO_DIBAN.map(m => ({ m, n: bancos.filter(b => b.asignado === m.id).length })).filter(x => x.n > 0);
          const sinAsignar = bancos.filter(b => !b.asignado).length;
          return (
            <div key={r.key} className="bs2-row" style={rowStyle}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <button onClick={() => goRegion(r.key)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 14, textAlign: 'left', textDecoration: 'underline' }}>
                  {r.key} <span style={{ fontWeight: 600 }}>({bancos.length})</span>
                </button>
                <div style={mutedText}>
                  {r.entidad} · Coordinador: {st.coordNombre || 'sin registrar'} · {prog.pct}% contactos
                </div>
              </div>
              <div className="mon-resp-col">
                {resp.map(({ m, n }) => (
                  <div key={m.id} style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {m.nombre} <span style={{ opacity: 0.55 }}>({n})</span>
                  </div>
                ))}
                {sinAsignar > 0 && <div><Chip>Sin asignar ({sinAsignar})</Chip></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
