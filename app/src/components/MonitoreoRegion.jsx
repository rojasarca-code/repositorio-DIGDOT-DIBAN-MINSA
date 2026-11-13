import { ESTADOS_MONITOREO, MAX_ALTERNOS, miembroPorId, responsablesDe } from '../lib/monitoreo.js';
import { inputStyle, secNavButtonStyle, actaButtonStyleInline } from '../lib/styles.js';
import { cardStyle, mutedText, Campo, Entrada, Chip } from './MonCampos.jsx';
const blockTitle = { fontSize: 15, fontWeight: 800 };
const dangerButton = {
  border: '1px solid #aeaeae', background: '#fff', color: '#000', borderRadius: 8,
  padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Manrope,sans-serif'
};

const vacio = v => !(v && String(v).trim());

function BancoCard({ banco, setBancoField, addObservacion, setObservacion, removeObservacion, removeBanco }) {
  const set = (field) => (value) => setBancoField(banco.id, field, value);
  const observaciones = banco.observaciones || [];
  const faltan = vacio(banco.jefe) || vacio(banco.tel) || vacio(banco.correo);
  const responsable = miembroPorId(banco.asignado);
  const meta = [
    banco.renipress && 'RENIPRESS ' + banco.renipress,
    banco.categoria,
    banco.subsector,
    [banco.distrito, banco.provincia].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ')
  ].filter(Boolean).join(' · ');

  return (
    <div className="mon-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {banco.custom ? (
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Banco agregado manualmente</div>
          ) : (
            <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.3 }}>{banco.ipress}</div>
          )}
          {!banco.custom && <div style={mutedText}>{meta}</div>}
          <div style={{ ...mutedText, marginTop: 4 }}>
            <b style={{ color: '#000' }}>Responsable DIBAN:</b> {responsable ? responsable.nombre + ' · Cel. ' + responsable.celular : 'sin asignar'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {faltan && <Chip>Faltan datos</Chip>}
          {banco.estado === 'MONITOREADO' && <Chip solid>Monitoreado</Chip>}
        </div>
      </div>

      {banco.custom && (
        <div className="mon-grid-3" style={{ marginTop: 12 }}>
          <Entrada label="Nombre del banco de sangre (IPRESS)" value={banco.ipress} onChange={set('ipress')} placeholder="Nombre de la IPRESS" />
          <Entrada label="Código RENIPRESS" value={banco.renipress} onChange={set('renipress')} placeholder="00000" mode="numeric" />
          <Entrada label="Categoría / sub sector" value={banco.categoria} onChange={set('categoria')} placeholder="Ej. II-2 · MINSA" />
        </div>
      )}

      {banco.nota && (
        <div style={{ marginTop: 10, padding: '8px 12px', border: '1.5px solid #000', borderRadius: 8, fontSize: 12.5 }}>
          <b>Atención:</b> {banco.nota}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', margin: '16px 0 8px' }}>Jefe del banco de sangre</div>
      <div className="mon-grid-3" style={{ gridTemplateColumns: '1.6fr 1fr 1fr' }}>
        <Entrada label="Nombre y apellidos" value={banco.jefe} onChange={set('jefe')} placeholder="Jefe del banco de sangre" />
        <Entrada label="Teléfono / celular" value={banco.tel} onChange={set('tel')} placeholder="9XX XXX XXX" mode="tel" />
        <Entrada label="Correo electrónico" value={banco.correo} onChange={set('correo')} placeholder="correo@ejemplo.com" mode="email" />
      </div>

      <div className="mon-estado" style={{ marginTop: 14 }}>
        <Campo label="Estado del monitoreo">
          <select value={banco.estado} onChange={e => setBancoField(banco.id, 'estado', e.target.value)} style={inputStyle}>
            {ESTADOS_MONITOREO.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Campo>
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', margin: '16px 0 8px' }}>
        Observaciones{observaciones.length > 0 ? ' (' + observaciones.length + ')' : ''}
      </div>
      {observaciones.length === 0 && (
        <div style={{ ...mutedText, marginBottom: 8 }}>Aún no hay observaciones para este banco.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {observaciones.map((o, i) => (
          <div key={i} className="mon-obs">
            <div className="mon-obs-fecha">
              <Campo label={'Observación ' + (i + 1) + ' · fecha'}>
                <input type="date" value={o.fecha || ''} onChange={e => setObservacion(banco.id, i, 'fecha', e.target.value)} style={inputStyle} />
              </Campo>
            </div>
            <div className="mon-obs-texto">
              <Campo label="Detalle">
                <textarea
                  rows={2}
                  value={o.texto || ''}
                  onChange={e => setObservacion(banco.id, i, 'texto', e.target.value)}
                  placeholder="Acuerdos, hallazgos, disponibilidad de hemocomponentes…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.4 }}
                />
              </Campo>
            </div>
            <button className="mon-noprint mon-obs-quitar" onClick={() => removeObservacion(banco.id, i)} aria-label={'Quitar observación ' + (i + 1)} style={dangerButton}>Quitar</button>
          </div>
        ))}
      </div>
      <div className="mon-noprint" style={{ marginTop: 10 }}>
        <button onClick={() => addObservacion(banco.id)} style={secNavButtonStyle}>+ Agregar observación</button>
      </div>

      {banco.custom && (
        <div className="mon-noprint" style={{ marginTop: 12 }}>
          <button onClick={() => removeBanco(banco.id)} style={dangerButton}>Quitar este banco</button>
        </div>
      )}
    </div>
  );
}

export default function MonitoreoRegion({
  region, state, bancos, stats, filtro, setFiltro, setRegionField, setAlterno, addAlterno, removeAlterno,
  setBancoField, addObservacion, setObservacion, removeObservacion, addBanco, removeBanco, goPrev, goNext
}) {
  const set = (field) => (value) => setRegionField(region.key, field, value);
  const responsables = responsablesDe(bancos);
  const filtrado = filtro ? miembroPorId(filtro) : null;
  const bancosVisibles = filtrado ? bancos.filter(b => b.asignado === filtro) : bancos;
  const coordFalta = vacio(state.coordNombre) || vacio(state.coordTel) || vacio(state.coordCorreo);
  const lugar = [region.direccion, [region.distrito, region.provincia].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ')].filter(Boolean).join(' · ');

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{region.key}</div>
      <div style={{ fontSize: 13.5, color: '#636363', marginBottom: 4 }}>
        {region.entidad}{lugar ? ' · ' + lugar : ''}
      </div>
      <div style={{ fontSize: 13.5, color: '#636363', marginBottom: 20 }}>
        {stats.bancos} {stats.bancos === 1 ? 'banco de sangre tipo II' : 'bancos de sangre tipo II'} · {stats.monitoreados} monitoreados · {stats.pct}% de contactos registrados
      </div>

      <div className="mon-card" style={cardStyle}>
        <div style={blockTitle}>{responsables.length > 1 ? 'Supervisores DIBAN asignados' : 'Supervisor DIBAN asignado'}</div>
        {responsables.length === 0 && <div style={{ ...mutedText, marginTop: 6 }}>Esta región no tiene bancos asignados.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {responsables.map(m => (
            <div key={m.id} style={{ fontSize: 13.5 }}>
              <b>{m.nombre}</b>
              <span style={mutedText}> · {m.equipo} · Cel. {m.celular} · {bancos.filter(b => b.asignado === m.id).length} de {bancos.length} bancos</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mon-card" style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={blockTitle}>Coordinador regional de PRONAHEBAS</div>
          {coordFalta && <Chip>Faltan datos</Chip>}
        </div>
        <div className="mon-grid-3" style={{ marginTop: 10 }}>
          <Entrada label="Nombres y apellidos" value={state.coordNombre} onChange={set('coordNombre')} placeholder="Coordinador regional" />
          <Entrada label="Teléfono / celular" value={state.coordTel} onChange={set('coordTel')} placeholder="9XX XXX XXX" mode="tel" />
          <Entrada label="Correo electrónico" value={state.coordCorreo} onChange={set('coordCorreo')} placeholder="correo@ejemplo.com" mode="email" />
        </div>

        <div style={{ ...blockTitle, marginTop: 22 }}>Coordinadores alternos</div>
        <div style={{ ...mutedText, marginTop: 2 }}>Hasta {MAX_ALTERNOS} alternos del coordinador regional.</div>
        {state.alternos.map((a, i) => (
          <div key={i} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e4e4e2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Alterno {i + 1}</div>
              <button className="mon-noprint" onClick={() => removeAlterno(region.key, i)} style={dangerButton}>Quitar</button>
            </div>
            <div className="mon-grid-3">
              <Entrada label="Nombres y apellidos" value={a.nombre} onChange={v => setAlterno(region.key, i, 'nombre', v)} placeholder="Coordinador alterno" />
              <Entrada label="Teléfono / celular" value={a.tel} onChange={v => setAlterno(region.key, i, 'tel', v)} placeholder="9XX XXX XXX" mode="tel" />
              <Entrada label="Correo electrónico" value={a.correo} onChange={v => setAlterno(region.key, i, 'correo', v)} placeholder="correo@ejemplo.com" mode="email" />
            </div>
          </div>
        ))}
        {state.alternos.length < MAX_ALTERNOS && (
          <div className="mon-noprint" style={{ marginTop: 14 }}>
            <button onClick={() => addAlterno(region.key)} style={secNavButtonStyle}>+ Agregar alterno</button>
          </div>
        )}
      </div>

      <div style={{ ...blockTitle, margin: '28px 0 10px' }}>Bancos de sangre tipo II de la región ({bancosVisibles.length}{filtrado ? ' de ' + bancos.length : ''})</div>
      {filtrado && (
        <div className="mon-noprint" style={{ ...mutedText, marginBottom: 10 }}>
          Mostrando solo los bancos de {filtrado.nombre}.{' '}
          <button onClick={() => setFiltro('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontSize: 12.5, fontWeight: 700, textDecoration: 'underline' }}>Ver todos los bancos</button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bancos.length === 0 && (
          <div style={{ fontSize: 13.5, color: '#717171', fontStyle: 'italic' }}>
            No hay bancos de sangre tipo II registrados en la base de datos para esta región. Puedes agregar uno manualmente.
          </div>
        )}
        {bancosVisibles.map(b => (
          <BancoCard
            key={b.id}
            banco={b}
            setBancoField={setBancoField}
            addObservacion={addObservacion}
            setObservacion={setObservacion}
            removeObservacion={removeObservacion}
            removeBanco={removeBanco}
          />
        ))}
      </div>
      <div className="mon-noprint" style={{ marginTop: 14 }}>
        <button onClick={() => addBanco(region.key)} style={actaButtonStyleInline}>+ Agregar banco de sangre</button>
      </div>

      <div className="mon-noprint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={goPrev} style={secNavButtonStyle}>← Anterior</button>
        <button onClick={goNext} style={secNavButtonStyle}>Siguiente →</button>
      </div>
    </div>
  );
}
