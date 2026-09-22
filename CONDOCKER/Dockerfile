# toma la imagen de docker hub
FROM node:22-alpine AS construccion
WORKDIR /app
 
# copia las dependencias
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=construccion /app/dist /usr/share/nginx/html 

EXPOSE 80
