FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm ci
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm","run","dev"]

FROM base AS prod
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000

# Run as a non-root user in production for better security
RUN addgroup --system app && adduser --system --ingroup app app || true
RUN chown -R app:app /app
USER app

CMD ["npm","start"]
