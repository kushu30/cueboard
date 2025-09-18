# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package*.json ./client/
COPY client/package-lock.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Build the final production image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Explicitly copy all backend source files and directories
COPY auth.js ./
COPY middleware ./middleware
COPY config ./config
COPY models ./models
COPY reminders.js ./
COPY server.js ./

# Copy ONLY the built frontend from the 'builder' stage
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001
CMD [ "node", "server.js" ]