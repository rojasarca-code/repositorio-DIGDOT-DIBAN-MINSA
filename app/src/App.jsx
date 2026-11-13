import { useEffect, useState } from 'react';
import { useMonitoreo } from './hooks/useMonitoreo.js';
import { REGIONES } from './data/monitoreoData.js';
import MonitoreoSidebar from './components/MonitoreoSidebar.jsx';
import MonitoreoResumen from './components/MonitoreoResumen.jsx';
import MonitoreoRegion from './components/MonitoreoRegion.jsx';

export default function App() {
  const monitoreo = useMonitoreo();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const main = document.getElementById('bs2-main');
    if (main) main.scrollTo(0, 0);
  }, [monitoreo.view, monitoreo.activeRegion]);

  const regionActiva = REGIONES.find(r => r.key === monitoreo.activeRegion) || REGIONES[0];

  const mobileTitle = monitoreo.view === 'region' ? regionActiva.key : 'Monitoreo El Niño · Bancos Tipo II';

  return (
    <div id="bs2-root" style={{ display: 'flex', height: '100vh', width: '100%', background: 'oklch(98% 0.004 90)', fontFamily: "'Manrope',sans-serif", color: 'oklch(22% 0.01 30)' }}>
      <div id="bs2-mobile-topbar">
        <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">☰</button>
        <div className="bs2-mobile-title">{mobileTitle}</div>
      </div>

      {sidebarOpen && <div className="bs2-overlay" onClick={() => setSidebarOpen(false)} />}

      <MonitoreoSidebar
        view={monitoreo.view}
        activeRegion={monitoreo.activeRegion}
        filtro={monitoreo.filtro}
        setFiltro={monitoreo.setFiltro}
        visibleRegions={monitoreo.visibleRegions}
        bancosPorRegion={monitoreo.bancosPorRegion}
        regionStatsOf={monitoreo.regionStatsOf}
        totals={monitoreo.totals}
        goResumen={monitoreo.goResumen}
        goRegion={monitoreo.goRegion}
        exportExcel={monitoreo.exportExcel}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div id="bs2-main" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {monitoreo.view === 'resumen' && (
            <MonitoreoResumen
              mon={monitoreo.mon}
              totals={monitoreo.totals}
              bancosPorRegion={monitoreo.bancosPorRegion}
              regionStatsOf={monitoreo.regionStatsOf}
              goRegion={monitoreo.goRegion}
              resetMonitoreo={monitoreo.resetMonitoreo}
              exportExcel={monitoreo.exportExcel}
            />
          )}

          {monitoreo.view === 'region' && (
            <MonitoreoRegion
              region={regionActiva}
              state={monitoreo.mon.regions[regionActiva.key]}
              bancos={monitoreo.bancosPorRegion[regionActiva.key] || []}
              stats={monitoreo.regionStatsOf(regionActiva.key)}
              filtro={monitoreo.filtro}
              setFiltro={monitoreo.setFiltro}
              setRegionField={monitoreo.setRegionField}
              setAlterno={monitoreo.setAlterno}
              addAlterno={monitoreo.addAlterno}
              removeAlterno={monitoreo.removeAlterno}
              setBancoField={monitoreo.setBancoField}
              addBanco={monitoreo.addBanco}
              removeBanco={monitoreo.removeBanco}
              goPrev={() => monitoreo.goRelativeRegion(-1)}
              goNext={() => monitoreo.goRelativeRegion(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
