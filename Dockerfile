# Idea Kanban Board - Dockerfile
FROM node:20-alpine

LABEL maintainer="DevOps Agent 🚀"
LABEL description="Idea Kanban Board for Project Management"

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY server/ ./server/
COPY public/ ./public/

# Create data directory (will be mounted)
RUN mkdir -p /data/ideas

# Expose port
EXPOSE 3456

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3456/api/ideas || exit 1

# Start the app
CMD ["node", "server/index.js"]
