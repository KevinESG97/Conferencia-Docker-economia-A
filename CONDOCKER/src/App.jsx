import { useEffect, useState } from 'react';
import Conversor from './componentes/Conversor.jsx';
import Grafico from './componentes/Grafico.jsx';
import Historial from './componentes/Historial.jsx';
import {
  INFO,
  borrarConversiones,
  guardarConversion,
  obtenerConversiones,
  obtenerMonedas,
  obtenerSerie,
} from './servicio.js';

export default function App() {
  const [monedas, setMonedas] = useState([]);
  const [monto, setMonto] = useState('100');
  const [origen, setOrigen] = useState('USD');
  const [destino, setDestino] = useState('COP');
  const [serie, setSerie] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState(''); 
  async function intentar(accion) {
    try {
      setError('');
      await accion();
    } catch (fallo) {
      setError(`No se pudo completar la operación: ${fallo.message}`);
    }
  }

  useEffect(() => {
    intentar(async () => {
      const [listaMonedas, conversiones] = await Promise.all([obtenerMonedas(), obtenerConversiones()]);
      setMonedas(listaMonedas);
      setHistorial(conversiones);
    });
  }, []);

  useEffect(() => {
    let vigente = true;
    intentar(async () => {
      const puntos = await obtenerSerie(origen, destino);
      if (vigente) setSerie(puntos);
    });
    return () => {
      vigente = false;
    };
  }, [origen, destino]);

  const valorDe = (codigo) => monedas.find((m) => m.codigo === codigo)?.valor;
  const tasa = monedas.length > 0 ? valorDe(destino) / valorDe(origen) : null;
  const cantidad = parseFloat(monto) || 0;

  function guardar(evento) {
    evento.preventDefault();
    intentar(async () => {
      await guardarConversion({ monto: cantidad, origen, destino });
      setHistorial(await obtenerConversiones());
    });
  }

  function borrar() {
    intentar(async () => {
      await borrarConversiones();
      setHistorial([]);
    });
  }

  function intercambiar() {
    setOrigen(destino);
    setDestino(origen);
  }

  return (
    <>
      <header className="encabezado">
        <h1>Conversor de Divisas</h1>
        <p className="subtitulo">Conferencia Docker · Economía</p>
        <span className="etiqueta">{INFO.etiqueta}</span>
      </header>

      <main className="contenido">
        {error && (
          <p className="aviso ancha" role="alert">
            {error}
          </p>
        )}

        <Conversor
          monedas={monedas}
          monto={monto}
          origen={origen}
          destino={destino}
          tasa={tasa}
          cantidad={cantidad}
          onMonto={setMonto}
          onOrigen={setOrigen}
          onDestino={setDestino}
          onIntercambiar={intercambiar}
          onGuardar={guardar}
        />
        <Historial items={historial} nota={INFO.notaHistorial} onBorrar={borrar} />
        <Grafico puntos={serie} origen={origen} destino={destino} />
      </main>
    </>
  );
}
