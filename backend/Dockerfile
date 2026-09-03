FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads && useradd --create-home --uid 10001 retinaai \
    && chown -R retinaai /app
USER retinaai

ENV NODE_ENV=production
EXPOSE 8000

# config/env.js refuses to start on an insecure configuration, so a failed
# container here means a real misconfiguration, not a flaky boot.
CMD ["node", "index.js"]
