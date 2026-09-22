import { numero } from '../formato.js';

function SelectorMoneda({ etiqueta, monedas, valor, onCambio }) {
  return (
    <label>
      {etiqueta}
      <select value={valor} onChange={(evento) => onCambio(evento.target.value)}>
        {monedas.map((moneda) => (
          <option key={moneda.codigo} value={moneda.codigo}>
            {moneda.codigo} · {moneda.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Conversor({
  monedas,
  monto,
  origen,
  destino,
  tasa,
  cantidad,
  onMonto,
  onOrigen,
  onDestino,
  onIntercambiar,
  onGuardar,
}) {
  return (
    <section className="tarjeta tarjeta-conversor">
      <h2>Convertir</h2>

      <form onSubmit={onGuardar}>
        <label>
          Monto
          <input
            type="number"
            value={monto}
            min="0"
            step="any"
            required
            onChange={(evento) => onMonto(evento.target.value)}
          />
        </label>

        <div className="fila-monedas">
          <SelectorMoneda etiqueta="De" monedas={monedas} valor={origen} onCambio={onOrigen} />
          <button
            type="button"
            className="icono"
            onClick={onIntercambiar}
            title="Intercambiar monedas"
            aria-label="Intercambiar monedas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </button>
          <SelectorMoneda etiqueta="A" monedas={monedas} valor={destino} onCambio={onDestino} />
        </div>

        <button type="submit" className="primario">
          Convertir y guardar
        </button>
      </form>

      <div className="resultado">
        <p className="valor">{tasa ? `${numero(cantidad * tasa)} ${destino}` : '-'}</p>
        <p className="tasa">{tasa ? `1 ${origen} = ${numero(tasa, 4)} ${destino}` : ''}</p>
      </div>
    </section>
  );
}
