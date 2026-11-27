FROM louislam/uptime-kuma:2-slim

USER root

RUN mkdir -p /app/data/upload && chmod -R 777 /app/data

EXPOSE 3001
ENV UPTIME_KUMA_PORT=3001
ENV PORT=3001

ENV NODE_ENV=production

CMD ["node", "server/server.js"]
