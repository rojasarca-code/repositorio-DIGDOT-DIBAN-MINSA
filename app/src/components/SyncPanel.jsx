import { useState } from 'react';
import { inputStyle, secNavButtonStyle, actaButtonStyleInline } from '../lib/styles.js';
import { urlValida, textoEstadoSync } from '../lib/sync.js';
import { SYNC_URL_PREDETERMINADA } from '../data/sync.js';
import { cardStyle, mutedText, Campo, Chip } from './MonCampos.jsx';

export default function SyncPanel({ sync }) {
  const [url, setUrl] = useState(sync.cfg.url || '');
  const [clave, setClave] = useState('');
  const [usuario, setUsuario] = useState(sync.cfg.usuario || '');
  const [error, setError] = useState('');

  const conectar = () => {
    if (!urlValida(url)) { setError('La dirección debe empezar con https://script.google.com/ y terminar en /exec.'); return; }
    if (!clave.trim()) { setError('Escribe la clave del equipo.'); return; }
    setError('');
    sync.conectar({ url, clave, usuario });
    setClave('');
  };

  const enviarTodo = () => {
    if (window.confirm('Se enviarán todos los datos de este dispositivo a la hoja y se reemplazará lo que haya en ella. Hazlo solo la primera vez, para cargar las regiones y bancos. ¿Continuar?')) {
      sync.enviarTodo();
    }
  };

  const fase = sync.estado.fase;

  return (
    <div className="mon-card mon-noprint" style={{ ...cardStyle, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>Datos compartidos (Google Sheets)</div>
        {sync.activo ? <Chip solid={fase === 'ok'}>{textoEstadoSync(sync)}</Chip> : <Chip>Solo en este dispositivo</Chip>}
      </div>

      {!sync.activo && (
        <div>
          <div style={{ ...mutedText, margin: '6px 0 12px' }}>
            Mientras no se conecte, lo que registres queda solo en este dispositivo. Al conectar con la hoja del equipo,
            todos ven los mismos contactos, estados y observaciones.
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {!SYNC_URL_PREDETERMINADA && (
              <Campo label="Dirección del servicio (termina en /exec)">
                <input id="sync-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" inputMode="url" autoCapitalize="none" autoCorrect="off" style={inputStyle} />
              </Campo>
            )}
            <div className="mon-grid-2">
              <Campo label="Clave del equipo">
                <input id="sync-clave" type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="Clave que te dio la DIBAN" autoComplete="off" style={inputStyle} />
              </Campo>
              <Campo label="Tu nombre (opcional)">
                <input id="sync-usuario" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Para saber quién registró cada cambio" style={inputStyle} />
              </Campo>
            </div>
          </div>
          {(error || sync.estado.mensaje) && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>{error || sync.estado.mensaje}</div>}
          <div style={{ marginTop: 14 }}>
            <button onClick={conectar} style={actaButtonStyleInline}>Conectar</button>
          </div>
        </div>
      )}

      {sync.activo && (
        <div>
          <div style={{ ...mutedText, margin: '6px 0 0' }}>
            Los cambios se envían solos unos segundos después de escribirlos y se revisan los de otras personas cada 30 segundos.
          </div>
          {fase === 'error' && sync.estado.mensaje && (
            <div style={{ marginTop: 10, padding: '8px 12px', border: '1.5px solid #000', borderRadius: 8, fontSize: 13 }}>
              <b>Atención:</b> {sync.estado.mensaje} Tus cambios siguen guardados en este dispositivo.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <button onClick={sync.sincronizarAhora} style={actaButtonStyleInline}>Sincronizar ahora</button>
            <button onClick={enviarTodo} style={secNavButtonStyle}>Enviar todos los datos a la hoja</button>
            <button onClick={sync.desconectar} style={secNavButtonStyle}>Desconectar</button>
          </div>
        </div>
      )}
    </div>
  );
}
