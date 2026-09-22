export const numero = (n, max = 2) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: max }).format(n);

export const cifras = (n) =>
  new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 5 }).format(n);

export const fechaCorta = (iso) => iso.slice(5).split('-').reverse().join('/');

export const fechaHora = (iso) => new Date(iso).toLocaleString('es-CO');
