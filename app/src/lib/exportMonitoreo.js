import { REGIONES } from '../data/monitoreoData.js';
import { EQUIPO_DIBAN } from '../data/equipoDiban.js';
import { MAX_ALTERNOS } from './monitoreo.js';
import { pad } from './format.js';

function escXml(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function row(cells, mergeAcross) {
  let out = '<Row>';
  cells.forEach((c, i) => {
    const val = Array.isArray(c) ? c[0] : c;
    const style = Array.isArray(c) ? c[1] : null;
    out += '<Cell' + (i === 0 && mergeAcross ? ' ss:MergeAcross="' + mergeAcross + '"' : '') + (style ? ' ss:StyleID="' + style + '"' : '') +
      '><Data ss:Type="String">' + escXml(val) + '</Data></Cell>';
  });
  return out + '</Row>';
}

function sheet(name, title, headers, dataRows) {
  const widths = headers.map(() => '<Column ss:AutoFitWidth="1" ss:Width="130"/>').join('');
  let rows = row([[title, 'header']], headers.length - 1);
  rows += row(headers.map(h => [h, 'bold']));
  dataRows.forEach(r => { rows += row(r); });
  return '<Worksheet ss:Name="' + escXml(name.slice(0, 31)) + '"><Table>' + widths + rows + '</Table></Worksheet>';
}

export function exportMonitoreoExcel({ mon }) {
  const miembro = id => EQUIPO_DIBAN.find(m => m.id === id);
  const nombreDe = id => (miembro(id) ? miembro(id).nombre : '');
  const bancosDe = key => mon.bancos.filter(b => b.region === key);

  // --- Hoja 1: regiones, responsables, coordinadores y alternos ---
  const altHeaders = [];
  for (let i = 1; i <= MAX_ALTERNOS; i++) altHeaders.push('Alterno ' + i + ' – Nombre', 'Alterno ' + i + ' – Teléfono', 'Alterno ' + i + ' – Correo');
  const hRegiones = ['Región', 'Entidad', 'Supervisores DIBAN asignados', 'N° bancos tipo II',
    'Coordinador regional PRONAHEBAS', 'Teléfono', 'Correo'].concat(altHeaders);
  const rRegiones = REGIONES.map(reg => {
    const st = mon.regions[reg.key];
    const bancos = bancosDe(reg.key);
    const ids = [];
    bancos.forEach(b => { if (b.asignado && ids.indexOf(b.asignado) < 0) ids.push(b.asignado); });
    const alt = [];
    for (let i = 0; i < MAX_ALTERNOS; i++) {
      const a = st.alternos[i] || {};
      alt.push(a.nombre || '', a.tel || '', a.correo || '');
    }
    return [reg.key, reg.entidad, ids.map(nombreDe).join('; '), bancos.length, st.coordNombre, st.coordTel, st.coordCorreo].concat(alt);
  });

  // --- Hoja 2: bancos de sangre tipo II ---
  const hBancos = ['Región', 'Supervisor DIBAN', 'RENIPRESS', 'IPRESS (banco de sangre)', 'Categoría', 'Sub sector', 'Provincia', 'Distrito',
    'Jefe del banco de sangre', 'Teléfono', 'Correo', 'Estado de monitoreo', 'Observaciones', 'Nota (fuente)'];
  const regOrder = {};
  REGIONES.forEach((r, i) => { regOrder[r.key] = i; });
  const rBancos = mon.bancos.slice()
    .sort((a, b) => ((regOrder[a.region] || 0) - (regOrder[b.region] || 0)) || a.ipress.localeCompare(b.ipress))
    .map(b => [b.region, nombreDe(b.asignado), b.renipress, b.ipress, b.categoria, b.subsector,
      b.provincia, b.distrito, b.jefe, b.tel, b.correo, b.estado, b.obs, b.nota]);

  // --- Hoja 3: equipo DIBAN y su carga ---
  const hEquipo = ['Integrante DIBAN', 'Equipo', 'Rol', 'Profesión', 'Celular', 'N° bancos', 'Regiones asignadas', 'Bancos asignados'];
  const rEquipo = EQUIPO_DIBAN.map(m => {
    const suyos = mon.bancos.filter(b => b.asignado === m.id);
    const regs = [];
    suyos.forEach(b => { if (regs.indexOf(b.region) < 0) regs.push(b.region); });
    return [m.nombre, m.equipo, m.coordinador ? 'Coordinador' : 'Integrante', m.profesion, m.celular, suyos.length,
      regs.join('; '), suyos.map(b => b.ipress).join('; ')];
  });

  const styles = '<Styles>' +
    '<Style ss:ID="bold"><Font ss:Bold="1"/></Style>' +
    '<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#000000" ss:Pattern="Solid"/></Style>' +
    '</Styles>';
  const titulo = 'MONITOREO DE BANCOS DE SANGRE TIPO II – FENÓMENO EL NIÑO · DIBAN – DIGDOT – MINSA';
  const xml = '<?xml version="1.0"?>' +
    '<?mso-application progid="Excel.Sheet"?>' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    styles +
    sheet('Regiones y coordinadores', titulo, hRegiones, rRegiones) +
    sheet('Bancos de sangre tipo II', titulo, hBancos, rBancos) +
    sheet('Equipo DIBAN', titulo, hEquipo, rEquipo) +
    '</Workbook>';

  const hoy = new Date();
  const fecha = hoy.getFullYear() + '-' + pad(hoy.getMonth() + 1) + '-' + pad(hoy.getDate());
  const bom = String.fromCharCode(0xFEFF);
  const blob = new Blob([bom + xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'monitoreo-bancos-sangre-tipo-II-fenomeno-el-nino_' + fecha + '.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
