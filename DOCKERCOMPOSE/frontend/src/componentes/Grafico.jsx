import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cifras, fechaCorta } from '../formato.js';

const COLOR_EJES = '#8b93a7';

export default function Grafico({ puntos, origen, destino }) {
  return (
    <section className="tarjeta ancha tarjeta-grafico">
      <div className="titulo-fila">
        <h2>Evolución de los últimos 30 días</h2>
        <span className="par">
          1 {origen} en {destino}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={puntos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
                 <linearGradient id="linea" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#262c3b" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={fechaCorta}
            stroke={COLOR_EJES}
            tickLine={false}
            axisLine={{ stroke: '#262c3b' }}
            minTickGap={28}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={cifras}
            stroke={COLOR_EJES}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: '#0f131c', border: '1px solid #3b3f70', borderRadius: 8 }}
            labelStyle={{ color: COLOR_EJES }}
            itemStyle={{ color: '#c4b5fd' }}
            cursor={{ stroke: '#6d68c9', strokeDasharray: '4 4' }}
            labelFormatter={fechaCorta}
            formatter={(valor) => [cifras(valor), `1 ${origen} en ${destino}`]}
          />
          <Area
            type="monotone"
            dataKey="tasa"
            stroke="url(#linea)"
            strokeWidth={2.5}
            fill="url(#relleno)"
            dot={false}
            activeDot={{ r: 5, fill: '#c4b5fd', stroke: '#0f131c', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
