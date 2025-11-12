# Build static assets with Node, then serve with nginx
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image with nginx
FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: copy a minimal nginx.conf if you have SPA routing needs
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
