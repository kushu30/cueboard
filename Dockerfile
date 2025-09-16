FROM node:18-alpine AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/client/dist ./client/dist

COPY . .

EXPOSE 3001
CMD [ "node", "server.js" ]