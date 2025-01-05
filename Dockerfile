FROM node:21-alpine3.18 AS build

WORKDIR /app


COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install --force @img/sharp-linuxmusl-arm64

COPY src/ src/

RUN npm run build

FROM node:21-alpine3.18

WORKDIR /app

COPY package*.json ./
RUN npm install --force @img/sharp-linuxmusl-arm64

COPY --from=build /app/dist ./dist/

EXPOSE 3100
CMD ["node", "dist/main.js"]
