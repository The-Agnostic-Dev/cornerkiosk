# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5105
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY views ./views
COPY public ./public
EXPOSE 5105
USER node
CMD ["node", "src/server.js"]
