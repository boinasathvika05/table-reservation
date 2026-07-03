# Multi-stage build for full-stack application

# 1. Build frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Build backend and serve
FROM node:18
WORKDIR /app

# Copy backend package and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose backend port
EXPOSE 5000

# Start Express server
CMD ["npm", "start"]
