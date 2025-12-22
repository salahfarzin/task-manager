# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# Using ci to strictly install from lockfile (faster and more reliable)
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG VITE_APP_BASE_PATH
ARG VITE_API_URL

# Set environment variables for the build process
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
# Note: Vite builds to 'dist' by default
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY .docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
