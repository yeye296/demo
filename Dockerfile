# 采用纯正官方 2.x 轻量镜像
FROM louislam/uptime-kuma:2-slim

# 指定监听平台要求的 5000 端口
EXPOSE 5000
ENV UPTIME_KUMA_PORT=5000
ENV PORT=5000

# 生产环境
ENV NODE_ENV=production

# 启动命令
CMD ["node", "server/server.js"]
