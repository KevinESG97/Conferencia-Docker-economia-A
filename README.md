# Conferencia Docker · Economía

Ejemplo sencillo para entender Docker con una misma aplicación en tres etapas: un **Conversor de Divisas** hecho con **React**, con gráfico de evolución e historial de conversiones.

| Carpeta | Qué muestra | Cómo se ejecuta |
|---|---|---|
| [SINDOCKER](SINDOCKER) | Solo frontend en React. Las tasas están escritas en el código y el historial se guarda en el navegador. | En el computador: `npm install` + `npm run dev` |
| [CONDOCKER](CONDOCKER) | El mismo frontend, compilado y empaquetado en una imagen con **Nginx**. | `docker build` + `docker run` |
| [DOCKERCOMPOSE](DOCKERCOMPOSE) | Frontend + API en **Node/Express** + base de datos **PostgreSQL**. Las tasas y el historial viven en la base de datos. | `docker compose up` |

Las tres versiones comparten los mismos componentes de React. Lo único que cambia es `src/servicio.js`, el archivo que decide **de dónde salen los datos** (del código y localStorage, o de la API).

## Requisitos

- **SINDOCKER:** Node.js 20.19 o superior (o 22.12+). Justo eso es lo que Docker nos ahorra en las otras dos carpetas.
- **CONDOCKER y DOCKERCOMPOSE:** solo **Docker Desktop abierto y corriendo** (si no, todos los comandos `docker` fallan con un error de conexión). No hace falta tener Node instalado.

---

## 1. SINDOCKER (sin Docker)

```bash
cd SINDOCKER
npm install        # descarga las dependencias (React, Vite, Recharts)
npm run dev        # arranca el servidor de desarrollo
```

Abrir <http://localhost:5173>.

## 2. CONDOCKER (con Docker)

```bash
cd CONDOCKER
docker build -t conversor-web .
docker run -d -p 8080:80 conversor-web
```

Abrir <http://localhost:8080>.

`-p 8080:80` conecta el puerto 8080 de tu computador con el puerto 80 del contenedor (donde escucha Nginx).

El [Dockerfile](CONDOCKER/Dockerfile) tiene **dos etapas**: la primera usa Node para compilar React y la segunda copia solo el resultado a una imagen de Nginx. Así la imagen final no lleva Node ni `node_modules`.

## 3. DOCKERCOMPOSE (frontend + backend + base de datos)

```bash
cd DOCKERCOMPOSE
docker compose up --build
```

Abrir <http://localhost:8081>.

Se levantan tres contenedores que se comunican por una red interna:

```text
navegador ──► frontend (Nginx) ──/api──► backend (Node/Express) ──► db (PostgreSQL)
  :8081           :80                          :3000                     :5432
```

La primera vez, PostgreSQL ejecuta [db/init.sql](DOCKERCOMPOSE/db/init.sql), que crea las tablas y carga los datos de ejemplo.

> `init.sql` solo se ejecuta cuando la base de datos se crea desde cero. Si se modifica  (por ejemplo, para agregar una moneda), se debe correr `docker compose down -v` antes de volver a levantar todo; si no, PostgreSQL sigue usando los datos viejos guardados en el volumen.

### Comandos de Docker Compose

```bash
docker compose up --build      # construir imágenes y levantar todo (deja la terminal ocupada)
docker compose up -d           # levantar en segundo plano
docker compose ps              # ver el estado de los servicios
docker compose logs -f         # ver los logs en vivo (Ctrl+C para salir)
docker compose logs backend    # logs de un solo servicio
docker compose stop            # detener sin borrar contenedores
docker compose down            # detener y borrar contenedores (los datos se conservan)
docker compose down -v         # borra el volumen y la base de datos vuelve a empezar de cero
```

Para entrar a la base de datos y ver los datos:

```bash
docker compose exec db psql -U postgres -d divisas -c "SELECT * FROM conversiones;"
```

### Solo Dockerfiles vs Docker Compose

Un **Dockerfile** es la receta para construir **una** imagen. **Docker Compose no lo reemplaza**: usa esos mismos Dockerfiles (con `build:`) y además describe cómo se **ejecutan juntos** varios contenedores: red, variables, puertos, volúmenes y orden de arranque.

En esta carpeta hay dos Dockerfiles: [backend](DOCKERCOMPOSE/backend/Dockerfile) y [frontend](DOCKERCOMPOSE/frontend/Dockerfile). La base de datos no necesita uno porque usa la imagen oficial `postgres:16-alpine`.

#### Opción A: solo Dockerfiles (todo a mano)

Levantar la misma aplicación sin Compose exige 6 comandos, y hay que respetar el orden:

```bash
cd DOCKERCOMPOSE

# 1. Red propia, para que los contenedores se encuentren por nombre
docker network create conversor-red

# 2. Base de datos (imagen oficial, no se construye)
docker run -d --name db --network conversor-red \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=divisas \
  -v pgdata:/var/lib/postgresql/data \
  -v "$(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  postgres:16-alpine

# 3. Backend: construir la imagen y correrla
#    (espera unos segundos a que la base de datos termine de iniciar: docker logs db)
docker build -t divisas-api ./backend
docker run -d --name backend --network conversor-red \
  -e DB_HOST=db -e DB_PORT=5432 -e DB_USER=postgres -e DB_PASSWORD=postgres -e DB_NAME=divisas \
  divisas-api

# 4. Frontend: construir la imagen y correrla
docker build -t divisas-web ./frontend
docker run -d --name frontend --network conversor-red -p 8081:80 divisas-web
```

Abrir <http://localhost:8081>. Para apagar y limpiar:

```bash
docker stop frontend backend db
docker rm frontend backend db
docker network rm conversor-red
docker volume rm pgdata          # opcional: borra también los datos
```

Cosas a tener en cuenta:

- Los nombres `db` y `backend` **no son casuales**: `DB_HOST=db` y el `proxy_pass http://backend:3000` de [nginx.conf](DOCKERCOMPOSE/frontend/nginx.conf) los usan como direcciones dentro de la red.
- **El orden importa.** Si el frontend arranca antes que el backend, Nginx no inicia (no encuentra el host `backend`). Y si el backend arranca antes de que PostgreSQL esté listo, las primeras peticiones fallan.
- En PowerShell usa `${PWD}` en lugar de `$(pwd)`, y el acento grave (`` ` ``) en lugar de `\` para continuar las líneas.
- Usa el mismo puerto 8081 que Compose, así que detén uno antes de levantar el otro.

#### Opción B: Docker Compose

```bash
cd DOCKERCOMPOSE
docker compose up --build        # levantar todo
docker compose down              # apagar (con -v también borra los datos)
```

Todo lo anterior (red, variables, puertos, volúmenes y orden) ya está escrito en [docker-compose.yml](DOCKERCOMPOSE/docker-compose.yml).

#### Comparación

| | Solo Dockerfiles | Docker Compose |
| --- | --- | --- |
| Comandos para levantar todo | 6 (una red, dos `build` y tres `run`) | 1: `docker compose up --build` |
| Red entre contenedores | Creación manual y se indica en cada `run` (`--network`) | Automática: los servicios comparten una red y se llaman por su nombre |
| Configuración (variables, puertos, volúmenes) | Repartida en las opciones `-e`, `-p` y `-v` de cada `docker run` | Reunida en un solo archivo |
| Orden de arranque | Manual | `depends_on` y `healthcheck`: el backend espera a que PostgreSQL esté sano |
| Apagar y limpiar | `stop` y `rm` por cada contenedor, más la red y el volumen | `docker compose down` |
| Compartir el proyecto | Hay que pasar los comandos y que nadie se equivoque | Basta con el archivo: `docker compose up` |
| Cuándo conviene | Una sola imagen  | Varios servicios que trabajan juntos |

#### Qué línea de `docker-compose.yml` reemplaza a qué comando

| En `docker-compose.yml` | Equivale a |
| --- | --- |
| `build: ./backend` | `docker build -t divisas-api ./backend` |
| `image: postgres:16-alpine` | la imagen que se pasa al final de `docker run` |
| Nombre del servicio (`db`, `backend`, `frontend`) | `--name db`, `--name backend`, `--name frontend` |
| `environment:` | `-e VARIABLE=valor` |
| `ports: "8081:80"` | `-p 8081:80` |
| `volumes:` | `-v origen:destino` |
| Red creada automáticamente | `docker network create` y `--network` |
| `depends_on` y `healthcheck` | esperar a que la base de datos esté lista |

---

## Comandos de Docker

### Imágenes

**CONSTRUIR IMAGEN**

```bash
docker build -t [nombre-imagen] .
```

**CREAR CONTENEDOR CON LA IMAGEN**

```bash
docker create [nombre-imagen]
```

**CORRER IMAGEN**

```bash
docker run [nombre-imagen]
```

> `docker run` es lo mismo que `docker create` + `docker start`.
> Para una página web conviene agregar opciones: `docker run -d -p 8080:80 [nombre-imagen]`
> (`-d` la deja en segundo plano y `-p` publica el puerto). `--name [nombre]` le da un nombre propio al contenedor.

### Contenedores

**VER TODOS LOS CONTENEDORES**

```bash
docker ps -a
```

**VER CONTENEDORES CORRIENDO**

```bash
docker ps
```

**RENOMBRAR CONTENEDOR**

```bash
docker rename [id] [nombre-nuevo]
```

**INICIAR CONTENEDOR ESPECIFICO**

```bash
docker start [id]
```

**DETENER CONTENEDOR ESPECIFICO**

```bash
docker stop [id]
```

> En `[id]` también se puede usar el **nombre** del contenedor.

### Otros comandos útiles

```bash
docker images                  # ver las imágenes que tienes
docker logs [id]               # ver lo que imprime un contenedor
docker rm [id]                 # borrar un contenedor (debe estar detenido)
docker rmi [nombre-imagen]     # borrar una imagen
```

### Ejemplo paso a paso con CONDOCKER

```bash
cd CONDOCKER

docker build -t conversor-web .                    # 1. construir la imagen
docker create -p 8080:80 conversor-web             # 2. crear el contenedor (imprime su id)
docker ps -a                                       # 3. verlo: aparece en estado "Created"
docker rename [id] conversor-nginx                 # 4. ponerle un nombre fácil de recordar
docker start conversor-nginx                       # 5. iniciarlo -> abrir http://localhost:8080
docker ps                                          # 6. ahora aparece como corriendo
docker stop conversor-nginx                        # 7. detenerlo -> la página deja de responder
```

---
 

Las tasas de cambio son valores de ejemplo, no datos reales.
