import { Component } from 'react';

// Evita la pantalla en blanco: si algo falla al mostrar la aplicación, se
// muestra un aviso con la opción de recargar o de restablecer los datos locales.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  restablecer() {
    try {
      Object.keys(localStorage).filter(k => k.indexOf('bs2_') === 0).forEach(k => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;
    const boton = {
      border: '1px solid #000', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'Manrope,sans-serif', background: '#fff', color: '#000'
    };
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 20px', fontFamily: 'Manrope,sans-serif', color: '#1b1b1b' }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No se pudo mostrar la aplicación</div>
        <div style={{ fontSize: 14, color: '#636363', marginBottom: 20 }}>
          Recarga la página. Si el problema continúa, restablece los datos guardados en este dispositivo; las asignaciones
          de la DIBAN no se pierden porque vienen con la aplicación.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ ...boton, background: '#000', color: '#fff' }} onClick={() => window.location.reload()}>Recargar</button>
          <button style={boton} onClick={() => this.restablecer()}>Restablecer datos locales</button>
        </div>
      </div>
    );
  }
}
