# FILE: backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy backend package + lock + tsconfig first
COPY package*.json tsconfig*.json ./

# Install ALL dependencies (including dev for type declarations)
RUN npm install

# Copy backend source code
COPY . .

# Build TypeScript -> dist
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm prune --production

EXPOSE 5000
CMD ["node", "dist/index.js"]
