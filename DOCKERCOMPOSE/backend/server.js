const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'divisas',
});

pool.on('error', (error) => console.error('Error en la conexión con la base de datos:', error.message));

app.get('/api/salud', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ estado: 'ok' });
});

app.get('/api/tasas', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT codigo, nombre, valor::float8 AS valor FROM tasas ORDER BY codigo'
  );
  res.json(rows);
});

app.get('/api/historial', async (req, res) => {
  const { origen, destino } = req.query;
  if (typeof origen !== 'string' || typeof destino !== 'string') {
    return res.status(400).json({ error: 'Faltan los parámetros origen y destino' });
  }

  const { rows } = await pool.query(
    `SELECT to_char(o.fecha, 'YYYY-MM-DD') AS fecha,
            (d.valor / o.valor)::float8 AS tasa
       FROM historial_tasas o
       JOIN historial_tasas d ON d.fecha = o.fecha
      WHERE o.moneda = $1 AND d.moneda = $2
      ORDER BY o.fecha`,
    [origen, destino]
  );
  res.json(rows);
});

const COLUMNAS_CONVERSION = `id, monto::float8 AS monto, origen, destino,
  tasa::float8 AS tasa, resultado::float8 AS resultado, creado_en`;

app.get('/api/conversiones', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_CONVERSION} FROM conversiones ORDER BY creado_en DESC, id DESC LIMIT 10`
  );
  res.json(rows);
});

app.post('/api/conversiones', async (req, res) => {
  const { monto, origen, destino } = req.body ?? {};
  const cantidad = Number(monto);

  if (!Number.isFinite(cantidad) || cantidad < 0 || cantidad > 1e12) {
    return res.status(400).json({ error: 'El monto debe ser un número válido' });
  }
  if (typeof origen !== 'string' || typeof destino !== 'string') {
    return res.status(400).json({ error: 'Faltan las monedas de origen y destino' });
  }

  const { rows: tasas } = await pool.query(
    'SELECT codigo, valor::float8 AS valor FROM tasas WHERE codigo = ANY($1)',
    [[origen, destino]]
  );
  const valorOrigen = tasas.find((t) => t.codigo === origen)?.valor;
  const valorDestino = tasas.find((t) => t.codigo === destino)?.valor;
  if (!valorOrigen || !valorDestino) {
    return res.status(400).json({ error: 'Moneda no soportada' });
  }

  const tasa = valorDestino / valorOrigen;
  const { rows } = await pool.query(
    `INSERT INTO conversiones (monto, origen, destino, tasa, resultado)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNAS_CONVERSION}`,
    [cantidad, origen, destino, tasa, cantidad * tasa]
  );
  res.status(201).json(rows[0]);
});

app.delete('/api/conversiones', async (req, res) => {
  await pool.query('DELETE FROM conversiones');
  res.status(204).end();
});

app.use((error, req, res, next) => {
  const estado = error.status ?? 500;
  if (estado === 500) console.error(error);
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : 'Solicitud inválida' });
});

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => console.log(`API escuchando en el puerto ${puerto}`));
