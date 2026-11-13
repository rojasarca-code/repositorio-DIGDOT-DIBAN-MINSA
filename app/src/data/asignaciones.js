// Asignación de bancos de sangre tipo II a los integrantes de la DIBAN.
//
// Este archivo es la única fuente de las asignaciones: se modifica por
// indicación de la DIBAN y no se edita desde la pantalla.
//
// Reglas de la distribución vigente:
//  · Médicos (Nicho, Maydana, Cabrero, Macetas, Gendrau, Quispe): 6 bancos.
//  · Licenciados (Huarcaya, Vilchez, Rojas Cáceres, Rufasto, Torres, Rojas Arca,
//    Congona): 5 bancos.
//  · Coordinadores (Celada, Quispicondor, Bustamante, Barbeyto) y Cerón: 3 bancos.
//  · Se priorizan regiones vecinas; las regiones de un solo banco se unen a la
//    más próxima. Lima Centro, Lima Sur y Lima Provincia se reparten por banco
//    (código RENIPRESS) agrupando distritos cercanos.

// Región completa → id del integrante (ver equipoDiban.js).
export const ASIGNACION_REGIONES = {
  // d13 Liliana Nicho
  'LA LIBERTAD': 'd13',
  'LAMBAYEQUE': 'd13',
  // d14 Katherine Maydana
  'LORETO': 'd14',
  'SAN MARTIN': 'd14',
  'UCAYALI': 'd14',
  'PASCO': 'd14',
  // d16 Pamela Cabrero
  'PIURA': 'd16',
  'TUMBES': 'd16',
  // d7 Macetas Aparcana
  'PUNO': 'd7',
  'MOQUEGUA': 'd7',
  'TACNA': 'd7',
  // d15 Yennifer Huarcaya
  'CAJAMARCA': 'd15',
  'AMAZONAS': 'd15',
  // d17 Lilia Vilchez
  'ANCASH': 'd17',
  'HUANUCO': 'd17',
  // d18 Ernesto Rojas
  'JUNIN': 'd18',
  // d8 Lourdes Rufasto
  'AREQUIPA': 'd8',
  'APURIMAC - ABANCAY': 'd8',
  // d9 Karen Torres
  'CUSCO': 'd9',
  'MADRE DE DIOS': 'd9',
  'APURIMAC - ANDAHUAYLAS': 'd9',
  // d11 Elizabeth Congona
  'AYACUCHO': 'd11',
  'HUANCAVELICA': 'd11',
  'ICA': 'd11',
  // d3 Liz Quispicondor
  'CALLAO': 'd3',
  // d1 Alex Celada (Lima Este; además el banco Almenara de Lima Centro)
  'LIMA ESTE': 'd1',
  // d10 Irvin Barbeyto (Lima Norte; además Huacho de Lima Provincia)
  'LIMA NORTE': 'd10'
};

// Excepciones por banco (RENIPRESS → id). Tienen prioridad sobre la región.
export const ASIGNACION_BANCOS = {
  // d5 Angela Quispe: Cercado de Lima, Breña y Pueblo Libre
  '6207': 'd5', // Hospital Nacional Arzobispo Loayza
  '6215': 'd5', // Hospital Nacional Docente Madre Niño San Bartolomé
  '6208': 'd5', // Instituto Nacional Materno Perinatal
  '6206': 'd5', // Hospital Nacional Dos de Mayo
  '6216': 'd5', // Instituto Nacional de Salud del Niño (Breña)
  '6211': 'd5', // Hospital Santa Rosa
  // d2 Jackier Gendrau: Jesús María y San Isidro
  '17024': 'd2', // Hospital Militar Luis Arias Schereiber
  '8720': 'd2', // Hospital Nacional Edgardo Rebagliati Martins
  '18011': 'd2', // INCOR
  '13591': 'd2', // Hospital PNP Luis N. Sáenz
  '9409': 'd2', // Clínica Ricardo Palma
  '9123': 'd2', // Clínica Anglo Americana (Lima Sur)
  // d4 Roberto Rojas: Miraflores, San Borja y Surquillo
  '19049': 'd4', // Clínica Delgado
  '10751': 'd4', // Hospital Central de la FAP
  '16918': 'd4', // INSN San Borja
  '9886': 'd4', // Clínica San Borja
  '6210': 'd4', // INEN
  // d1 Alex Celada
  '9251': 'd1', // Hospital Nacional Guillermo Almenara Irigoyen
  // d6 José Bustamante: Surco y San Juan de Miraflores
  '9988': 'd6', // Clínica San Pablo
  '9989': 'd6', // Clínica Padre Luis Tezza
  '5987': 'd6', // Hospital María Auxiliadora
  // d12 María del Carmen Cerón: Villa María del Triunfo, Villa El Salvador y Cañete
  '18580': 'd12', // Villa María del Triunfo S.A.C. (Guillermo Kaelin)
  '23159': 'd12', // Hospital de Emergencias Villa El Salvador
  '36034': 'd12', // Hospital Regional de Cañete - Rezola
  // d10 Irvin Barbeyto
  '7639': 'd10' // Hospital Regional de Huacho
};

/** Id del integrante responsable de un banco, o '' si no tiene asignación. */
export function responsableDeBanco(banco) {
  return ASIGNACION_BANCOS[banco.renipress] || ASIGNACION_REGIONES[banco.region] || '';
}
