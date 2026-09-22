export const INFO = {
  etiqueta: 'Contenedor Docker ',
  notaHistorial: 'Guardado en localStorage',
};
 
const MONEDAS = [
  { codigo: 'USD', nombre: 'Dólar de EE. UU.', valor: 1 },
  { codigo: 'EUR', nombre: 'Euro', valor: 0.92 },
  { codigo: 'GBP', nombre: 'Libra esterlina', valor: 0.79 },
  { codigo: 'COP', nombre: 'Peso colombiano', valor: 4100 },
  { codigo: 'MXN', nombre: 'Peso mexicano', valor: 17.5 },
  { codigo: 'JPY', nombre: 'Yen japonés', valor: 150 },
  { codigo: 'GTQ', nombre: 'Quetzal guatemalteco', valor: 7.7 },
  { codigo: 'RUB', nombre: 'Rublo ruso', valor: 90 },
  { codigo: 'KWD', nombre: 'Dinar kuwaití', valor: 0.31 },
];

const DIAS = 30;
const MAX_HISTORIAL = 10;
const CLAVE_HISTORIAL = 'conversor-historial';

const buscar = (codigo) => MONEDAS.find((m) => m.codigo === codigo);
 
const semilla = (codigo) => codigo.charCodeAt(0) + 2 * codigo.charCodeAt(1) + 3 * codigo.charCodeAt(2);
 
function valorHace(codigo, diasAtras) {
  if (codigo === 'USD') return 1;
  const oscilacion = Math.sin(diasAtras + semilla(codigo));
  return buscar(codigo).valor * (1 + 0.015 * (diasAtras / (DIAS - 1)) * oscilacion);
}

function fechaHace(diasAtras) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function leerHistorial() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch {
    return [];
  }
}
 
export async function obtenerMonedas() {
  return MONEDAS;
}

export async function obtenerSerie(origen, destino) {
  return Array.from({ length: DIAS }, (_, i) => {
    const diasAtras = DIAS - 1 - i;
    return {
      fecha: fechaHace(diasAtras),
      tasa: valorHace(destino, diasAtras) / valorHace(origen, diasAtras),
    };
  });
}

export async function obtenerConversiones() {
  return leerHistorial();
}

export async function guardarConversion({ monto, origen, destino }) {
  const tasa = buscar(destino).valor / buscar(origen).valor;
  const conversion = {
    id: Date.now(),
    monto,
    origen,
    destino,
    tasa,
    resultado: monto * tasa,
    creado_en: new Date().toISOString(),
  };
  const historial = [conversion, ...leerHistorial()].slice(0, MAX_HISTORIAL);
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
  return conversion;
}

export async function borrarConversiones() {
  localStorage.removeItem(CLAVE_HISTORIAL);
}
