import { fechaHora, numero } from '../formato.js';

export default function Historial({ items, nota, onBorrar }) {
  return (
    <section className="tarjeta tarjeta-historial">
      <div className="titulo-fila">
        <h2>Historial</h2>
        <button type="button" className="secundario" onClick={onBorrar}>
          Borrar
        </button>
      </div>
      <p className="nota">{nota}</p>

      <ul className="historial">
        {items.length === 0 && <li className="vacio">Todavía no hay conversiones</li>}
        {items.map((item) => (
          <li key={item.id}>
            {numero(item.monto)} <span className="cod-origen">{item.origen}</span> ={' '}
            <strong>{numero(item.resultado)}</strong> <span className="cod-destino">{item.destino}</span>
            <small>
              Tasa {numero(item.tasa, 4)} · {fechaHora(item.creado_en)}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
