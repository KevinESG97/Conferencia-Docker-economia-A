
CREATE TABLE tasas (
  codigo VARCHAR(3) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  valor  NUMERIC(18, 8) NOT NULL  
);

CREATE TABLE historial_tasas (
  fecha  DATE NOT NULL,
  moneda VARCHAR(3) NOT NULL REFERENCES tasas (codigo),
  valor  NUMERIC(18, 8) NOT NULL,
  PRIMARY KEY (fecha, moneda)
);

CREATE TABLE conversiones (
  id        SERIAL PRIMARY KEY,
  monto     NUMERIC(18, 2) NOT NULL,
  origen    VARCHAR(3) NOT NULL REFERENCES tasas (codigo),
  destino   VARCHAR(3) NOT NULL REFERENCES tasas (codigo),
  tasa      NUMERIC(18, 8) NOT NULL,
  resultado NUMERIC(18, 2) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tasas (codigo, nombre, valor) VALUES
  ('USD', 'Dólar de EE. UU.', 1),
  ('EUR', 'Euro', 0.92),
  ('GBP', 'Libra esterlina', 0.79),
  ('COP', 'Peso colombiano', 4100),
  ('MXN', 'Peso mexicano', 17.5),
  ('JPY', 'Yen japonés', 150),
  ('GTQ', 'Quetzal guatemalteco', 7.7),
  ('RUB', 'Rublo ruso', 90),
  ('KWD', 'Dinar kuwaití', 0.31);

INSERT INTO historial_tasas (fecha, moneda, valor)
SELECT CURRENT_DATE - dias.d,
       t.codigo,
       CASE WHEN t.codigo = 'USD' THEN 1
            ELSE ROUND((t.valor * (1 + 0.015 * (dias.d / 29.0) * SIN(dias.d + t.semilla)))::numeric, 8)
       END
FROM (
  SELECT codigo,
         valor,
         ASCII(codigo) + 2 * ASCII(SUBSTR(codigo, 2)) + 3 * ASCII(SUBSTR(codigo, 3)) AS semilla
  FROM tasas
) t
CROSS JOIN generate_series(0, 29) AS dias (d);
