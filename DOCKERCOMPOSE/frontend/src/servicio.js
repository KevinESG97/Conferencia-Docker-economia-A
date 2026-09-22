export const INFO = {
  etiqueta: 'Docker Compose · Nginx + Node/Express + PostgreSQL',
  notaHistorial: 'Guardado en PostgreSQL (lo ve cualquier navegador)',
};

async function api(ruta, opciones) {
  const respuesta = await fetch(`/api${ruta}`, opciones);
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.error || `Error ${respuesta.status}`);
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

export const obtenerMonedas = () => api('/tasas');

export const obtenerSerie = (origen, destino) =>
  api(`/historial?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`);

export const obtenerConversiones = () => api('/conversiones');

export const guardarConversion = (conversion) =>
  api('/conversiones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conversion),
  });

export const borrarConversiones = () => api('/conversiones', { method: 'DELETE' });
